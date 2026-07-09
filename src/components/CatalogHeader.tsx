import React from "react";
import { SidebarTab } from "../types";

interface CatalogHeaderProps {
  activeTab: SidebarTab;
  isDemoMode: boolean;
  onGoHome: () => void;
}

export default function CatalogHeader({
  activeTab,
  isDemoMode,
  onGoHome,
}: CatalogHeaderProps) {

  return (
    <div className="h-20 px-8 border-b border-white/5 bg-[#0C0C0C] flex items-center justify-between">

      <div>

        <h2 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">

          {activeTab === SidebarTab.Live && "Televisión En Vivo"}
          {activeTab === SidebarTab.Movies && "Películas VOD"}
          {activeTab === SidebarTab.Series && "Series de Televisión"}
          {activeTab === SidebarTab.Favorites && "Mis Favoritos"}
          {activeTab === SidebarTab.Recents && "Historial Reciente"}
          {activeTab === SidebarTab.Search && "Buscador Global"}
          {activeTab === SidebarTab.SettingsTab && "Ajustes de webOS"}

          {isDemoMode && (
            <span className="text-[9px] bg-white/5 border border-white/10 text-white/60 font-mono font-bold px-2 py-0.5 rounded-md ml-2 tracking-widest">
              DEMO MODE
            </span>
          )}

        </h2>

      </div>

      <button
        onClick={onGoHome}
        className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold z-50"
      >
        INICIO
      </button>

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
  );

}