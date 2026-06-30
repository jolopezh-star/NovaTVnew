import { IPTVItem, Category, XtreamCredentials, PlaybackProgress } from './types';

// Parses M3U file content line-by-line
export function parseM3U(m3uContent: string): { items: IPTVItem[]; categories: Category[] } {
  const items: IPTVItem[] = [];
  const categoriesMap = new Map<string, string>(); // id -> name
  
  const lines = m3uContent.split('\n');
  let currentInfo: {
    name: string;
    logo: string;
    group: string;
    year?: string;
  } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.startsWith('#EXTINF:')) {
      // Regexes to parse tvg-logo, group-title, etc.
      const logoMatch = line.match(/tvg-logo="([^"]+)"/) || line.match(/logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      // Get the name which is usually after the last comma
      const commaIndex = line.lastIndexOf(',');
      let name = 'Canal Desconocido';
      if (commaIndex !== -1) {
        name = line.substring(commaIndex + 1).trim();
      }
      
      const logo = logoMatch ? logoMatch[1] : '';
      const group = groupMatch ? groupMatch[1] : 'Canales Generales';
      
      // Categorize as live, movie or series based on group name
      const lowerGroup = group.toLowerCase();
      let type: 'live' | 'movie' | 'series' = 'live';
      if (lowerGroup.includes('pelicula') || lowerGroup.includes('movie') || lowerGroup.includes('cine') || lowerGroup.includes('vod')) {
        type = 'movie';
      } else if (lowerGroup.includes('serie') || lowerGroup.includes('temporada') || lowerGroup.includes('episode')) {
        type = 'series';
      }
      
      currentInfo = { name, logo, group, year: undefined };
    } else if (line.startsWith('http') && currentInfo) {
      const categoryId = slugify(currentInfo.group);
      categoriesMap.set(categoryId, currentInfo.group);
      
      const lowerGroup = currentInfo.group.toLowerCase();
      let type: 'live' | 'movie' | 'series' = 'live';
      if (lowerGroup.includes('pelicula') || lowerGroup.includes('movie') || lowerGroup.includes('cine') || lowerGroup.includes('vod')) {
        type = 'movie';
      } else if (lowerGroup.includes('serie') || lowerGroup.includes('temporada') || lowerGroup.includes('episode')) {
        type = 'series';
      }

      // If name contains a year (e.g. "Movie Name (2022)"), extract it
      const yearMatch = currentInfo.name.match(/\((\d{4})\)/);
      const year = yearMatch ? yearMatch[1] : undefined;
      const cleanName = yearMatch ? currentInfo.name.replace(/\(\d{4}\)/, '').trim() : currentInfo.name;
      
      items.push({
        id: `m3u-${items.length + 1}`,
        name: cleanName,
        logo: currentInfo.logo || 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=120&auto=format&fit=crop&q=80',
        streamUrl: line,
        category: categoryId,
        type,
        year,
        genre: currentInfo.group,
        duration: type === 'movie' ? '1h 50m' : undefined,
        description: type === 'movie' ? `Película de la lista M3U en la categoría ${currentInfo.group}.` : undefined
      });
      
      currentInfo = null;
    }
  }
  
  const categories: Category[] = Array.from(categoriesMap.entries()).map(([id, name]) => {
    // Determine type
    const lowerName = name.toLowerCase();
    let type: 'live' | 'movie' | 'series' = 'live';
    if (lowerName.includes('pelicula') || lowerName.includes('movie') || lowerName.includes('cine') || lowerName.includes('vod')) {
      type = 'movie';
    } else if (lowerName.includes('serie') || lowerName.includes('temporada') || lowerName.includes('episode')) {
      type = 'series';
    }
    return { id, name, type };
  });
  
  return { items, categories };
}

// Converts string to standard alphanumeric ID
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9 -]/g, '')     // remove invalid chars
    .replace(/\s+/g, '-')           // collapse whitespace and replace with -
    .replace(/-+/g, '-');           // collapse dashes
}

// Fetches from Xtream Codes API
export async function testXtreamConnection(
  creds: XtreamCredentials
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = creds.url.replace(/\/$/, '');
  const testApiUrl = `${cleanUrl}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}`;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 6000); // 6s timeout
    const res = await fetch(testApiUrl, { signal: controller.signal });
    clearTimeout(id);
    
if (res.status === 401 || res.status === 403) {
  return {
    success: false,
    message: "Usuario o contraseña incorrectos.",
  };
}

if (!res.ok) {
  return {
    success: false,
    message: `El servidor respondió con el error ${res.status}.`,
  };
}   
    const data = await res.json();
  if (data && data.user_info && data.user_info.auth === 1) {
  return {
    success: true,
    message: "Conexión exitosa.",
  };
}

return {
  success: false,
  message: "Usuario o contraseña incorrectos.",
};  
} catch (error) {

  if (error instanceof DOMException && error.name === 'AbortError') {
    console.error('Tiempo de espera agotado al conectar con el servidor.');
  } else {
    console.error('Error connecting to Xtream server:', error);
  }

 return {
  success: false,
  message: "No fue posible conectar con el servidor.",
}; 
}  
}

export async function fetchXtreamCategories(creds: XtreamCredentials, action: 'get_live_categories' | 'get_vod_categories' | 'get_series_categories'): Promise<Category[]> {
  const cleanUrl = creds.url.replace(/\/$/, '');
  const url = `${cleanUrl}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=${action}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      const type = action === 'get_live_categories' ? 'live' : action === 'get_vod_categories' ? 'movie' : 'series';
      return data.map((cat: any) => ({
        id: `xtream-${type}-${cat.category_id}`,
        name: cat.category_name,
        type
      }));
    }
    return [];
  } catch (e) {
    console.error(`Error fetching categories ${action}:`, e);
    return [];
  }
}

export async function fetchXtreamLiveStreams(creds: XtreamCredentials): Promise<IPTVItem[]> {
  const cleanUrl = creds.url.replace(/\/$/, '');
  const url = `${cleanUrl}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=get_live_streams`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: `live-${item.stream_id}`,
        name: item.name,
        logo: item.stream_icon || 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=120&auto=format&fit=crop&q=80',
        streamUrl: `${cleanUrl}/live/${creds.username}/${creds.password}/${item.stream_id}.m3u8`,
        category: `xtream-live-${item.category_id}`,
        streamId: String(item.stream_id),
epgChannelId: item.epg_channel_id || undefined,
        type: 'live'
      }));
    }
    return [];
  } catch (e) {
    console.error('Error fetching live streams:', e);
    return [];
  }
}

export async function fetchXtreamVodStreams(creds: XtreamCredentials): Promise<IPTVItem[]> {
  const cleanUrl = creds.url.replace(/\/$/, '');
  const url = `${cleanUrl}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=get_vod_streams`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: `movie-${item.stream_id}`,
        name: item.name,
        logo: item.stream_icon || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
        streamUrl: `${cleanUrl}/movie/${creds.username}/${creds.password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
        category: `xtream-movie-${item.category_id}`,
        type: 'movie',
        year: item.year,
        genre: item.genre,
        rating: item.rating,
        duration: item.duration
      }));
    }
    return [];
  } catch (e) {
    console.error('Error fetching VOD streams:', e);
    return [];
  }
}

// Helpers for localStorage persistence
export const storage = {
  getCredentials: (): XtreamCredentials | null => {
    const stored = localStorage.getItem('webos_xtream_creds');
    return stored ? JSON.parse(stored) : null;
  },
  saveCredentials: (creds: XtreamCredentials) => {
    localStorage.setItem('webos_xtream_creds', JSON.stringify(creds));
  },
  clearCredentials: () => {
    localStorage.removeItem('webos_xtream_creds');
  },
  
  getFavorites: (): string[] => {
    const stored = localStorage.getItem('webos_favorites');
    return stored ? JSON.parse(stored) : [];
  },
  saveFavorites: (favs: string[]) => {
    localStorage.setItem('webos_favorites', JSON.stringify(favs));
  },
  
  getProgress: (): PlaybackProgress[] => {
    const stored = localStorage.getItem('webos_playback_progress');
    return stored ? JSON.parse(stored) : [];
  },
  saveProgress: (progress: PlaybackProgress[]) => {
    localStorage.setItem('webos_playback_progress', JSON.stringify(progress));
  },
  
  getM3UList: (): { items: IPTVItem[]; categories: Category[] } | null => {
    const stored = localStorage.getItem('webos_m3u_list');
    return stored ? JSON.parse(stored) : null;
  },
  saveM3UList: (list: { items: IPTVItem[]; categories: Category[] }) => {
    localStorage.setItem('webos_m3u_list', JSON.stringify(list));
  },
  clearM3UList: () => {
    localStorage.removeItem('webos_m3u_list');
  },

  getSettings: () => {
    const stored = localStorage.getItem('webos_settings');
    return stored ? JSON.parse(stored) : null;
  },
  saveSettings: (settings: any) => {
    localStorage.setItem('webos_settings', JSON.stringify(settings));
  }
};
