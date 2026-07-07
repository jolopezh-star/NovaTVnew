import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, Volume2, Languages, ArrowLeft, Maximize2, SkipForward, Landmark } from 'lucide-react';
import { IPTVItem, PlaybackProgress } from '../types';
import { EPGEntry } from '../services/epg';
import { storage } from '../utils';
import { formatEPGTime } from "../services/epg";
function getProgramProgress(start: string, end: string) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();

  if (now <= s) return 0;
  if (now >= e) return 100;

  return ((now - s) / (e - s)) * 100;
}

function formatHour(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PlayerProps {
  item: IPTVItem;
  episodeId?: string; // for series
  onBack: () => void;
  controlIndex: number; // 0: Play/Pause, 1: Prev (15s), 2: Next (15s), 3: Audio, 4: Subtitles, 5: PiP, 6: Volver
  playerControlsVisible: boolean;
setPlayerControlsVisible: (visible: boolean) => void;

currentEPG: EPGEntry[];
loadingEPG: boolean;
}

export default function Player({
  item,
  episodeId,
  onBack,
  controlIndex,
  playerControlsVisible,
  setPlayerControlsVisible,
  currentEPG,
  loadingEPG
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const zapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const channelInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const showVolumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [channelNumber, setChannelNumber] = useState("");
  const [showZapBanner, setShowZapBanner] = useState(false);
  const [channelListVisible, setChannelListVisible] = useState(false);
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);
  const channelListTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [channelPreviewIndex, setChannelPreviewIndex] = useState(0);
  const [previewChannels, setPreviewChannels] = useState<IPTVItem[]>([]);
  const [previewChannel, setPreviewChannel] = useState<IPTVItem | null>(null);
  const [previewEPG, setPreviewEPG] = useState<EPGEntry[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLogo, setPreviewLogo] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewNumber, setPreviewNumber] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewStart, setPreviewStart] = useState("");
  const [previewEnd, setPreviewEnd] = useState("");
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCategory, setPreviewCategory] = useState("");
  const [previewFavorite, setPreviewFavorite] = useState(false);
  const [previewResolution, setPreviewResolution] = useState("");
  const [previewAudio, setPreviewAudio] = useState("");
  const [previewCodec, setPreviewCodec] = useState("");
  const [previewBitrate, setPreviewBitrate] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLogoLoaded, setPreviewLogoLoaded] = useState(false);
  const [previewHasEPG, setPreviewHasEPG] = useState(false);
  const [previewIsHD, setPreviewIsHD] = useState(false);
  const [previewIsFavorite, setPreviewIsFavorite] = useState(false);
  const [previewVisibleTimeout, setPreviewVisibleTimeout] = useState(2000);
const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [nextChannelName, setNextChannelName] = useState("");
  const [lastChannelLogo, setLastChannelLogo] = useState("");
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [savedProgressTime, setSavedProgressTime] = useState(0);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [currentResolution, setCurrentResolution] = useState('1080p HD');
  const [buffering, setBuffering] = useState(false);
  const [bufferPercent, setBufferPercent] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const showBrightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [volume, setVolume] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [showBrightness, setShowBrightness] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  
  useEffect(() => {
  const timer = setInterval(() => {
    const now = new Date();
    setClock(now);
    setCurrentDate(now);
  }, 1000);

  return () => clearInterval(timer);
}, []);
  
  const [showChannelInfo, setShowChannelInfo] = useState(true);
  const [currentBitrate, setCurrentBitrate] = useState("AUTO");
  const [audioCodec, setAudioCodec] = useState("AAC");
  const [codec, setCodec] = useState("H.264");
  const [streamType, setStreamType] = useState("HLS");
  const [latency] = useState("LOW LATENCY");
  const [playerEngine] = useState("HLS.js");
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
    if (channelInfoTimeoutRef.current) {
  clearTimeout(channelInfoTimeoutRef.current);
}
    setShowChannelInfo(true);
    if (zapTimeoutRef.current) {
  clearTimeout(zapTimeoutRef.current);
}
setShowZapBanner(false);

requestAnimationFrame(() => {
  setLastChannelLogo(item.logo);
  setShowZapBanner(true);
});

zapTimeoutRef.current = setTimeout(() => {
  setShowZapBanner(false);
}, 1500);
    setChannelNumber(item.streamId ?? "");
    setPreviewChannel(item);
    
setPreviewLogo(item.logo);
setPreviewTitle(item.name);
setPreviewNumber(item.streamId ?? "");
setPreviewVisible(true);
if (item.type !== "live") {
  setPreviewVisible(false);
}
setPlayerControlsVisible(true);


resetControlsTimeout();
setPreviewProgress(
  currentEPG.length > 0
    ? getProgramProgress(currentEPG[0].start, currentEPG[0].end)
    : 0
);
setPreviewEPG(currentEPG);
setPreviewHasEPG(currentEPG.length > 0);
if (currentEPG.length > 0) {
  setPreviewDescription(currentEPG[0].description);
}
if (previewTimeoutRef.current) {
  clearTimeout(previewTimeoutRef.current);
}

previewTimeoutRef.current = setTimeout(() => {
  setPreviewVisible(false);
}, 3500);


channelInfoTimeoutRef.current = setTimeout(() => {
  setShowChannelInfo(false);
}, 6000);

    // Load saved progress for movie/series auto-resume
    if (item.type !== 'live') {
      const savedProgress = storage.getProgress();
      const progress = savedProgress.find(p => p.itemId === progressKey);
      if (progress && progress.position > 10 && progress.position < progress.duration - 15) {
  setSavedProgressTime(progress.position);
  setShowResumePrompt(true);

  // Automatically hide prompt after 6 seconds
  const t = setTimeout(() => setShowResumePrompt(false), 6000);

  setTimeout(() => clearTimeout(t), 6000);
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
            setCurrentBitrate(
  `${Math.round((level.bitrate || 0) / 1000)} kbps`
);
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
      if (zapTimeoutRef.current) {
  clearTimeout(zapTimeoutRef.current);
}

if (channelInfoTimeoutRef.current) {
  clearTimeout(channelInfoTimeoutRef.current);
}
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, progressKey]);

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
          percentage: Math.max(1, Math.round((pos / dur) * 100)),
          updatedAt: Date.now(),
          episodeId: episodeId
        };
        
        storage.saveProgress([...filtered, newProgress]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [item, progressKey, episodeId]);

  // Track state updates
  const handleTimeUpdate = () => {
    const video = videoRef.current;
if (!video) return;
if (video.buffered.length > 0) {
  const end = video.buffered.end(video.buffered.length - 1);
  const percent = video.duration
    ? Math.min(100, (end / video.duration) * 100)
    : 0;

  setBufferPercent(Math.round(percent));
}


setVolume(Math.round(video.volume * 100));
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (
  item.type === "series" &&
  duration > 0 &&
  videoRef.current.currentTime >= duration - 5 &&
  !showNextEpisode
) {
  setShowNextEpisode(true);
  setNextEpisodeCountdown(10);
}
    }
  };

  const handleLoadedMetadata = () => {
  if (videoRef.current) {
    setDuration(videoRef.current.duration || 0);
    setVolume(Math.round(videoRef.current.volume * 100));
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
    const changeBrightness = (delta: number) => {
  setBrightness(prev => Math.max(30, Math.min(150, prev + delta)));
};
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    setVolume(Math.round(video.volume * 100));
    resetControlsTimeout();
    setShowVolume(true);

if (showVolumeTimeoutRef.current) {
  clearTimeout(showVolumeTimeoutRef.current);
}

showVolumeTimeoutRef.current = setTimeout(() => {
  setShowVolume(false);
}, 1500);
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
      videoRef.current.currentTime = Math.min(
  savedProgressTime,
  (videoRef.current.duration || savedProgressTime) - 2
);
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
        onWaiting={() => {
  setBuffering(true);
  setBufferPercent(0);
}}
onPlaying={() => {
  setBuffering(false);
  setBufferPercent(100);
}}
onCanPlay={() => {
  setBuffering(false);
}}
onError={() => {
  setBuffering(false);
  setBufferPercent(0);
  console.error("Error al cargar el video");
}}

        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ filter: `brightness(${brightness}%)` }}
className="w-full h-full object-contain transition-all duration-150"
        onClick={() => setPlayerControlsVisible(!playerControlsVisible)}
      />
{buffering && (
  
  <div className="absolute inset-0 flex items-center justify-center bg-transparent z-50">
    <p className="absolute mt-24 text-white/80 text-sm font-semibold">
  Cargando... {bufferPercent}%
</p>
    <div className="flex flex-col items-center gap-4">
  <div className="w-12 h-12 border-4 border-white/20 border-t-[#0066FF] rounded-full animate-spin" />

  <div className="w-56 h-2 bg-white/10 rounded-full overflow-hidden">
    <div
      className="h-full bg-[#0066FF] transition-all duration-300"
      style={{ width: `${bufferPercent}%` }}
    />
  </div>
</div>
  </div>
)}

{showVolume && (
  <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/80 rounded-2xl p-4 z-50 w-20">
    <div className="text-center text-white text-sm font-bold mb-3">
      {volume}%
    </div>

    <div className="h-40 w-2 mx-auto bg-white/20 rounded-full overflow-hidden">
      <div
        className="bg-[#0066FF] w-full transition-all"
        style={{ height: `${volume}%`, marginTop: `${100 - volume}%` }}
      />
    </div>
  </div>
)}
      {/* Embedded Subtitles Simulation */}
      {subtitlesEnabled && item.type !== 'live' && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-black/80 backdrop-blur-sm border border-zinc-900 rounded-xl text-center text-white font-medium text-lg tracking-wide z-10">
          [Subtítulos en Español simulados para la reproducción]
        </div>
      )}

      {/* Auto Resume Toast Alert */}
      {showResumePrompt && (
        <div className="absolute top-10 right-10 bg-[#0C0C0C]/90 border border-white/5 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex flex-col gap-3 max-w-sm z-50 animate-bounce">
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
        {showZapBanner && item.type === "live" && (
  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#0C0C0C]/95 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(0,0,0,0.7)] backdrop-blur-md z-50 animate-in fade-in duration-300">

    <img
      src={lastChannelLogo || item.logo}
      loading="eager"
      alt={item.name}
      className="w-14 h-14 rounded-lg object-cover bg-[#141414]"
      referrerPolicy="no-referrer"
    />

    <div>
      <div className="text-[10px] text-[#0066FF] font-mono uppercase font-bold">
        {Number(channelNumber) > 0 ? `CH ${channelNumber}` : "LIVE"}
      </div>

      <div className="text-white font-bold text-xl truncate max-w-sm tracking-tight">
        {item.name}
      </div>
    </div>

  </div>
)}{previewVisible && previewChannel && (
  <div className="absolute right-8 top-20 w-96 bg-[#0C0C0C]/95 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl z-40">

    <div className="flex gap-5 items-start">
      <img
        src={previewLogo}
        alt=""
        className="w-20 h-20 rounded-xl object-contain bg-[#141414] border border-white/10 p-2 shadow-lg"
      />

      <div>
        <div className="flex items-center gap-2">
  <span className="px-2 py-0.5 rounded bg-[#0066FF] text-white text-[9px] font-mono font-bold">
    CH {previewNumber}
  </span>

  <span className="text-[9px] text-green-400 font-semibold">
    EN VIVO
  </span>
</div>

        <div className="text-white font-bold text-lg leading-tight">
  {previewTitle}
</div>
        <div className="flex items-center gap-2 mt-2">
  <span className="px-2 py-0.5 rounded bg-[#0066FF]/20 text-[#4DA3FF] text-[9px] font-mono">
    {currentResolution}
  </span>

  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-mono">
    {currentBitrate}
  </span>
</div>
        <div className="text-xs text-white/50 mt-1">
  {previewNumber && `Canal ${previewNumber}`}
</div>
<p className="text-[10px] text-white/40 mt-1 line-clamp-2">
  {previewDescription}
</p>
        {previewEPG.length > 0 && (
          <>
            <div className="text-sm font-semibold text-white mt-2">
              {previewEPG[0].title}
            </div>
            <div className="text-[10px] text-white/40 mt-1">
  {formatEPGTime(previewEPG[0].start)} - {formatEPGTime(previewEPG[0].end)}
</div>
<div className="text-[10px] text-white/40 mt-1"></div>
<div className="text-[10px] text-[#0066FF] mt-1 font-semibold">
  {Math.round(previewProgress)}% del programa
</div>
<div className="flex items-center justify-between mt-1">
  <span className="text-[9px] text-green-400">
    {playerEngine}
  </span>

  <span className="text-[9px] text-[#0066FF]">
    {latency}
  </span>
</div>

            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0066FF]"
                style={{
                  width: `${getProgramProgress(
                    previewEPG[0].start,
                    previewEPG[0].end
                  )}%`,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>

  </div>
)}
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
              <div className="flex items-center gap-3 mt-0.5">
  <span className="px-2 py-1 rounded-md bg-[#0066FF] text-white text-[10px] font-mono font-bold">
    {Number(channelNumber) > 0 ? `CH ${channelNumber}` : "LIVE"}
  </span>

  <h2 className="text-xl font-display font-extrabold text-white tracking-tight uppercase">
    {item.name} {item.type === 'series' && episodeId && ` - ${item.episodes?.find(e => e.id === episodeId)?.title}`}
  </h2>
</div>
                
          </div>
          </div>

          {/* Stream specs */}
          <div className="flex items-center gap-3">

  <span className="px-3 py-1.5 bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] text-[10px] font-bold font-mono uppercase rounded-lg tracking-wider shadow-[0_0_10px_rgba(0,102,255,0.1)]">
    {currentResolution}
  </span>

  <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold font-mono uppercase rounded-lg tracking-wider">
    {item.type === "live" ? "LIVE" : "VOD"}
  </span>

  <span className="px-3 py-1.5 bg-white/5 border border-white/5 text-white/40 text-[10px] font-bold font-mono uppercase rounded-lg tracking-wider">
    {item.type === "live" ? "STREAM EN VIVO" : "HLS VOD"}
  </span>
<div className="flex flex-col items-start px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg">
  <span className="text-[10px] text-white/80 font-mono">
    {clock.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}
  </span>

  <span className="text-[9px] text-white/40">
    {currentDate.toLocaleDateString()}
  </span>

  <div className="flex flex-col items-center">
  <span className="text-[9px] text-[#0066FF] font-mono">
    {item.type === "live"
      ? `LIVE • ${currentResolution}`
      : `VOD • ${currentResolution}`}
  </span>

  <span className="text-[8px] text-white/40 font-mono">
    {currentBitrate}
  </span>

  <div className="flex flex-col items-center">
  <div className="flex gap-2">
    <span className="text-[8px] text-white/30 font-mono">
      {codec}
    </span>

    <span className="text-[8px] text-[#0066FF] font-mono">
      {streamType}
    </span>
  </div>

  <div className="flex gap-2">
  <span className="text-[8px] text-green-400 font-mono">
    {latency}
  </span>

  <span className="text-[8px] text-white/40 font-mono">
    {playerEngine}
  </span>
</div>
</div>
</div>
</div>
</div>
        </div>

      {/* HUD Center Info Panel (EPG REAL) */}
{item.type === 'live' && (playerControlsVisible || showChannelInfo) && (
  <div className="self-start max-w-lg ml-16 mt-6 bg-[#0C0C0C]/80 border border-white/5 rounded-2xl p-5 backdrop-blur-md">

    {loadingEPG ? (
      <p className="text-white/60 text-sm">
        Cargando guía...
      </p>
    ) : currentEPG.length > 0 ? (
      <>
        <span className="text-[9px] text-[#0066FF] font-bold font-mono uppercase tracking-widest">
          En emisión ahora
        </span>

        <h3 className="text-base font-display font-bold text-white mt-1 uppercase tracking-tight">
          {currentEPG[0].title}
        </h3>

        <p className="text-xs text-white/50 mt-1">
  {formatEPGTime(currentEPG[0].start)}
  {" - "}
  {formatEPGTime(currentEPG[0].end)}
</p>
<div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
  <div
    className="h-full bg-[#0066FF] transition-all duration-500"
    style={{
      width: `${getProgramProgress(
        currentEPG[0].start,
        currentEPG[0].end
      )}%`,
    }}
  />
</div>
        <p className="text-xs text-white/70 mt-2 line-clamp-3">
          {currentEPG[0].description}
        </p>

        {currentEPG.length > 1 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
              Sigue
            </p>

            <p className="text-sm text-white font-semibold mt-1">
              {currentEPG[1].title}
            </p>

            <p className="text-xs text-white/50">
  {formatEPGTime(currentEPG[1].start)}
  {" - "}
  {formatEPGTime(currentEPG[1].end)}
</p>
          </div>
        )}
      </>
    ) : (
      <p className="text-white/60 text-sm">
        No hay información de programación.
      </p>
    )}

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
