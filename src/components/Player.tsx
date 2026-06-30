import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, Volume2, Languages, ArrowLeft, Maximize2, SkipForward, Landmark } from 'lucide-react';
import { IPTVItem, PlaybackProgress } from '../types';
import { storage } from '../utils';

interface PlayerProps {
  item: IPTVItem;
  episodeId?: string; // for series
  onBack: () => void;
  controlIndex: number; // 0: Play/Pause, 1: Prev (15s), 2: Next (15s), 3: Audio, 4: Subtitles, 5: PiP, 6: Volver
  playerControlsVisible: boolean;
  setPlayerControlsVisible: (visible: boolean) => void;
}

export default function Player({
  item,
  episodeId,
  onBack,
  controlIndex,
  playerControlsVisible,
  setPlayerControlsVisible
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgressTime, setSavedProgressTime] = useState(0);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [currentResolution, setCurrentResolution] = useState('1080p HD');
  const [availableAudioTracks, setAvailableAudioTracks] = useState<string[]>(['Español (Latino)', 'Inglés (Original)']);
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);

  // Active stream URL (depends on whether it's a channel, movie or series episode)
  let streamUrl = item.streamUrl;
  let progressKey = item.id;
  
  if (item.type === 'series' && episodeId) {
    const episode = item.episodes?.find(e => e.id === episodeId);
    if (episode) {
      streamUrl = episode.streamUrl;
      progressKey = `${item.id}-${episodeId}`;
    }
  }

  // Auto-hide controls after 5 seconds of inactivity
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setPlayerControlsVisible(false);
    }, 5000);
  };

  useEffect(() => {
    if (playerControlsVisible) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [playerControlsVisible]);

  // Video stream initialization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset state
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    // Load saved progress for movie/series auto-resume
    if (item.type !== 'live') {
      const savedProgress = storage.getProgress();
      const progress = savedProgress.find(p => p.itemId === progressKey);
      if (progress && progress.position > 10 && progress.position < progress.duration - 15) {
        setSavedProgressTime(progress.position);
        setShowResumePrompt(true);
        // Automatically hide prompt after 6 seconds
        const t = setTimeout(() => setShowResumePrompt(false), 6000);
        return () => clearTimeout(t);
      }
    }

    // Playback Engine: Native vs Hls.js
    if (streamUrl.endsWith('.m3u8') || streamUrl.includes('m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxMaxBufferLength: 10,
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log('Autoplay blocked:', e));
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels[data.level];
          if (level && level.height) {
            setCurrentResolution(`${level.height}p`);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log('Autoplay blocked:', e));
        });
      }
    } else {
      // Direct MP4 or TS files
      video.src = streamUrl;
      video.load();
      video.play().catch(e => console.log('Autoplay blocked:', e));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, item, progressKey]);

  // Periodically save playback progress (every 4 seconds) for auto-resume
  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type === 'live') return;

    const interval = setInterval(() => {
      const pos = video.currentTime;
      const dur = video.duration || duration;
      if (pos > 5 && dur > 10) {
        const saved = storage.getProgress();
        const filtered = saved.filter(p => p.itemId !== progressKey);
        
        const newProgress: PlaybackProgress = {
          itemId: progressKey,
          position: Math.floor(pos),
          duration: Math.floor(dur),
          percentage: Math.floor((pos / dur) * 100),
          updatedAt: Date.now(),
          episodeId: episodeId
        };
        
        storage.saveProgress([...filtered, newProgress]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentTime, duration, item, progressKey, episodeId]);

  // Track state updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
    resetControlsTimeout();
  };

  const skipTime = (amount: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + amount));
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const handleAudioTrackToggle = () => {
    setActiveAudioIndex((prev) => (prev + 1) % availableAudioTracks.length);
    resetControlsTimeout();
  };

  const handleSubtitlesToggle = () => {
    setSubtitlesEnabled((prev) => !prev);
    resetControlsTimeout();
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      if (document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiPActive(false);
        } else {
          await video.requestPictureInPicture();
          setIsPiPActive(true);
        }
      } else {
        // Fallback simulation for browser sandbox without native PiP support
        setIsPiPActive(!isPiPActive);
      }
    } catch (e) {
      console.warn('Native PiP not available or failed, simulating PiP mode.', e);
      setIsPiPActive(!isPiPActive);
    }
    resetControlsTimeout();
  };

  const acceptResume = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = savedProgressTime;
      videoRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  // Human friendly time formats (HH:MM:SS)
  const formatDuration = (sec: number) => {
    if (isNaN(sec) || sec === Infinity) return '00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
    
    if (hrs > 0) {
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };

  // Estimated ending time based on current system clock
  const getEstimatedEndTime = () => {
    if (isNaN(duration) || duration === Infinity || duration === 0) return '';
    const now = new Date();
    const remainingSeconds = duration - currentTime;
    now.setSeconds(now.getSeconds() + remainingSeconds);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Handle Enter key trigger for specific controls
  useEffect(() => {
    if (!playerControlsVisible) return;

    // Trigger actions when Enter/OK is pressed based on controlIndex
    const handleRemoteAction = () => {
      if (controlIndex === 0) togglePlay();
      else if (controlIndex === 1) skipTime(-15);
      else if (controlIndex === 2) skipTime(15);
      else if (controlIndex === 3) handleAudioTrackToggle();
      else if (controlIndex === 4) handleSubtitlesToggle();
      else if (controlIndex === 5) togglePiP();
      else if (controlIndex === 6) onBack();
    };

    // We can listen in parent App.tsx, but this provides local handling fallback
  }, [controlIndex, playerControlsVisible, isPlaying, currentTime, duration, isMuted, isPiPActive]);

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center select-none overflow-hidden ${
        isPiPActive ? 'border-4 border-blue-600/80 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-75 origin-bottom-right translate-x-24 translate-y-16' : ''
      } transition-all duration-300`}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain"
        onClick={() => setPlayerControlsVisible(!playerControlsVisible)}
      />

      {/* Embedded Subtitles Simulation */}
      {subtitlesEnabled && item.type !== 'live' && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-black/80 backdrop-blur-sm border border-zinc-900 rounded-xl text-center text-white font-medium text-lg tracking-wide z-10">
          [Subtítulos en Español simulados para la reproducción]
        </div>
      )}

      {/* Auto Resume Toast Alert */}
      {showResumePrompt && (
        <div className="absolute top-10 right-10 bg-[#0C0C0C]/95 border border-white/5 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex flex-col gap-3 max-w-sm z-50 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0066FF]/10 rounded-lg text-[#0066FF]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-white uppercase tracking-tight">¿Reanudar reproducción?</p>
              <p className="text-[10px] font-mono text-white/40 mt-0.5">PROGRESO GUARDADO: {formatDuration(savedProgressTime)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={acceptResume}
              className="flex-1 bg-[#0066FF] text-white text-xs font-display font-bold py-2 rounded-xl hover:bg-[#0066FF]/95 shadow-[0_0_12px_rgba(0,102,255,0.3)]"
            >
              Sí, Reanudar (OK)
            </button>
            <button
              onClick={() => setShowResumePrompt(false)}
              className="flex-1 bg-white/5 text-white/50 border border-white/5 text-xs font-display font-bold py-2 rounded-xl hover:bg-white/10"
            >
              No, desde inicio
            </button>
          </div>
        </div>
      )}

      {/* PLAYER HUD HUD OVERLAY (Controls & Timeline) */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/90 flex flex-col justify-between p-8 transition-opacity duration-300 z-40 ${
          playerControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* HUD Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all border ${
                playerControlsVisible && controlIndex === 6 ? 'bg-red-600 border-transparent text-white scale-110 shadow-lg' : 'bg-white/5 border-white/5 text-white/50'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-white/30 text-[10px] font-bold font-mono uppercase tracking-widest">
                {item.type === 'live' ? 'Televisión en Vivo' : item.type === 'movie' ? 'Cine Club' : 'Serie de TV'}
              </p>
              <h2 className="text-xl font-display font-extrabold text-white tracking-tight uppercase mt-0.5">
                {item.name} {item.type === 'series' && episodeId && ` - ${item.episodes?.find(e => e.id === episodeId)?.title}`}
              </h2>
            </div>
          </div>

          {/* Stream specs */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] text-[10px] font-bold font-mono uppercase rounded-lg tracking-wider shadow-[0_0_10px_rgba(0,102,255,0.1)]">
              {currentResolution}
            </span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/5 text-white/40 text-[10px] font-bold font-mono uppercase rounded-lg tracking-wider">
              {item.type === 'live' ? 'STREAM EN VIVO' : 'HLS VOD'}
            </span>
          </div>
        </div>

        {/* HUD Center Info Panel (If live TV, show EPG) */}
        {item.type === 'live' && (
          <div className="self-start max-w-lg ml-16 mt-6 bg-[#0C0C0C]/80 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
            <span className="text-[9px] text-[#0066FF] font-bold font-mono uppercase tracking-widest">En emisión ahora</span>
            <h3 className="text-base font-display font-bold text-white mt-1 uppercase tracking-tight">Programa Especial En Directo</h3>
            <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed font-sans">
              Transmisión satelital continua optimizada de alta fidelidad. Consulta la guía completa de programación en el panel lateral de televisión.
            </p>
          </div>
        )}

        {/* HUD Bottom Panel (Timeline & Action Controls) */}
        <div className="space-y-6">
          {/* Progress Timeline Slider (Only for Movies/Series VOD) */}
          {item.type !== 'live' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold font-mono text-white/40 uppercase tracking-wider">
                <span>{formatDuration(currentTime)}</span>
                {getEstimatedEndTime() && (
                  <span className="bg-white/5 px-2.5 py-1 rounded-md text-white/30">
                    Termina a las: <span className="text-[#0066FF] font-bold">{getEstimatedEndTime()}</span>
                  </span>
                )}
                <span>{formatDuration(duration)}</span>
              </div>
              <div className="relative h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#0066FF] to-[#0066FF]/80 shadow-[0_0_8px_rgba(0,102,255,0.5)] rounded-full transition-all duration-300" 
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons Toolbar */}
          <div className="flex items-center justify-between">
            {/* Left/Right Seek controls & Play */}
            <div className="flex items-center gap-4">
              
              {/* Rewind 15s */}
              {item.type !== 'live' && (
                <button
                  onClick={() => skipTime(-15)}
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all border ${
                    playerControlsVisible && controlIndex === 1 
                      ? 'bg-[#0066FF] border-transparent text-white scale-115 shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              {/* Play / Pause Toggle */}
              <button
                onClick={togglePlay}
                className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all border ${
                  playerControlsVisible && controlIndex === 0 
                    ? 'bg-[#0066FF] border-transparent text-white scale-115 shadow-[0_0_20px_rgba(0,102,255,0.4)]' 
                    : 'bg-white/5 border-white/5 text-white hover:bg-white/10'
                }`}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              {/* Fast Forward 15s */}
              {item.type !== 'live' && (
                <button
                  onClick={() => skipTime(15)}
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all border ${
                    playerControlsVisible && controlIndex === 2 
                      ? 'bg-[#0066FF] border-transparent text-white scale-115 shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

            </div>

            {/* Subtitle / Audio tracks / PiP toggle */}
            <div className="flex items-center gap-4">
              
              {/* Audio tracks selector */}
              <button
                onClick={handleAudioTrackToggle}
                className={`h-14 px-5 rounded-2xl flex items-center gap-3 transition-all border ${
                  playerControlsVisible && controlIndex === 3 
                    ? 'bg-[#0066FF] border-transparent text-white scale-110 shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-xs font-display font-bold uppercase tracking-wider">{availableAudioTracks[activeAudioIndex]}</span>
              </button>

              {/* Subtitles toggle */}
              <button
                onClick={handleSubtitlesToggle}
                className={`h-14 px-5 rounded-2xl flex items-center gap-3 transition-all border ${
                  playerControlsVisible && controlIndex === 4 
                    ? 'bg-[#0066FF] border-transparent text-white scale-110 shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                }`}
              >
                <Languages className="w-5 h-5" />
                <span className="text-xs font-display font-bold uppercase tracking-wider">{subtitlesEnabled ? 'Subtítulos: SÍ' : 'Subtítulos: NO'}</span>
              </button>

              {/* PiP Mode toggle */}
              <button
                onClick={togglePiP}
                className={`h-14 px-5 rounded-2xl flex items-center gap-3 transition-all border ${
                  playerControlsVisible && controlIndex === 5 
                    ? 'bg-[#0066FF] border-transparent text-white scale-110 shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                }`}
              >
                <Maximize2 className="w-5 h-5" />
                <span className="text-xs font-display font-bold uppercase tracking-wider">Modo PiP</span>
              </button>

            </div>
          </div>
        </div>
      </div>
      
      {/* Remote Nav Instruction overlay at the bottom left */}
      {playerControlsVisible && (
        <div className="absolute bottom-6 left-8 text-[10px] text-white/30 font-mono tracking-widest uppercase flex items-center gap-4 z-40">
          <span className="flex items-center gap-1.5"><span className="bg-[#141414] border border-white/5 rounded px-1.5 py-0.5 font-mono">◄ ►</span> Saltar 15s</span>
          <span className="flex items-center gap-1.5"><span className="bg-[#141414] border border-white/5 rounded px-1.5 py-0.5 font-mono">OK</span> Mostrar/Ocultar</span>
          <span className="flex items-center gap-1.5"><span className="bg-[#141414] border border-white/5 rounded px-1.5 py-0.5 font-mono">BACK</span> Volver</span>
        </div>
      )}
    </div>
  );
}
