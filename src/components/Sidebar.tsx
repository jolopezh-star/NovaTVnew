import React from 'react';
import { Tv, Film, Play, Heart, Clock, Search, Settings, ShieldAlert } from 'lucide-react';
import { SidebarTab } from '../types';

interface SidebarProps {
  activeTab: SidebarTab;
  focusedIndex: number; // 0 to 6 representing the sidebar items
  activeArea: 'sidebar' | 'categories' | 'grid';
  onSelectTab: (tab: SidebarTab) => void;
  fontSize: 'normal' | 'large' | 'extra-large';
}

export default function Sidebar({
  activeTab,
  focusedIndex,
  activeArea,
  onSelectTab,
  fontSize
}: SidebarProps) {
  const tabsList = [
    { id: SidebarTab.Live, label: 'TV en Vivo', icon: Tv },
    { id: SidebarTab.Movies, label: 'Películas', icon: Film },
    { id: SidebarTab.Series, label: 'Series', icon: Play },
    { id: SidebarTab.Favorites, label: 'Favoritos', icon: Heart },
    { id: SidebarTab.Recents, label: 'Recientes', icon: Clock },
    { id: SidebarTab.Search, label: 'Buscar', icon: Search },
    { id: SidebarTab.SettingsTab, label: 'Configuración', icon: Settings }
  ];

  const isSidebarFocused = activeArea === 'sidebar';

  return (
    <div
      className={`h-screen flex flex-col bg-[#0C0C0C] border-r border-white/5 transition-all duration-150 ${
        isSidebarFocused ? 'w-80 shadow-[10px_0_35px_rgba(0,0,0,0.75)]' : 'w-20'
      } z-40 shrink-0 select-none`}
    >
      {/* Brand Logo / Watermark */}
      <div className="flex items-center h-24 px-5 gap-3 border-b border-white/5 overflow-hidden">
        <div className="h-14 w-14 rounded-xl bg-[#0066FF] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,102,255,0.5)]">
          <Tv className="w-7 h-7 text-white" />
        </div>
        <div
          className={`flex flex-col transition-opacity duration-150 ${
            isSidebarFocused ? 'opacity-100' : 'opacity-0 w-0'
          }`}
        >
          <span className="font-display font-extrabold tracking-tight text-white leading-none text-lg uppercase">
            webOS <span className="text-[#0066FF]">IPTV</span>
          </span>
          <span className="text-[9px] text-white/40 tracking-widest font-mono font-semibold uppercase mt-1">
            PRO PLAYER
          </span>
        </div>
      </div>

      {/* Tabs Menu List */}
      <div className="flex-1 py-6 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
        <div className="space-y-2 px-3">
          {tabsList.map((tab, idx) => {
            const IconComponent = tab.icon;
            const isTabActive = activeTab === tab.id;
            const isTabFocused = isSidebarFocused && focusedIndex === idx;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-5 rounded-xl transition-all duration-150 outline-none relative group border ${
                  isTabFocused
                    ? 'bg-[#0066FF]/20 text-[#0066FF] border-[#0066FF]/40 shadow-[0_0_15px_rgba(0,102,255,0.25)]'
                    : isTabActive
                    ? 'bg-white/5 text-white border-white/5'
                    : 'text-white/40 border-transparent hover:text-white hover:bg-white/5'
                }`}
                style={{
                  transform: isTabFocused ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {/* Active Indicator on Left side */}
                {isTabActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-lg bg-[#0066FF] shadow-[0_0_10px_rgba(0,102,255,0.8)]" />
                )}

                <IconComponent
                  className={`w-6 h-6 shrink-0 transition-colors ${
                    isTabFocused || isTabActive ? 'text-[#0066FF]' : 'text-white/40 group-hover:text-white'
                  }`}
                />

                <span
                  className={`font-display font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isSidebarFocused ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden'
                  } ${fontSize === 'large' ? 'text-lg' : fontSize === 'extra-large' ? 'text-xl' : 'text-sm'}`}
                >
                  {tab.label}
                </span>

                {/* Mini notification dot for active area feedback */}
                {isTabFocused && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Workspace Info (Minimal, TV-Safe) */}
        <div className="px-5 py-4 border-t border-white/5 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#0066FF] shadow-[0_0_8px_rgba(0,102,255,0.8)] animate-pulse" />
            <span
              className={`text-[10px] text-white/30 font-mono font-semibold uppercase tracking-widest transition-opacity duration-150 ${
                isSidebarFocused ? 'opacity-100' : 'opacity-0 w-0'
              }`}
            >
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
