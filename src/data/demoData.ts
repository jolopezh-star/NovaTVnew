import { Category, IPTVItem, EPGProgram } from '../types';

export const DEMO_CATEGORIES: Category[] = [
  // Live Categories
  { id: 'live-news', name: 'Noticias & Documentales', type: 'live' },
  { id: 'live-entertainment', name: 'Entretenimiento & Cine', type: 'live' },
  { id: 'live-sports', name: 'Deportes & Aventura', type: 'live' },
  { id: 'live-adult', name: 'Adultos (PIN: 1234)', type: 'live' },
  
  // Movie Categories
  { id: 'movie-scifi', name: 'Ciencia Ficción', type: 'movie' },
  { id: 'movie-animation', name: 'Animación', type: 'movie' },
  { id: 'movie-action', name: 'Acción & Aventura', type: 'movie' },
  
  // Series Categories
  { id: 'series-animation', name: 'Series Animadas', type: 'series' },
  { id: 'series-scifi', name: 'Series de Ficción', type: 'series' }
];

// Dynamically generate EPG programs based on the current time
export function generateEPG(channelId: string): EPGProgram[] {
  const now = new Date();
  const baseHour = now.getHours();
  
  // Custom program names depending on channel
  const programsByChannel: Record<string, string[]> = {
    'live-1': ['Noticias del Mundo 24/7', 'Documental: Secretos del Cosmos', 'Mesa de Debate Global', 'Informe Económico Semanal'],
    'live-2': ['Cine Retro: Maravillas Animadas', 'Detrás de Cámaras', 'Cortometrajes Estelares', 'Especial de Animación Indie'],
    'live-3': ['Aventura Salvaje: Los Pirineos', 'Ciclismo Extremo de Montaña', 'Adrenalina Pura: Skateboarding', 'Entrevistas a Deportistas'],
    'live-4': ['Planeta Tierra: Océanos Profundos', 'La Vida en la Sabana', 'Microcosmos: Insectos de Cerca', 'Explorando Volcanes Activos'],
    'live-adult-1': ['Late Night Show (18+)', 'Cine de Medianoche', 'Club Nocturno Select', 'Estrella de la Noche']
  };
  
  const programNames = programsByChannel[channelId] || ['Programa Estelar', 'Variedades del Día', 'Show Nocturno', 'Cine de Estreno'];
  
  return programNames.map((title, idx) => {
    // Generate intervals of 1.5 hours
    const start = new Date(now);
    start.setHours(baseHour - 1 + idx * 1.5);
    start.setMinutes(0);
    start.setSeconds(0);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 90);
    
    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return {
      title,
      start: formatTime(start),
      end: formatTime(end),
      description: `Disfruta de esta transmisión especial de "${title}". Con la mejor calidad de transmisión, optimizado para tu reproductor premium de LG webOS TV.`
    };
  });
}

export const DEMO_ITEMS: IPTVItem[] = [
  // --- LIVE CHANNELS ---
  {
    id: 'live-1',
    name: 'Mundo Noticias HD',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://test-streams.mux.dev/x36xhqq/x36xhqq.m3u8',
    category: 'live-news',
    type: 'live'
  },
  {
    id: 'live-2',
    name: 'Cine Acción & Animación',
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    category: 'live-entertainment',
    type: 'live'
  },
  {
    id: 'live-3',
    name: 'Deportes Extremos TV',
    logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    category: 'live-sports',
    type: 'live'
  },
  {
    id: 'live-4',
    name: 'Planeta Documentales',
    logo: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'live-news',
    type: 'live'
  },
  {
    id: 'live-adult-1',
    name: 'Contenido Adultos 18+ (Cerrado)',
    logo: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'live-adult',
    type: 'live'
  },

  // --- MOVIES ---
  {
    id: 'movie-1',
    name: 'Big Buck Bunny (La Leyenda)',
    logo: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'movie-animation',
    type: 'movie',
    year: '2008',
    genre: 'Animación / Comedia',
    duration: '9m 56s',
    rating: '8.2',
    description: 'Un conejo gigante y bonachón decide tomar venganza de tres roedores molestos que arruinan su día a día en el bosque, ideando una serie de trampas cómicas e ingeniosas.',
    director: 'Sacha Goedegebure',
    cast: 'Conejo Bunny, Ardilla Voladora, Roedores Rebeldes'
  },
  {
    id: 'movie-2',
    name: 'Tears of Steel (Lágrimas de Acero)',
    logo: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'movie-scifi',
    type: 'movie',
    year: '2012',
    genre: 'Ciencia Ficción / Acción',
    duration: '12m 14s',
    rating: '7.5',
    description: 'En un futuro distópico en Amsterdam, un grupo de científicos intenta salvar el planeta del ataque de robots gigantescos recreando un evento sentimental del pasado.',
    director: 'Ian Hubert',
    cast: 'Derek de Lint, Sergio Hasselbaink, Rogier Schippers'
  },
  {
    id: 'movie-3',
    name: 'Sintel (El Camino del Dragón)',
    logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'movie-action',
    type: 'movie',
    year: '2010',
    genre: 'Aventura / Fantasía',
    duration: '14m 48s',
    rating: '8.5',
    description: 'Una joven solitaria llamada Sintel encuentra y rescata a un pequeño dragón herido, entablando una entrañable amistad. Cuando el dragón es secuestrado por una bestia adulta, emprende un viaje de búsqueda lleno de peligros.',
    director: 'Colin Levy',
    cast: 'Sintel, Halis, El Dragón Pequeño'
  },
  {
    id: 'movie-4',
    name: 'Subaru Outback Adventure',
    logo: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    category: 'movie-action',
    type: 'movie',
    year: '2019',
    genre: 'Acción / Deportes',
    duration: '5m 12s',
    rating: '6.9',
    description: 'Un recorrido automovilístico extremo que pone a prueba la tracción y potencia sobre asfalto, barro y terrenos indómitos en espectaculares paisajes naturales.',
    director: 'Dave Peterson',
    cast: 'Pilotos Profesionales'
  },

  // --- SERIES ---
  {
    id: 'series-1',
    name: 'Las Aventuras de Big Buck (La Serie)',
    logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    streamUrl: '',
    category: 'series-animation',
    type: 'series',
    year: '2023',
    genre: 'Comedia Infantil / Aventura',
    rating: '8.8',
    description: 'Las divertidas andanzas del conejo gigante más famoso del mundo del código abierto, enfrentándose a nuevos desafíos ecológicos junto a sus amigos.',
    seasonsCount: 2,
    episodes: [
      {
        id: 'series-1-e1',
        title: 'T1 E1: El despertar en el bosque',
        season: 1,
        episode: 1,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '9m 56s',
        description: 'Bunny despierta en un hermoso amanecer pero descubre que los roedores han tomado su comida preferida.',
        logo: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=200&auto=format&fit=crop&q=80'
      },
      {
        id: 'series-1-e2',
        title: 'T1 E2: El contraataque de las ardillas',
        season: 1,
        episode: 2,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '9m 56s',
        description: 'Un comando de ardillas voladoras organiza bombardeos de bellotas sobre el jardín trasero de Bunny.',
        logo: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=200&auto=format&fit=crop&q=80'
      },
      {
        id: 'series-1-e3',
        title: 'T2 E1: Nuevos vecinos salvajes',
        season: 2,
        episode: 1,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '9m 56s',
        description: 'En el estreno de la segunda temporada, un oso gigante llega al bosque alterando la paz de Bunny y las ardillas.',
        logo: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=200&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'series-2',
    name: 'Crónicas de Lágrimas de Acero',
    logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    streamUrl: '',
    category: 'series-scifi',
    type: 'series',
    year: '2024',
    genre: 'Ciencia Ficción Distópica',
    rating: '9.1',
    description: 'La expansión del universo Tears of Steel, que detalla la resistencia humana oculta en los canales de Amsterdam contra el enjambre cibernético.',
    seasonsCount: 1,
    episodes: [
      {
        id: 'series-2-e1',
        title: 'T1 E1: Código Amsterdam',
        season: 1,
        episode: 1,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '12m 14s',
        description: 'El sargento Celia descubre un fragmento de memoria artificial que podría cambiar el curso del combate contra los robots.',
        logo: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=200&auto=format&fit=crop&q=80'
      },
      {
        id: 'series-2-e2',
        title: 'T1 E2: El Regreso del Gigante',
        season: 1,
        episode: 2,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '12m 14s',
        description: 'Un mecha gigante de primera generación despierta de su letargo en las catacumbas de la estación central.',
        logo: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=200&auto=format&fit=crop&q=80'
      }
    ]
  }
];
