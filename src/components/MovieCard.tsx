import React from 'react';
import { Heart, PlayCircle, Play, Check } from 'lucide-react';
import { IPTVItem, PlaybackProgress } from '../types';

interface MovieCardProps {
  item: IPTVItem;
  isGridFocused: boolean;
  isFavorite: boolean;
  progressItem: PlaybackProgress | undefined;
  hasProgress: boolean;
  isCompletedSeries: boolean;
  openSeriesDetail: (series: IPTVItem) => Promise<any>;
  triggerPlay: (item: IPTVItem) => void;
}

function MovieCard({
  item,
  isGridFocused,
  isFavorite,
  progressItem,
  hasProgress,
  isCompletedSeries,
  openSeriesDetail,
  triggerPlay,
}: MovieCardProps) {
  return (
    <button
      key={item.id}
      onClick={() => {
        if (item.type === 'series') openSeriesDetail(item);
        else triggerPlay(item);
      }}
      className={`flex flex-col text-left rounded-2xl border transition-all duration-250 select-none relative outline-none overflow-hidden h-[300px] shrink-0 ${
        isGridFocused
          ? 'bg-[#0C0C0C] border-[#0066FF] scale-[1.04] ring-2 ring-[#0066FF]/60 shadow-[0_0_40px_rgba(0,102,255,0.55)] z-20'
          : 'bg-[#0C0C0C]/40 border-white/5'
      }`}
    >
      {/* Poster image container */}
      <div
        className={`h-44 relative overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 ${
          isGridFocused
            ? "bg-[#141414] ring-2 ring-[#0066FF] shadow-[0_0_30px_rgba(0,102,255,0.55)]"
            : "bg-[#141414]"
        }`}
      >
        <img 
          src={item.logo} 
          alt={item.name} 
          className={`h-full w-full object-cover transition-all duration-300 ${
            isGridFocused ? "scale-110 brightness-110" : "scale-100 brightness-100"
          }`}
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#0066FF]/55 via-[#0066FF]/15 to-transparent flex items-center justify-center">
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
        {/* Series status badge */}
        {item.type === 'series' && hasProgress && (
          <div className="absolute bottom-3 left-3 bg-[#0066FF]/95 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <Play className="w-3 h-3 fill-current" />
            Continuar
          </div>
        )}

        {item.type === 'series' && isCompletedSeries && (
          <div className="absolute bottom-3 left-3 bg-green-600/95 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <Check className="w-3 h-3" />
            Completada
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
}

const comparator = (prev: MovieCardProps, next: MovieCardProps): boolean => {
  return (
    prev.item.id === next.item.id &&
    prev.isGridFocused === next.isGridFocused &&
    prev.isFavorite === next.isFavorite &&
    prev.progressItem?.percentage === next.progressItem?.percentage
  );
};

export default React.memo(MovieCard, comparator);
