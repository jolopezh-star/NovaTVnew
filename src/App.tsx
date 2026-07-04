import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Tv, Film, Play, Heart, Clock, Search, Settings, 
  Lock, Unlock, LogOut, Check, Sliders, ChevronRight, 
  Trash2, HelpCircle, Loader2, PlayCircle, Eye, EyeOff, Sparkles, BookOpen
} from 'lucide-react';
import { 
  AppSection, SidebarTab, Category, IPTVItem, Episode, 
  EPGProgram, PlaybackProgress, AppSettings, XtreamCredentials 
} from './types';
import { 
  DEMO_CATEGORIES, DEMO_ITEMS, generateEPG 
} from './data/demoData';
import {
  parseM3U,
  testXtreamConnection,
  fetchXtreamCategories,
  fetchXtreamLiveStreams,
  fetchXtreamVodStreams,
  fetchXtreamSeriesStreams,
  storage
} from './utils';

import Sidebar from './components/Sidebar';
import LoginXtream from './components/LoginXtream';
import LoginM3u from './components/LoginM3u';
import Player from './components/Player';
import PINDialog from './components/PINDialog';
import HomeScreen from './components/HomeScreen';

import {
  fetchShortEPG,
  EPGEntry,
  formatEPGTime,
  getCurrentProgram,
} from './services/epg';
import HomeHeader from "./components/HomeHeader";

export default function App() {


  // --- APPLICATION VIEWS & GENERAL STATES ---
  const [section, setSection] = useState<AppSection>(AppSection.Home);
  const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.Live);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- CONTENT DATA STATES ---
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [items, setItems] = useState<IPTVItem[]>(DEMO_ITEMS);
  const [epgCache, setEpgCache] = useState<Record<string, EPGEntry[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('live-news');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- USER PROGRESS & PREFERENCES ---
  const [favorites, setFavorites] = useState<string[]>([]);
  const [progress, setProgress] = useState<PlaybackProgress[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'es',
    theme: 'electric-dark',
    fontSize: 'normal',
    autoQuality: true,
    hiddenCategories: [],
    adultPin: '1234',
    isAdultPinLocked: true
  });

  // --- CREDENTIALS FORM ---
  const [xtreamCreds, setXtreamCreds] = useState<XtreamCredentials>({
    url: '',
    username: '',
    password: ''
  });
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uRaw, setM3uRaw] = useState('');

  // --- ACTIVE PLAYBACK ---
  const [activePlayItem, setActivePlayItem] = useState<IPTVItem | null>(null);
  
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');
  const [currentEPG, setCurrentEPG] = useState<EPGEntry[]>([]);
const [loadingEPG, setLoadingEPG] = useState(false);


  // --- SERIES DETAIL STATE ---
  const [activeSeriesDetail, setActiveSeriesDetail] = useState<IPTVItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seriesModalFocusIndex, setSeriesModalFocusIndex] = useState<number>(0); // 0: Season selector, 1: Episodes list, 2: Favorite toggle, 3: Close btn

  // --- parental PIN LOCK ---
  const [pendingAdultItem, setPendingAdultItem] = useState<IPTVItem | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [focusedPinKeypadIndex, setFocusedPinKeypadIndex] = useState(0);

  // --- FOCUS SPATIAL INDEXES ---
  const [homeIndex, setHomeIndex] = useState(0); // 0: Xtream, 1: M3U, 2: Demo, 3: Settings
  const [loginFieldIndex, setLoginFieldIndex] = useState(0); // For Xtream / M3u forms
  const [activeArea, setActiveArea] = useState<'sidebar' | 'categories' | 'grid'>('sidebar');
  const [sidebarFocusedIndex, setSidebarFocusedIndex] = useState(0);
  const [categoryFocusedIndex, setCategoryFocusedIndex] = useState(0);
  const [categoryManagerIndex, setCategoryManagerIndex] = useState(0);
  const [gridFocusedIndex, setGridFocusedIndex] = useState(0);
  const [settingsIndex, setSettingsIndex] = useState(0); // Config screen active field
  
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [playerControlFocusedIndex, setPlayerControlFocusedIndex] = useState(0);
  const [playerControlsVisible, setPlayerControlsVisible] = useState(true);

  // --- DYNAMIC REF FOR GRID CONTAINER SCROLL ---
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  // --- INITIAL LOAD & SYNC ---
  useEffect(() => {
    // Load local storage states
    const storedFavorites = storage.getFavorites();
    if (storedFavorites.length > 0) setFavorites(storedFavorites);

    const storedProgress = storage.getProgress();
    if (storedProgress.length > 0) setProgress(storedProgress);

    const storedCreds = storage.getCredentials();
    if (storedCreds) {
      setXtreamCreds(storedCreds);
      // Auto login if possible
      handleXtreamLogin(storedCreds, true);
    } else {
      const storedM3U = storage.getM3UList();
      if (storedM3U) {
        setCategories(storedM3U.categories);
        setItems(storedM3U.items);
        setIsDemoMode(false);
        // Find first live category
        const firstLive = storedM3U.categories.find(c => c.type === 'live');
        if (firstLive) setSelectedCategory(firstLive.id);
      }
    }

    const storedSettings = storage.getSettings();
    if (storedSettings) {
      setSettings(storedSettings);
    }
  }, []);

  // Sync favorites & settings to storage when updated
  useEffect(() => {
    if (favorites.length > 0) storage.saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);
  
 useEffect(() => {

  if (!activePlayItem?.streamId) {
    setCurrentEPG([]);
    setLoadingEPG(false);
    return;
  }
  const loadEPG = async () => {

    const creds = storage.getCredentials();

    if (!creds) return;

    if (!epgCache[activePlayItem.streamId!]) {
  setLoadingEPG(true);
}
if (epgCache[activePlayItem.streamId!]) {
  setCurrentEPG(epgCache[activePlayItem.streamId!]);
  setLoadingEPG(false);
  return;
}
    const epg = await fetchShortEPG(
      creds,
      activePlayItem.streamId!
    );

    setCurrentEPG(epg);
    setEpgCache(prev => ({
  ...prev,
  [activePlayItem.streamId!]: epg,
}));
    setLoadingEPG(false);

    console.log("EPG recibido:", epg);

  };

  loadEPG();

}, [activePlayItem]);
useEffect(() => {

  if (section !== AppSection.Main) return;

  const channel = filteredItems[gridFocusedIndex];

  if (!channel?.streamId) return;
  if (epgCache[channel.streamId]) {
  setCurrentEPG(epgCache[channel.streamId]);
  return;
}

  const loadPreviewEPG = async () => {

    const creds = storage.getCredentials();

    if (!creds) return;

    const epg = await fetchShortEPG(
      creds,
      channel.streamId!
    );

    setCurrentEPG(epg);

setEpgCache(prev => ({
  ...prev,
  [channel.streamId!]: epg,
}));

  };
  const timer = setTimeout(() => {
  loadPreviewEPG();
}, 250);

return () => clearTimeout(timer);

  

}, [gridFocusedIndex, selectedCategory, activeTab]);

  // Handle active category defaulting based on active tab
  useEffect(() => {
    const tabType = activeTab === SidebarTab.Live ? 'live' : activeTab === SidebarTab.Movies ? 'movie' : 'series';
    const firstCatOfTab = categories.find(c => c.type === tabType);
    if (firstCatOfTab) {
      setSelectedCategory(firstCatOfTab.id);
      setCategoryFocusedIndex(categories.indexOf(firstCatOfTab));
    }
    setGridFocusedIndex(0);
  }, [activeTab, categories]);

  // Get active items in grid
  const getFilteredItems = (): IPTVItem[] => {
    let result = items;

    // Filter by type
    if (activeTab === SidebarTab.Live) {
      result = items.filter(i => i.type === 'live' && i.category === selectedCategory);
    } else if (activeTab === SidebarTab.Movies) {
      result = items.filter(i => i.type === 'movie' && i.category === selectedCategory);
    } else if (activeTab === SidebarTab.Series) {
      result = items.filter(i => i.type === 'series' && i.category === selectedCategory);
    } else if (activeTab === SidebarTab.Favorites) {
      result = items.filter(i => favorites.includes(i.id));
    } else if (activeTab === SidebarTab.Recents) {
      const recentIds = progress.map(p => p.itemId.split('-')[0]); // Strip episode suffixes
      result = items.filter(i => recentIds.includes(i.id));
    } else if (activeTab === SidebarTab.Search) {
      if (!searchQuery) return [];
      result = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Hide categories configured in Settings (except adult category which uses PIN instead)
    if (settings.hiddenCategories.length > 0) {
      result = result.filter(i => !settings.hiddenCategories.includes(i.category));
    }

    return result;
  };

  const filteredItems = useMemo(
  () => getFilteredItems(),
  [
    items,
    activeTab,
    selectedCategory,
    favorites,
    progress,
    searchQuery,
    settings.hiddenCategories,
  ]
);
  const activeCategoriesOfTab = categories.filter(c => {

  if (settings.hiddenCategories.includes(c.id)) {
    return false;
  }

  if (activeTab === SidebarTab.Live) return c.type === 'live';
  if (activeTab === SidebarTab.Movies) return c.type === 'movie';
  if (activeTab === SidebarTab.Series) return c.type === 'series';

  return false;
});
const allCategories = useMemo(() => {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}, [categories]);
  // --- CONNECTING & PARSING MECHANISMS ---
  const handleXtreamLogin = async (creds: XtreamCredentials, isAuto = false) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      
      const result = await testXtreamConnection(creds);
      console.log("Resultado conexión:", result);

if (result.success) {
        storage.saveCredentials(creds);
        setIsDemoMode(false);
        
        // Fetch Live/VOD categories & streams
        const [
  liveCats,
  vodCats,
  seriesCats,
  liveStreams,
  vodStreams,
  seriesStreams
] = await Promise.all([
          fetchXtreamCategories(creds, 'get_live_categories'),
          fetchXtreamCategories(creds, 'get_vod_categories'),
          fetchXtreamCategories(creds, 'get_series_categories'),
          fetchXtreamLiveStreams(creds),
fetchXtreamVodStreams(creds),
fetchXtreamSeriesStreams(creds)
        ]);

        const mergedCats = [...liveCats, ...vodCats, ...seriesCats];
        const mergedStreams = [
  ...liveStreams,
  ...vodStreams,
  ...seriesStreams
];

        if (mergedCats.length > 0) setCategories(mergedCats);
        if (mergedStreams.length > 0) setItems(mergedStreams);

        // Save categories and items to storage to allow offline boot later
        //storage.saveM3UList({ items: mergedStreams, categories: mergedCats });

        // Set default category
        const firstCat = mergedCats.find(c => c.type === 'live');
        if (firstCat) setSelectedCategory(firstCat.id);

        setSection(AppSection.Main);
        setActiveArea('sidebar');
      } else {
  if (!isAuto) {
    setErrorMessage(result.message);
  }
}
    } catch (e) {
  console.error("Error después del login:", e);
  setErrorMessage('Error al conectar con el servidor Xtream Codes.');
} finally {
      setIsLoading(false);
    }
  };

  const handleM3ULogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let content = m3uRaw.trim();
      if (m3uUrl) {
        // Fetch from URL
        const res = await fetch(m3uUrl);
        if (res.ok) {
          content = await res.text();
        } else {
          setErrorMessage('No se pudo descargar la lista M3U de la URL especificada.');
          setIsLoading(false);
          return;
        }
      }

      if (!content.startsWith('#EXTM3U')) {
        setErrorMessage('Formato M3U inválido. Debe comenzar con #EXTM3U');
        setIsLoading(false);
        return;
      }

      const parsed = parseM3U(content);
      if (parsed.items.length === 0) {
        setErrorMessage('No se encontraron canales válidos en el archivo M3U.');
        setIsLoading(false);
        return;
      }

      setCategories(parsed.categories);
      setItems(parsed.items);
      setIsDemoMode(false);
      storage.saveM3UList(parsed);

      // Reset default category
      const firstLive = parsed.categories.find(c => c.type === 'live') || parsed.categories[0];
      if (firstLive) setSelectedCategory(firstLive.id);

      setSection(AppSection.Main);
      setActiveArea('sidebar');
    } catch (e) {
      setErrorMessage('Ocurrió un error al procesar la lista M3U.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoPlaylists = () => {
    setIsDemoMode(true);
    setCategories(DEMO_CATEGORIES);
    setItems(DEMO_ITEMS);
    setSelectedCategory('live-news');
    setSection(AppSection.Main);
    setActiveArea('sidebar');
  };
const getProgramProgress = (start: string, end: string): number => {

  const now = Date.now();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (now <= startTime) return 0;
  if (now >= endTime) return 100;

  return ((now - startTime) / (endTime - startTime)) * 100;

};
  // --- PLAYER TRIGGERS & PIN CHECK ---
  const changeChannel = (direction: 1 | -1) => {

  if (!activePlayItem || activePlayItem.type !== "live") return;

  const liveChannels = getFilteredItems().filter(i => i.type === "live");

  const index = liveChannels.findIndex(
    
    c => c.id === activePlayItem.id
  );

  if (index === -1) return;

  let next = index + direction;

  if (next < 0) next = liveChannels.length - 1;
  if (next >= liveChannels.length) next = 0;
setPlayerControlsVisible(false);
  setGridFocusedIndex(next);
  

queueMicrotask(() => {
  
  setActivePlayItem(liveChannels[next]);
  setPlayerControlsVisible(false);
});
  

};
  const triggerPlay = (item: IPTVItem, epId?: string) => {
    // Adult content parental PIN verification
    if (item.category === 'live-adult' && settings.isAdultPinLocked && settings.adultPin) {
      setPendingAdultItem(item);
      setPinInput('');
      setPinError('');
      setFocusedPinKeypadIndex(0);
      setSection(AppSection.PinLock);
      return;
    }
const img = new Image();
  img.src = item.logo;
    setActivePlayItem(item);
    if (epId) setActiveEpisodeId(epId);
    setPlayerControlFocusedIndex(0);
    setPlayerControlsVisible(true);
    setSection(AppSection.Player);
  };

  const verifyParentalPIN = () => {
    if (pinInput === settings.adultPin) {
      setSection(AppSection.Main);
      if (pendingAdultItem) {
        const item = pendingAdultItem;
        setPendingAdultItem(null);
        triggerPlay(item);
      }
    } else {
      setPinInput('');
      setPinError('PIN incorrecto. Intenta de nuevo.');
    }
  };

  // --- SERIES DETAILS ---
  const openSeriesDetail = (series: IPTVItem) => {
    setActiveSeriesDetail(series);
    setSelectedSeason(1);
    setSeriesModalFocusIndex(0); // Default focus on the first element (Season Selector)
  };

  // --- RESET & CACHE CLEAR ---
  const clearCacheAndReset = () => {
    storage.clearCredentials();
    storage.clearM3UList();
    localStorage.removeItem('webos_favorites');
    localStorage.removeItem('webos_playback_progress');
    localStorage.removeItem('webos_settings');
    window.location.reload();
  };

  // --- SPATIAL KEYBOARD CONTROL MATRIX ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling defaults on TV Arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const target = e.target as HTMLElement;

if (
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA'
) {
  return;
}

      // 1. --- HOME SECTION SPATIAL NAV ---
      if (section === AppSection.Home) {
        if (e.key === 'ArrowDown') {
          setHomeIndex(prev => (prev + 1) % 4);
        } else if (e.key === 'ArrowUp') {
          setHomeIndex(prev => (prev - 1 + 4) % 4);
        } else if (e.key === 'Enter') {
          if (homeIndex === 0) setSection(AppSection.LoginXtream);
          else if (homeIndex === 1) setSection(AppSection.LoginM3u);
          else if (homeIndex === 2) loadDemoPlaylists();
          else if (homeIndex === 3) {
            setSection(AppSection.Main);
            setActiveTab(SidebarTab.SettingsTab);
            setActiveArea('grid');
            setSettingsIndex(0);
          }
        }
      }

      // 2. --- LOGIN XTREAM SPATIAL NAV ---
      else if (section === AppSection.LoginXtream) {
        if (e.key === 'ArrowDown') {
          setLoginFieldIndex(prev => (prev + 1) % 6);
        } else if (e.key === 'ArrowUp') {
          setLoginFieldIndex(prev => (prev - 1 + 6) % 6);
        } else if (e.key === 'Backspace' || e.key === 'Escape') {
          setSection(AppSection.Home);
        } else if (e.key === 'Enter') {
          if (loginFieldIndex === 3) handleXtreamLogin(xtreamCreds);
          else if (loginFieldIndex === 4) setSection(AppSection.Home);
          else if (loginFieldIndex === 5) loadDemoPlaylists();
        }
      }

      // 3. --- LOGIN M3U SPATIAL NAV ---
      else if (section === AppSection.LoginM3u) {
        if (e.key === 'ArrowDown') {
          setLoginFieldIndex(prev => (prev + 1) % 5);
        } else if (e.key === 'ArrowUp') {
          setLoginFieldIndex(prev => (prev - 1 + 5) % 5);
        } else if (e.key === 'Backspace' || e.key === 'Escape') {
          setSection(AppSection.Home);
        } else if (e.key === 'Enter') {
          if (loginFieldIndex === 2) handleM3ULogin();
          else if (loginFieldIndex === 3) setSection(AppSection.Home);
          else if (loginFieldIndex === 4) loadDemoPlaylists();
        }
      }

      // 4. --- MAIN CATALOG SECTION SPATIAL NAV ---
      else if (section === AppSection.Main) {
        
        // A. SIDEBAR FOCUS AREA
        if (activeArea === 'sidebar') {
          if (e.key === 'ArrowDown') {
            const nextIdx = (sidebarFocusedIndex + 1) % 7;
            setSidebarFocusedIndex(nextIdx);
            // Map tab enum
            const tabs = [
              SidebarTab.Live, SidebarTab.Movies, SidebarTab.Series, 
              SidebarTab.Favorites, SidebarTab.Recents, SidebarTab.Search, SidebarTab.SettingsTab
            ];
            setActiveTab(tabs[nextIdx]);
          } else if (e.key === 'ArrowUp') {
            const prevIdx = (sidebarFocusedIndex - 1 + 7) % 7;
            setSidebarFocusedIndex(prevIdx);
            const tabs = [
              SidebarTab.Live, SidebarTab.Movies, SidebarTab.Series, 
              SidebarTab.Favorites, SidebarTab.Recents, SidebarTab.Search, SidebarTab.SettingsTab
            ];
            setActiveTab(tabs[prevIdx]);
          } else if (e.key === 'ArrowRight') {
            // Move to Categories list if TV, Movies, or Series. Otherwise move to Grid.
            const hasCategories = [SidebarTab.Live, SidebarTab.Movies, SidebarTab.Series].includes(activeTab);
            if (hasCategories && activeCategoriesOfTab.length > 0) {
              setActiveArea('categories');
              setCategoryFocusedIndex(0);
            } else {
              setActiveArea('grid');
              setGridFocusedIndex(0);
            }
          } else if (e.key === 'Backspace' || e.key === 'Escape') {
            setSection(AppSection.Home);
          }
        }

        // B. CATEGORIES PANEL FOCUS AREA
        else if (activeArea === 'categories') {
          if (e.key === 'ArrowDown') {
            if (categoryFocusedIndex < activeCategoriesOfTab.length - 1) {
              const nextCatIdx = categoryFocusedIndex + 1;
              setCategoryFocusedIndex(nextCatIdx);
              setSelectedCategory(activeCategoriesOfTab[nextCatIdx].id);
              // Scroll category list item into view
              categoryContainerRef.current?.children[nextCatIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          } else if (e.key === 'ArrowUp') {
            if (categoryFocusedIndex > 0) {
              const prevCatIdx = categoryFocusedIndex - 1;
              setCategoryFocusedIndex(prevCatIdx);
              setSelectedCategory(activeCategoriesOfTab[prevCatIdx].id);
              categoryContainerRef.current?.children[prevCatIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          } else if (e.key === 'ArrowLeft') {
            setActiveArea('sidebar');
          } else if (e.key === 'ArrowRight') {
            if (filteredItems.length > 0) {
              setActiveArea('grid');
              setGridFocusedIndex(0);
            }
          } else if (e.key === 'Backspace' || e.key === 'Escape') {

  if (showCategoryManager) {
    setShowCategoryManager(false);
    return;
  }

  setActiveArea('sidebar');
}
        }

        // C. MAIN GRID VIEW AREA (Channels, Posters, Settings)
        else if (activeArea === 'grid') {
          
          // SERIES DETAIL MODAL SPATIAL ENGINE
          if (activeSeriesDetail) {
            const episodes = activeSeriesDetail.episodes?.filter(e => e.season === selectedSeason) || [];
            
            if (e.key === 'ArrowRight') {
              if (seriesModalFocusIndex === 0) {
                // Next Season
                if (selectedSeason < (activeSeriesDetail.seasonsCount || 1)) setSelectedSeason(prev => prev + 1);
              } else if (seriesModalFocusIndex === 1) {
                // Focus close btn or favorited
                setSeriesModalFocusIndex(2);
              } else if (seriesModalFocusIndex === 2) {
                setSeriesModalFocusIndex(3);
              }
            } else if (e.key === 'ArrowLeft') {
              if (seriesModalFocusIndex === 0) {
                if (selectedSeason > 1) setSelectedSeason(prev => prev - 1);
              } else if (seriesModalFocusIndex >= 2) {
                setSeriesModalFocusIndex(1);
              }
            } else if (e.key === 'ArrowDown') {
              if (seriesModalFocusIndex === 0 && episodes.length > 0) {
                setSeriesModalFocusIndex(1); // focus episode list
                setGridFocusedIndex(0);
              } else if (seriesModalFocusIndex === 1) {
                // Move down in episodes list
                if (gridFocusedIndex < episodes.length - 1) setGridFocusedIndex(prev => prev + 1);
              } else if (seriesModalFocusIndex >= 2) {
                setSeriesModalFocusIndex(1);
                setGridFocusedIndex(0);
              }
            } else if (e.key === 'ArrowUp') {
              if (seriesModalFocusIndex === 1) {
                if (gridFocusedIndex > 0) {
                  setGridFocusedIndex(prev => prev - 1);
                } else {
                  setSeriesModalFocusIndex(0); // return to Season tabs
                }
              }
            } else if (e.key === 'Enter') {
              if (seriesModalFocusIndex === 1 && episodes[gridFocusedIndex]) {
                triggerPlay(activeSeriesDetail, episodes[gridFocusedIndex].id);
              } else if (seriesModalFocusIndex === 2) {
                // Favorite toggle
                if (favorites.includes(activeSeriesDetail.id)) {
                  setFavorites(favorites.filter(id => id !== activeSeriesDetail.id));
                } else {
                  setFavorites([...favorites, activeSeriesDetail.id]);
                }
              } else if (seriesModalFocusIndex === 3) {
                setActiveSeriesDetail(null);
              }
            } else if (e.key === 'Backspace' || e.key === 'Escape') {
              setActiveSeriesDetail(null);
            }
            return;
          }

          // SETTINGS PANEL TAB SPATIAL NAVIGATION
          if (activeTab === SidebarTab.SettingsTab) {
            if (e.key === 'ArrowDown') {
              setSettingsIndex(prev => (prev + 1) % 7);
            } else if (e.key === 'ArrowUp') {
              setSettingsIndex(prev => (prev - 1 + 7) % 7);
            } else if (e.key === 'ArrowLeft') {
              setActiveArea('sidebar');
            } else if (e.key === 'Enter') {
              if (settingsIndex === 0) {
                // Language Toggle
                setSettings(prev => ({ ...prev, language: prev.language === 'es' ? 'en' : 'es' }));
              } else if (settingsIndex === 1) {
                // Font size Toggle
                const sizes: ('normal'|'large'|'extra-large')[] = ['normal', 'large', 'extra-large'];
                const nextSizeIdx = (sizes.indexOf(settings.fontSize) + 1) % sizes.length;
                setSettings(prev => ({ ...prev, fontSize: sizes[nextSizeIdx] }));
              } else if (settingsIndex === 2) {
                // Toggle Quality
                setSettings(prev => ({ ...prev, autoQuality: !prev.autoQuality }));
              } else if (settingsIndex === 3) {
                // Toggle Parental locked state
                setSettings(prev => ({ ...prev, isAdultPinLocked: !prev.isAdultPinLocked }));
              } else if (settingsIndex === 4) {
  // Category Manager
  setShowCategoryManager(true);

} else if (settingsIndex === 5) {
  // Clear cache & Reset App
  if (confirm('¿Estás seguro de que deseas restablecer la aplicación? Se borrarán tus listas, favoritos e historial.')) {
    clearCacheAndReset();
  }

} else if (settingsIndex === 6) {
  // Exit Settings / Return to TV
  setShowCategoryManager(false);
  setActiveArea('sidebar');
  setSidebarFocusedIndex(0);
  setActiveTab(SidebarTab.Live);
}
            } else if (e.key === 'Backspace' || e.key === 'Escape') {

  if (showCategoryManager) {
    setShowCategoryManager(false);
  } else {
    setActiveArea('sidebar');
  }

}
            return;
          }

          // GENERAL GRID COLS & CALCULATIONS (4 Columns layout for TV optimized spacing)
          const cols = 4;
          const rowsCount = Math.ceil(filteredItems.length / cols);

          if (e.key === 'ArrowRight') {
            if ((gridFocusedIndex + 1) % cols !== 0 && gridFocusedIndex + 1 < filteredItems.length) {
              setGridFocusedIndex(prev => prev + 1);
            }
          } else if (e.key === 'ArrowLeft') {
            if (gridFocusedIndex % cols !== 0) {
              setGridFocusedIndex(prev => prev - 1);
            } else {
              // Return to Categories column or Sidebar
              const hasCategories = [SidebarTab.Live, SidebarTab.Movies, SidebarTab.Series].includes(activeTab);
              if (hasCategories && activeCategoriesOfTab.length > 0) {
                setActiveArea('categories');
              } else {
                setActiveArea('sidebar');
              }
            }
          } else if (e.key === 'ArrowDown') {
            if (gridFocusedIndex + cols < filteredItems.length) {
              setGridFocusedIndex(prev => prev + cols);
            }
          } else if (e.key === 'ArrowUp') {
            if (gridFocusedIndex - cols >= 0) {
              setGridFocusedIndex(prev => prev - cols);
            }
          } else if (e.key === 'Backspace' || e.key === 'Escape') {
            const hasCategories = [SidebarTab.Live, SidebarTab.Movies, SidebarTab.Series].includes(activeTab);
            if (hasCategories) setActiveArea('categories');
            else setActiveArea('sidebar');
          } else if (e.key === 'Enter') {
            const focusedItem = filteredItems[gridFocusedIndex];
            if (focusedItem) {
              if (focusedItem.type === 'series') {
                openSeriesDetail(focusedItem);
              } else {
                triggerPlay(focusedItem);
              }
            }
          }

          // Color Keys (Teclas de colores del mando LG)
          if (e.key === 'r' || e.key === 'KeyR' || e.key.toLowerCase() === 'r') {
            // RED BUTTON: Fast Toggle Favorite
            const focusedItem = filteredItems[gridFocusedIndex];
            if (focusedItem) {
              if (favorites.includes(focusedItem.id)) {
                setFavorites(favorites.filter(id => id !== focusedItem.id));
              } else {
                setFavorites([...favorites, focusedItem.id]);
              }
            }
          } else if (e.key === 'g' || e.key === 'KeyG' || e.key.toLowerCase() === 'g') {
            // GREEN BUTTON: Quick trigger Search
            setActiveArea('sidebar');
            setSidebarFocusedIndex(5);
            setActiveTab(SidebarTab.Search);
          }
        }
      }

      // 5. --- parental PIN LOCK SCREEN NAV ---
      else if (section === AppSection.PinLock) {
        if (e.key === 'ArrowDown') {
          setFocusedPinKeypadIndex(prev => (prev + 3) % 12);
        } else if (e.key === 'ArrowUp') {
          setFocusedPinKeypadIndex(prev => (prev - 3 + 12) % 12);
        } else if (e.key === 'ArrowRight') {
          setFocusedPinKeypadIndex(prev => (prev + 1) % 12);
        } else if (e.key === 'ArrowLeft') {
          setFocusedPinKeypadIndex(prev => (prev - 1 + 12) % 12);
        } else if (e.key === 'Backspace' || e.key === 'Escape') {
          setSection(AppSection.Main);
          setPendingAdultItem(null);
        } else if (e.key === 'Enter') {
          const keypadKeys = [
            '1', '2', '3',
            '4', '5', '6',
            '7', '8', '9',
            'Cancelar', '0', 'Borrar'
          ];
          const activeKey = keypadKeys[focusedPinKeypadIndex];
          if (activeKey === 'Cancelar') {
            setSection(AppSection.Main);
            setPendingAdultItem(null);
          } else if (activeKey === 'Borrar') {
            setPinInput(prev => prev.slice(0, -1));
          } else {
            if (pinInput.length < 4) {
              setPinInput(prev => prev + activeKey);
            }
          }
        }
      }

      // 6. --- CUSTOM PLAYER HUD CONTROLS NAV ---
      else if (section === AppSection.Player && activePlayItem) {
        if (!playerControlsVisible) {
          // If controls are hidden, any arrow or enter key reveals them instantly!
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            setPlayerControlsVisible(true);
            setPlayerControlFocusedIndex(0); // Focus Play/Pause by default
            return;
          }
          if (e.key === 'Backspace' || e.key === 'Escape') {
            setSection(AppSection.Main);
          }
          return;
        }

        // If controls ARE visible:
        if (e.key === 'ArrowRight') {
          setPlayerControlFocusedIndex(prev => (prev + 1) % 7);
        } else if (e.key === 'ArrowLeft') {
          setPlayerControlFocusedIndex(prev => (prev - 1 + 7) % 7);
        } else if (e.key === 'ArrowUp') {
  changeChannel(-1);
}
else if (e.key === 'ArrowDown') {
  changeChannel(1);
} else if (e.key === 'Backspace' || e.key === 'Escape') {
          setSection(AppSection.Main);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    section, activeTab, activeArea, homeIndex, loginFieldIndex, sidebarFocusedIndex, 
    categoryFocusedIndex, gridFocusedIndex, filteredItems, activeCategoriesOfTab, 
    xtreamCreds, m3uUrl, m3uRaw, activeSeriesDetail, selectedSeason, seriesModalFocusIndex, 
    favorites, focusedPinKeypadIndex, pinInput, settings, playerControlsVisible, 
    playerControlFocusedIndex, activePlayItem
  ]);

  // Handle grid list items programmatic scroll alignment
  useEffect(() => {
    if (activeArea === 'grid' && gridContainerRef.current) {
      const activeElement = gridContainerRef.current.children[gridFocusedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [gridFocusedIndex, activeArea]);

  // Helper text size classes
  const fontClass = settings.fontSize === 'large' ? 'text-lg' : settings.fontSize === 'extra-large' ? 'text-xl' : 'text-sm';
  const headerFontClass = settings.fontSize === 'large' ? 'text-3xl' : settings.fontSize === 'extra-large' ? 'text-4xl' : 'text-2xl';

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-sans overflow-hidden select-none`}>
      
      {/* 1. --- APP INITIAL HOME LANDING SCREEN --- */}
      {section === AppSection.Home && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#050505]">
          
          {/* Ambient Cosmic Lights */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#0066FF]/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0066FF]/2 rounded-full blur-3xl -z-10" />

         <HomeHeader
  title={
    <>
      Nova<span className="text-[#0066FF]">TV</span>
    </>
  }
  subtitle="Simple. Rápido. Elegante."
/>

          {/* Core Navigation Options Panel */}
          <div className="w-full max-w-sm flex flex-col gap-4">
            
            {/* Xtream API option */}
            <button
              className={`flex items-center gap-4 px-6 py-4.5 rounded-2xl font-display font-bold uppercase tracking-wider transition-all outline-none border ${
                homeIndex === 0
                  ? 'bg-[#0066FF] text-white shadow-[0_0_25px_rgba(0,102,255,0.45)] scale-105 border-transparent'
                  : 'bg-[#0C0C0C] text-white/60 border-white/5 hover:text-white'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                homeIndex === 0 ? 'bg-white/10 border-white/20 text-white' : 'bg-[#141414] border-white/5 text-white/40'
              }`}>
                <Sparkles className="w-5 h-5 text-inherit" />
              </div>
              <div className="text-left">
                <span className="block text-sm">Conectar Xtream Codes</span>
                <span className={`text-[10px] font-mono lowercase tracking-normal ${homeIndex === 0 ? 'text-white/70' : 'text-white/30'}`}>Accede con tu usuario y contraseña</span>
              </div>
            </button>

            {/* M3U List option */}
            <button
              className={`flex items-center gap-4 px-6 py-4.5 rounded-2xl font-display font-bold uppercase tracking-wider transition-all outline-none border ${
                homeIndex === 1
                  ? 'bg-[#0066FF] text-white shadow-[0_0_25px_rgba(0,102,255,0.45)] scale-105 border-transparent'
                  : 'bg-[#0C0C0C] text-white/60 border-white/5 hover:text-white'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                homeIndex === 1 ? 'bg-white/10 border-white/20 text-white' : 'bg-[#141414] border-white/5 text-white/40'
              }`}>
                <BookOpen className="w-5 h-5 text-inherit" />
              </div>
              <div className="text-left">
                <span className="block text-sm">Cargar Lista M3U</span>
                <span className={`text-[10px] font-mono lowercase tracking-normal ${homeIndex === 1 ? 'text-white/70' : 'text-white/30'}`}>Cargar vía URL o pegar texto plano</span>
              </div>
            </button>

            {/* Demo Option */}
            <button
              className={`flex items-center gap-4 px-6 py-4.5 rounded-2xl font-display font-bold uppercase tracking-wider transition-all outline-none border ${
                homeIndex === 2
                  ? 'bg-[#0066FF] text-white shadow-[0_0_25px_rgba(0,102,255,0.45)] scale-105 border-transparent'
                  : 'bg-[#0C0C0C] text-white/60 border-white/5 hover:text-white'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                homeIndex === 2 ? 'bg-white/10 border-white/20 text-white' : 'bg-[#141414] border-white/5 text-white/40'
              }`}>
                <Play className="w-5 h-5 text-inherit fill-current" />
              </div>
              <div className="text-left">
                <span className="block text-sm">Modo Demo</span>
                <span className={`text-[10px] font-mono lowercase tracking-normal ${homeIndex === 2 ? 'text-white/70' : 'text-white/30'}`}>Explora NovaTV sin iniciar sesión</span>
              </div>
            </button>

            {/* Settings Option */}
            <button
              className={`flex items-center gap-4 px-6 py-4.5 rounded-2xl font-display font-bold uppercase tracking-wider transition-all outline-none border ${
                homeIndex === 3
                  ? 'bg-[#0066FF] text-white shadow-[0_0_25px_rgba(0,102,255,0.45)] scale-105 border-transparent'
                  : 'bg-[#0C0C0C] text-white/60 border-white/5 hover:text-white'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                homeIndex === 3 ? 'bg-white/10 border-white/20 text-white' : 'bg-[#141414] border-white/5 text-white/40'
              }`}>
                <Settings className="w-5 h-5 text-inherit" />
              </div>
              <div className="text-left">
                <span className="block text-sm">Configuración</span>
                <span className={`text-[10px] font-mono lowercase tracking-normal ${homeIndex === 3 ? 'text-white/70' : 'text-white/30'}`}>Ajustes visuales y de red del reproductor</span>
              </div>
            </button>

          </div>

          {/* Quick instructions indicator */}
          <div className="absolute bottom-8 left-8 right-8 text-[10px] text-white/30 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="bg-[#0C0C0C] border border-white/5 px-2 py-0.5 rounded font-mono">▲ ▼</span> Mover foco</span>
            <span className="flex items-center gap-1.5"><span className="bg-[#0C0C0C] border border-white/5 px-2 py-0.5 rounded font-mono">OK / Enter</span> Confirmar acción</span>
          </div>

        </div>
      )}

      {/* 2. --- LOGIN XTREAM SCREEN --- */}
      {section === AppSection.LoginXtream && (
        <LoginXtream
          fieldIndex={loginFieldIndex}
          credentials={xtreamCreds}
          onChangeCreds={setXtreamCreds}
          onSubmit={() => handleXtreamLogin(xtreamCreds)}
          onBack={() => setSection(AppSection.Home)}
          onLoadDemo={loadDemoPlaylists}
          errorMessage={errorMessage}
          isLoading={isLoading}
        />
      )}

      {/* 3. --- LOGIN M3U SCREEN --- */}
      {section === AppSection.LoginM3u && (
        <LoginM3u
          fieldIndex={loginFieldIndex}
          urlValue={m3uUrl}
          onChangeUrl={setM3uUrl}
          rawValue={m3uRaw}
          onChangeRaw={setM3uRaw}
          onSubmit={handleM3ULogin}
          onBack={() => setSection(AppSection.Home)}
          onLoadDemo={loadDemoPlaylists}
          errorMessage={errorMessage}
          isLoading={isLoading}
        />
      )}

      {/* 4. --- MAIN IPTV CATEGORIES & STREAMS CATALOG SCREEN --- */}
      {section === AppSection.Main && (
        <div className="min-h-screen flex bg-[#050505]">
          
          {/* Main vertical expandible sidebar */}
          <Sidebar
            activeTab={activeTab}
            focusedIndex={sidebarFocusedIndex}
            activeArea={activeArea}
            onSelectTab={(tab) => {
  setShowCategoryManager(false);
  setActiveTab(tab);
  setActiveArea('grid');
  setGridFocusedIndex(0);
}}
            fontSize={settings.fontSize}
          />

          {/* Main contents container */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
            
            {/* Catalog Top Status Banner */}
            <div className="h-20 px-8 border-b border-white/5 bg-[#0C0C0C] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
                  {activeTab === SidebarTab.Live && 'Televisión En Vivo'}
                  {activeTab === SidebarTab.Movies && 'Películas VOD'}
                  {activeTab === SidebarTab.Series && 'Series de Televisión'}
                  {activeTab === SidebarTab.Favorites && 'Mis Favoritos'}
                  {activeTab === SidebarTab.Recents && 'Historial Reciente'}
                  {activeTab === SidebarTab.Search && 'Buscador Global'}
                  {activeTab === SidebarTab.SettingsTab && 'Ajustes de webOS'}
                  {isDemoMode && (
                    <span className="text-[9px] bg-white/5 border border-white/10 text-white/60 font-mono font-bold px-2 py-0.5 rounded-md ml-2 tracking-widest">
                      DEMO MODE
                    </span>
                  )}
                </h2>
              </div>

              {/* Red/Green interactive color keys shortcuts */}
              <div className="flex items-center gap-6 text-[10px] text-white/30 font-mono uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse shrink-0" />
                  <span className="font-medium">R: Favorito rápido</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
                  <span className="font-medium">G: Abrir buscador</span>
                </span>
              </div>
            </div>

            {/* Catalog content panel split (Left panel Categories, Right panel stream tiles) */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* CATEGORIES COLUMN PANEL (Only for LIVE, MOVIES, SERIES tabs) */}
              {[SidebarTab.Live, SidebarTab.Movies, SidebarTab.Series].includes(activeTab) && activeCategoriesOfTab.length > 0 && (
                <div 
                  ref={categoryContainerRef}
                  className={`w-64 bg-[#0C0C0C]/50 border-r border-white/5 p-4 overflow-y-auto space-y-2 select-none shrink-0 scrollbar-none transition-all ${
                    activeArea === 'categories' ? 'shadow-[8px_0_20px_rgba(0,0,0,0.4)] bg-[#0C0C0C]' : ''
                  }`}
                >
                  <p className="text-[9px] text-white/30 font-bold font-mono uppercase tracking-widest pl-3 pb-2 border-b border-white/5">Categorías</p>
                  
                  {activeCategoriesOfTab.map((cat, idx) => {
                     const isCatFocused = activeArea === 'categories' && categoryFocusedIndex === idx;
                     const isCatActive = selectedCategory === cat.id;

                     return (
                       <button
                         key={cat.id}
                         onClick={() => {
                           setSelectedCategory(cat.id);
                           setCategoryFocusedIndex(idx);
                           setActiveArea('grid');
                         }}
                         className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 outline-none flex items-center justify-between border ${
                           isCatFocused
                             ? 'bg-[#0066FF] text-white border-transparent shadow-[0_0_15px_rgba(0,102,255,0.3)] scale-105 font-extrabold'
                             : isCatActive
                             ? 'bg-white/5 text-[#0066FF] border-white/5'
                             : 'text-white/40 hover:text-white border-transparent hover:bg-white/5'
                         }`}
                       >
                         <span className={`truncate ${settings.fontSize === 'large' ? 'text-base' : 'text-xs'}`}>{cat.name}</span>
                         <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isCatFocused ? 'translate-x-1' : ''}`} />
                       </button>
                     );
                  })}
                </div>
              )}

              {/* RIGHT CONTENT DISPLAY PANEL */}
              <div className="flex-1 flex flex-col overflow-hidden p-6">
                
                {/* A. If we are in Settings Tab */}
                {activeTab === SidebarTab.SettingsTab && !showCategoryManager ? (
                  <div className="max-w-xl mx-auto w-full bg-[#0C0C0C] border border-white/5 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-y-auto">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                      <div className="h-12 w-12 rounded-xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-extrabold text-white uppercase tracking-tight">Preferencias del Reproductor</h3>
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-0.5">Personaliza controles, idiomas y seguridad parentales.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Language Choice */}
                      <div 
                        className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                          settingsIndex === 0 ? 'bg-[#141414] border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.15)] scale-[1.02]' : 'bg-[#0C0C0C] border-white/5 text-white/80'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Idioma de la Interfaz</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Español / Inglés para navegación rápida.</p>
                        </div>
                        <span className="px-3 py-1.5 bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] font-mono font-bold text-[10px] rounded-lg uppercase">
                          {settings.language === 'es' ? 'Español (ES)' : 'English (EN)'}
                        </span>
                      </div>

                      {/* Font Size Choice */}
                      <div 
                        className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                          settingsIndex === 1 ? 'bg-[#141414] border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.15)] scale-[1.02]' : 'bg-[#0C0C0C] border-white/5 text-white/80'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Tamaño de Fuente</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Ajusta el tamaño del texto para televisores 4K.</p>
                        </div>
                        <span className="px-3 py-1.5 bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] font-mono font-bold text-[10px] rounded-lg uppercase">
                          {settings.fontSize === 'normal' ? 'Normal' : settings.fontSize === 'large' ? 'Grande' : 'Muy Grande'}
                        </span>
                      </div>

                      {/* Video streaming auto quality */}
                      <div 
                        className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                          settingsIndex === 2 ? 'bg-[#141414] border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.15)] scale-[1.02]' : 'bg-[#0C0C0C] border-white/5 text-white/80'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Calidad Adaptativa</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Usa HLS adaptable automática de alta resolución.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className={`w-4 h-4 text-[#0066FF] ${settings.autoQuality ? 'opacity-100' : 'opacity-0'}`} />
                          <span className="text-[10px] font-mono font-bold text-white/60 uppercase">
                            {settings.autoQuality ? 'Activado' : 'Desactivado'}
                          </span>
                        </div>
                      </div>

                      {/* Parental locked configuration */}
                      <div 
                        className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                          settingsIndex === 3 ? 'bg-[#141414] border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.15)] scale-[1.02]' : 'bg-[#0C0C0C] border-white/5 text-white/80'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">Filtro Parental (18+)</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Protege canales adultos con PIN de seguridad.</p>
                        </div>
                        <span className={`px-3 py-1.5 border font-mono font-bold text-[10px] rounded-lg uppercase flex items-center gap-1.5 ${
                          settings.isAdultPinLocked 
                            ? 'bg-red-500/10 border-red-500/25 text-red-400' 
                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        }`}>
                          {settings.isAdultPinLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          {settings.isAdultPinLocked ? 'Bloqueado (1234)' : 'Desbloqueado'}
                        </span>
                      </div>

                      {/* Category Manager */}
<div
  className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
    settingsIndex === 4
      ? 'bg-[#141414] border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.2)] scale-[1.02]'
      : 'bg-[#0C0C0C] border-white/5 text-white/80'
  }`}
>
  <div>
    <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">
      Administrador de Categorías
    </p>
    <p className="text-[10px] text-white/40 mt-0.5">
      Oculta o muestra categorías.
    </p>
  </div>
  <EyeOff className="w-5 h-5 text-[#0066FF]" />
</div>

{/* Reset option */}
<div
  className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
    settingsIndex === 5
      ? 'bg-[#141414] border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[1.02]'
      : 'bg-[#0C0C0C] border-white/5 text-white/80'
  }`}
>
  <div>
    <p className="text-xs font-mono font-bold uppercase tracking-wider text-red-500">
      Limpiar Caché y Restablecer
    </p>
    <p className="text-[10px] text-white/40 mt-0.5">
      Borra credenciales, listas, favoritos y reinicia.
    </p>
  </div>
  <Trash2 className="w-5 h-5 text-red-500/60" />
</div>

{/* Back button */}
<button
  className={`w-full py-4.5 rounded-2xl font-display font-bold uppercase tracking-wider transition-all border text-center outline-none ${
    settingsIndex === 6
      ? 'bg-white text-black scale-[1.02] font-extrabold shadow-lg border-transparent'
      : 'bg-[#141414]/40 text-white/40 border-white/5 hover:text-white'
  }`}
>
  Guardar y Volver a Canales
</button>
                    </div>
                  </div>
                                ) : showCategoryManager ? (

                  <div className="max-w-3xl mx-auto w-full bg-[#0C0C0C] border border-white/5 rounded-3xl p-8">
                    <h2 className="text-2xl font-bold mb-6">
                      Administrador de categorías
                    </h2>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
  {allCategories.map((cat) => (
    <div
      key={cat.id}
      className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5"
    >
      <span>{cat.name}</span>

      <button
        onClick={() => {
          const hidden = settings.hiddenCategories;

          if (hidden.includes(cat.id)) {
            setSettings(prev => ({
              ...prev,
              hiddenCategories: hidden.filter(id => id !== cat.id),
            }));
          } else {
            setSettings(prev => ({
              ...prev,
              hiddenCategories: [...hidden, cat.id],
            }));
          }
        }}
      >
        {settings.hiddenCategories.includes(cat.id)
          ? <EyeOff className="w-5 h-5 text-red-500" />
          : <Eye className="w-5 h-5 text-emerald-500" />}
      </button>
    </div>
  ))}
</div>
                  </div>

                ) : (

                  // B. If we are in SEARCH TAB, display search box
                  <>
                    {activeTab === SidebarTab.Search && (
                      <div className="mb-6 max-w-lg">
                        <p className="text-white/30 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">Ingresa tu consulta</p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                            <Search className="w-5 h-5" />
                          </span>
                          <input
                            type="text"
                            placeholder="Buscar canal, película o serie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0C0C0C] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#0066FF] focus:shadow-[0_0_15px_rgba(0,102,255,0.2)]"
                          />
                        </div>
                      </div>
                    )}

                    {/* LIVE TV EXTRA: EPG TV Guide & Live Stream Detail Block split */}
                    {activeTab === SidebarTab.Live && filteredItems.length > 0 && (
                      <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
                        
                        {/* Channels grid scrollable area */}
                        <div 
                          ref={gridContainerRef}
                          className="col-span-8 overflow-y-auto pr-2 grid grid-cols-2 gap-4 pb-12 select-none h-full"
                        >
                          {filteredItems.map((item, idx) => {
                            const isGridFocused = activeArea === 'grid' && gridFocusedIndex === idx;
                            const isFavorite = favorites.includes(item.id);

                            return (
                              <button
                                key={item.id}
                                onClick={() => triggerPlay(item)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border outline-none text-left transition-all duration-250 shrink-0 relative overflow-hidden ${
                                  isGridFocused
                                    ? 'bg-[#0066FF] border-transparent scale-102 shadow-[0_5px_20px_rgba(0,102,255,0.35)] z-10'
                                    : 'bg-[#0C0C0C]/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                                }`}
                              >
                                {/* Active focused ring overlay */}
                                {isGridFocused && (
                                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-white" />
                                )}

                                {/* Channel Logo Container */}
                                <div className="h-14 w-14 rounded-xl bg-[#141414] border border-white/5 overflow-hidden shrink-0 flex items-center justify-center relative">
                                  <img 
                                    src={item.logo} 
                                    alt={item.name} 
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-display font-bold uppercase tracking-wide text-xs truncate leading-tight block">{item.name}</span>
                                    {isFavorite && <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 shrink-0" />}
                                  </div>
                                  <span className={`text-[10px] block truncate font-mono uppercase tracking-wider mt-1 ${
                                    isGridFocused ? 'text-white/60' : 'text-white/30'
                                  }`}>
                                    {generateEPG(item.id)[0]?.title || 'Emisión continua'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* RIGHT EPG DETAIL SCHEDULE SIDE PANEL */}
                        <div className="col-span-4 bg-[#0C0C0C] border border-white/5 rounded-3xl p-6 flex flex-col justify-between select-none h-full overflow-y-auto shadow-[0_20px_45px_rgba(0,0,0,0.8)]">
                          {filteredItems[gridFocusedIndex] ? (
                            (() => {
                              const focusedChannel = filteredItems[gridFocusedIndex];
                              
                              const epgGuide = currentEPG.length > 0 ? currentEPG : generateEPG(focusedChannel.id);
                              const programNow = getCurrentProgram(epgGuide);
                              
                              return (
                                <div className="flex flex-col h-full justify-between">
                                  <div>
                                    {/* Mini visual */}
                                    <div className="h-28 rounded-2xl bg-[#141414] border border-white/5 relative overflow-hidden flex items-center justify-center mb-6 shadow-inner">
                                      <img 
                                        src={focusedChannel.logo} 
                                        alt={focusedChannel.name} 
                                        onError={(e) => {
                                        e.currentTarget.src = "/channel-placeholder.png";
                                        }}
                                        className="h-16 w-16 rounded-xl object-cover shadow-lg border border-white/10"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-red-600 text-white font-mono font-bold text-[8px] uppercase px-1.5 py-0.5 rounded-md shadow animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                        En Vivo
                                      </div>
                                    </div>

                                    {/* Information text */}
                                    <h3 className="text-base font-display font-extrabold text-white leading-tight uppercase tracking-tight truncate">{focusedChannel.name}</h3>
                                    <p className="text-white/30 text-[9px] font-mono font-bold uppercase tracking-widest mt-0.5">
  Guía en tiempo real
</p>

                                    {/* Timeline Programs Checklist */}
                                    <div className="space-y-4 mt-6">
                                      
                                      {/* EPG 0: AHORA */}
                                      <div className="p-3 bg-[#0066FF]/10 border-l-4 border-[#0066FF] rounded-r-xl border-y border-r border-white/5">
                                        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-[#0066FF] uppercase tracking-widest">
                                          <span>Ahora</span>
                                          <span>
                                        {programNow
                                        ? `${formatEPGTime(programNow.start)} - ${formatEPGTime(programNow.end)}`
                                        : `${epgGuide[0]?.start} - ${epgGuide[0]?.end}`}
                                         </span>
                                        </div>
                                        <p className="text-xs font-semibold text-white truncate mt-1">
                                        {programNow?.title || epgGuide[0]?.title}
                                        </p>
                                        <p className="text-[10px] text-white/40 truncate mt-0.5 leading-relaxed">
  {programNow?.description || epgGuide[0]?.description}
</p>
                                        {/* Dynamic fake timeline progress */}
                                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2.5">
                                          <div
  className="bg-[#0066FF] shadow-[0_0_8px_rgba(0,102,255,0.5)] h-full transition-all duration-500"
  style={{
    width: `${programNow
      ? getProgramProgress(programNow.start, programNow.end)
      : 45}%`,
  }}
/>
                                        </div>
                                      </div>

                                      {/* EPG 1: SIGUIENTE */}
                                      <div className="p-3 bg-[#141414]/30 border-l-4 border-white/5 rounded-r-xl border-y border-r border-white/5">
                                        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">
                                          <span>A continuación</span>
                                         <span>
  {currentEPG[1]
    ? `${formatEPGTime(currentEPG[1].start)} - ${formatEPGTime(currentEPG[1].end)}`
    : `${epgGuide[1]?.start} - ${epgGuide[1]?.end}`}
</span>
                                        </div>
                                        <p className="text-xs font-semibold text-white truncate mt-1">
  {currentEPG[1]?.title || epgGuide[1]?.title}
</p>
                                        <p className="text-[10px] text-white/40 truncate mt-0.5 leading-relaxed">
  {currentEPG[1]?.description || epgGuide[1]?.description}
</p>
                                      </div>

                                      {/* EPG 2: SIGUIENTE 2 */}
                                      <div className="p-3 bg-[#141414]/30 border-l-4 border-white/5 rounded-r-xl border-y border-r border-white/5">
                                        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">
                                          <span>Más tarde</span>
                                          <span>
  {currentEPG[2]
    ? `${formatEPGTime(currentEPG[2].start)} - ${formatEPGTime(currentEPG[2].end)}`
    : `${epgGuide[2]?.start} - ${epgGuide[2]?.end}`}
</span>
                                        </div>
                                        <p className="text-xs font-semibold text-white/80 truncate mt-1">
  {currentEPG[2]?.title || epgGuide[2]?.title}
</p>
                                        <p className="text-[10px] text-white/40 truncate mt-0.5 leading-relaxed">
  {currentEPG[2]?.description || epgGuide[2]?.description}
</p>
                                      </div>

                                    </div>
                                  </div>

                                  {/* Play shortcut Button */}
                                  <button
                                    onClick={() => triggerPlay(focusedChannel)}
                                    className="w-full mt-6 bg-[#141414] text-white/60 border border-white/5 font-display uppercase tracking-widest text-[10px] font-bold py-3.5 rounded-xl transition-all duration-200 outline-none flex items-center justify-center gap-2 hover:bg-white hover:text-black hover:border-transparent"
                                  >
                                    <Play className="w-4 h-4 fill-current" />
                                    Reproducir canal
                                  </button>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/20">
                              <BookOpen className="w-12 h-12 stroke-1 mb-4" />
                              <p className="text-xs font-semibold">Selecciona un canal para consultar su guía de programación satelital.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* VOD MOVIES & SERIES LAYOUT GRIDS (4 columns) */}
                    {activeTab !== SidebarTab.Live && (
                      <div className="flex flex-col h-full overflow-hidden">
                        
                        {/* Dynamic Top Focused Item Summary Banner */}
                        {filteredItems[gridFocusedIndex] && (
                          <div className="mb-6 p-5 bg-[#0C0C0C] border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.8)] rounded-2xl flex gap-6 relative overflow-hidden shrink-0">
                            {/* Poster detail visual */}
                            <div className="h-24 w-16 rounded-xl bg-[#141414] overflow-hidden shrink-0 border border-white/10 flex items-center justify-center shadow-lg">
                              <img 
                                src={filteredItems[gridFocusedIndex].logo} 
                                alt="" 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight truncate leading-tight">{filteredItems[gridFocusedIndex].name}</h3>
                                <span className="bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                  ★ {filteredItems[gridFocusedIndex].rating || '8.5'}
                                </span>
                                {filteredItems[gridFocusedIndex].year && (
                                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-semibold">{filteredItems[gridFocusedIndex].year}</span>
                                )}
                              </div>
                              <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed max-w-2xl">
                                {filteredItems[gridFocusedIndex].description || 'Ver transmisión VOD en alta definición con reproducción fluida e inicio instantáneo, compatible con tu reproductor webOS.'}
                              </p>
                              
                              {/* Metadata tags */}
                              <div className="flex gap-4 items-center mt-2.5 text-[9px] font-mono text-white/30 uppercase tracking-widest">
                                {filteredItems[gridFocusedIndex].genre && <span>Género: {filteredItems[gridFocusedIndex].genre}</span>}
                                {filteredItems[gridFocusedIndex].duration && <span>Duración: {filteredItems[gridFocusedIndex].duration}</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Main Stream Poster Grid container */}
                        {filteredItems.length > 0 ? (
                          <div 
                            ref={gridContainerRef}
                            className="flex-1 overflow-y-auto grid grid-cols-4 gap-6 pb-16 scrollbar-none pr-2 h-full"
                          >
                            {filteredItems.map((item, idx) => {
                              const isGridFocused = activeArea === 'grid' && gridFocusedIndex === idx;
                              const isFavorite = favorites.includes(item.id);
                              
                              // Check saved progress
                              const progressItem = progress.find(p => p.itemId.split('-')[0] === item.id);

                              return (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    if (item.type === 'series') openSeriesDetail(item);
                                    else triggerPlay(item);
                                  }}
                                  className={`flex flex-col text-left rounded-2xl border transition-all duration-250 select-none relative outline-none overflow-hidden h-[300px] shrink-0 ${
                                    isGridFocused
                                      ? 'bg-[#0C0C0C] border-[#0066FF] scale-102 shadow-[0_12px_24px_rgba(0,102,255,0.3)] z-10'
                                      : 'bg-[#0C0C0C]/40 border-white/5'
                                  }`}
                                >
                                  {/* Poster image container */}
                                  <div className="h-44 bg-[#141414] relative overflow-hidden flex items-center justify-center shrink-0">
                                    <img 
                                      src={item.logo} 
                                      alt={item.name} 
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    
                                    {/* Badges Overlay */}
                                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                      {item.type === 'series' ? (
                                        <span className="bg-[#0066FF] text-white font-mono font-bold text-[8px] uppercase px-2 py-0.5 tracking-widest rounded shadow">
                                          Serie
                                        </span>
                                      ) : (
                                        <span className="bg-[#0066FF] text-white font-mono font-bold text-[8px] uppercase px-2 py-0.5 tracking-widest rounded shadow">
                                          Peli
                                        </span>
                                      )}
                                      
                                      {isFavorite && (
                                        <span className="bg-black/70 backdrop-blur-sm p-1 rounded-full border border-red-500/20 text-red-500 shadow">
                                          <Heart className="w-3.5 h-3.5 fill-current" />
                                        </span>
                                      )}
                                    </div>

                                    {/* Action highlight icon */}
                                    {isGridFocused && (
                                      <div className="absolute inset-0 bg-[#0066FF]/20 flex items-center justify-center">
                                        <PlayCircle className="w-12 h-12 text-white fill-[#0066FF]/50 shadow-lg" />
                                      </div>
                                    )}

                                    {/* Playback resume progress timeline indicator */}
                                    {progressItem && (
                                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
                                        <div 
                                          className="h-full bg-[#0066FF] shadow-[0_0_8px_rgba(0,102,255,0.6)]" 
                                          style={{ width: `${progressItem.percentage}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Text Info Container */}
                                  <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                      <span className="text-white font-display font-bold uppercase tracking-wider text-xs block truncate leading-tight">{item.name}</span>
                                      <span className="text-[9px] text-white/30 font-mono font-bold block mt-1 uppercase tracking-widest">{item.genre || 'VOD Premium'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-[9px] font-mono text-white/30 font-semibold border-t border-white/5 pt-2.5 mt-2.5">
                                      <span>{item.year || '2023'}</span>
                                      <span>★ {item.rating || '8.5'}</span>
                                    </div>
                                  </div>

                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                            <Film className="w-16 h-16 stroke-1 mb-4" />
                            <h4 className="text-base font-bold text-zinc-400">Sin Contenido</h4>
                            <p className="text-xs mt-1 max-w-sm">No se encontraron películas o series cargadas en esta categoría.</p>
                          </div>
                        )}

                      </div>
                    )}

                    {/* DYNAMIC MASTER-DETAIL SERIES MODAL */}
                    {activeSeriesDetail && (
                      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8 backdrop-blur-md animate-fade-in">
                        <div className="w-full max-w-4xl bg-[#0C0C0C] border border-white/5 rounded-3xl p-8 shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col h-[90vh] overflow-hidden relative">
                          
                          {/* Close shortcut header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-5 shrink-0">
                            <div className="flex items-center gap-3">
                              <span className="bg-[#0066FF] text-white font-mono font-bold text-[8px] uppercase px-2 py-0.5 tracking-widest rounded shadow">
                                Serie Completa
                              </span>
                              <h2 className="text-lg font-display font-extrabold text-white uppercase tracking-tight">{activeSeriesDetail.name}</h2>
                            </div>
                            <button 
                              onClick={() => setActiveSeriesDetail(null)}
                              className={`h-10 px-4 rounded-xl text-[9px] font-display font-bold uppercase tracking-widest flex items-center gap-2 transition-all outline-none border ${
                                seriesModalFocusIndex === 3 
                                  ? 'bg-white text-black scale-105 border-transparent' 
                                  : 'bg-[#141414] text-white/40 border-white/5 hover:text-white'
                              }`}
                            >
                              Volver al Menú (BACK)
                            </button>
                          </div>

                          {/* Modal Split Content Panel */}
                          <div className="flex-1 flex gap-8 overflow-hidden py-6">
                            
                            {/* Left Side: Series poster & detail description */}
                            <div className="w-1/3 flex flex-col justify-between select-none">
                              <div>
                                <div className="h-64 rounded-2xl border border-white/5 overflow-hidden shadow-lg bg-[#141414] flex items-center justify-center">
                                  <img 
                                    src={activeSeriesDetail.logo} 
                                    alt="" 
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex gap-2 items-center mt-4 text-[9px] font-mono text-white/30 uppercase tracking-widest font-semibold">
                                  <span>{activeSeriesDetail.year}</span>
                                  <span>•</span>
                                  <span>{activeSeriesDetail.genre}</span>
                                </div>
                                <p className="text-xs text-white/50 mt-2 leading-relaxed line-clamp-4">
                                  {activeSeriesDetail.description}
                                </p>
                              </div>

                              {/* Interactive Favorites button toggle inside series modal */}
                              <button
                                onClick={() => {
                                  if (favorites.includes(activeSeriesDetail.id)) {
                                    setFavorites(favorites.filter(id => id !== activeSeriesDetail.id));
                                  } else {
                                    setFavorites([...favorites, activeSeriesDetail.id]);
                                  }
                                }}
                                className={`w-full py-3.5 rounded-xl text-[9px] font-display font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all outline-none ${
                                  seriesModalFocusIndex === 2
                                    ? 'bg-[#0066FF] text-white scale-105 shadow-lg border-transparent shadow-[#0066FF]/20'
                                    : favorites.includes(activeSeriesDetail.id)
                                    ? 'bg-[#141414] text-red-500 border-red-500/20'
                                    : 'bg-[#141414]/50 text-white/40 border-white/5 hover:text-white'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${favorites.includes(activeSeriesDetail.id) ? 'fill-current text-red-500' : ''}`} />
                                {favorites.includes(activeSeriesDetail.id) ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                              </button>
                            </div>

                            {/* Right Side: Season Selector & Episodes scroll list */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                              
                              {/* Season Tabs Row */}
                              <div className="flex gap-2 border-b border-white/5 pb-3 mb-4 select-none shrink-0 overflow-x-auto">
                                {Array.from({ length: activeSeriesDetail.seasonsCount || 1 }).map((_, idx) => {
                                  const sNum = idx + 1;
                                  const isFocused = seriesModalFocusIndex === 0 && selectedSeason === sNum;
                                  const isActive = selectedSeason === sNum;

                                  return (
                                    <button
                                      key={sNum}
                                      onClick={() => {
                                        setSelectedSeason(sNum);
                                        setSeriesModalFocusIndex(1);
                                        setGridFocusedIndex(0);
                                      }}
                                      className={`px-4 py-2 text-[9px] font-mono font-bold uppercase tracking-widest rounded-xl border transition-all outline-none ${
                                        isFocused
                                          ? 'bg-[#0066FF] text-white scale-105 border-transparent shadow-[0_0_15px_rgba(0,102,255,0.4)]'
                                          : isActive
                                          ? 'bg-white/5 text-[#0066FF] border-white/5'
                                          : 'bg-[#141414]/30 text-white/30 border-transparent hover:text-white'
                                      }`}
                                    >
                                      Temporada {sNum}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Scrollable Episodes Cards List */}
                              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                                {(activeSeriesDetail.episodes?.filter(e => e.season === selectedSeason) || []).map((episode, idx) => {
                                  const isFocused = seriesModalFocusIndex === 1 && gridFocusedIndex === idx;
                                  const progressKey = `${activeSeriesDetail.id}-${episode.id}`;
                                  const progressEp = progress.find(p => p.itemId === progressKey);

                                  return (
                                    <button
                                      key={episode.id}
                                      onClick={() => triggerPlay(activeSeriesDetail, episode.id)}
                                      className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-4 transition-all outline-none relative overflow-hidden ${
                                        isFocused
                                          ? 'bg-[#0066FF]/10 border-[#0066FF] scale-101 shadow-[0_5px_15px_rgba(0,102,255,0.15)]'
                                          : 'bg-[#141414]/30 border-white/5 hover:bg-white/5 hover:border-white/10'
                                      }`}
                                    >
                                      {/* Episode mini visual */}
                                      <div className="h-14 w-24 bg-[#141414] rounded-lg overflow-hidden border border-white/5 shrink-0 flex items-center justify-center">
                                        <img 
                                          src={episode.logo || activeSeriesDetail.logo} 
                                          alt="" 
                                          className="h-full w-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                                          <span className="font-display uppercase tracking-wide truncate">{episode.title}</span>
                                          {episode.duration && <span className="text-white/30 text-[9px] font-mono uppercase tracking-widest shrink-0 ml-3">{episode.duration}</span>}
                                        </div>
                                        <p className="text-[10px] text-white/40 truncate mt-1 leading-normal">
                                          {episode.description || 'Disfruta de este episodio de alta definición optimizado con reproducción instantánea.'}
                                        </p>
                                        
                                        {/* Episode dynamic progress bar */}
                                        {progressEp && (
                                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
                                            <div 
                                              className="bg-[#0066FF] h-full shadow-[0_0_8px_rgba(0,102,255,0.6)]" 
                                              style={{ width: `${progressEp.percentage}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                  </>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* 5. --- parental adult LOCK PIN SCREEN INTERACTIVE OVERLAY --- */}
      {section === AppSection.PinLock && (
        <PINDialog
          pinValue={pinInput}
          onPinChange={setPinInput}
          onSubmit={verifyParentalPIN}
          onCancel={() => {
            setSection(AppSection.Main);
            setPendingAdultItem(null);
          }}
          focusedKeypadIndex={focusedPinKeypadIndex}
          errorMessage={pinError}
        />
      )}

      {/* 6. --- FULLSCREEN IPTV STREAM VIDEO PLAYER --- */}
      {section === AppSection.Player && activePlayItem && (
        <Player
          item={activePlayItem}
          episodeId={activeEpisodeId}
          onBack={() => {
            setSection(AppSection.Main);
            setActiveEpisodeId('');
          }}
          controlIndex={playerControlFocusedIndex}
          playerControlsVisible={playerControlsVisible}
          setPlayerControlsVisible={setPlayerControlsVisible}
          currentEPG={currentEPG}
          loadingEPG={loadingEPG}
        />
      )}

    </div>
  );
}
