import ContentRow from "./ContentRow";
import { storage } from "../utils";

interface DashboardProps {
  dashboardRowIndex: number;
  items: any[];
  continueWatching: any[];
  triggerPlay: (item: any, episodeId?: string) => void;
  playSelectedItem: (item: any) => void;
  openSeriesDetail: (item: any) => Promise<any>;
  onExploreCatalog: () => void;
}

export default function Dashboard({
  dashboardRowIndex,
  items,
  continueWatching,
  triggerPlay,
  playSelectedItem,
  openSeriesDetail,
  onExploreCatalog,
}: DashboardProps) {
  const recentChannels = storage.getRecentChannels();
  return (
    <div className="min-h-screen bg-[#050505] text-white p-10">
{recentChannels.length > 0 && (
  <div
    className={`rounded-2xl transition-all ${
      dashboardRowIndex === 1
        ? "ring-4 ring-[#0066FF] shadow-[0_0_30px_rgba(0,102,255,0.45)]"
        : ""
    }`}
  >
    <ContentRow
    title="🕘 Canales recientes"
    items={recentChannels}
    focusedIndex={dashboardRowIndex === 1 ? 0 : -1}
    onSelect={triggerPlay}
    posterHeight="h-52"
    renderPoster={(item) => (
      <div className="w-52 h-52 rounded-2xl bg-[#111] flex items-center justify-center">
        <img
          src={item.logo}
          alt={item.name}
          className="max-w-full max-h-full object-contain p-6"
        />
      </div>
    )}
      />
  </div>
)}
    
        {continueWatching.length > 0 && (
<>
<h2
  className="text-2xl font-semibold mb-6"
>
  Continuar viendo
</h2>

<div className="flex gap-6 overflow-x-auto">
  {continueWatching.map(({ item, progress }) => (
    <div
      key={item.id}
      className="w-52 shrink-0 cursor-pointer"
      onClick={async () => {
        if (item.type === "series") {
          const fullSeries = await openSeriesDetail(item);

          if (fullSeries && progress.episodeId) {
            triggerPlay(fullSeries, progress.episodeId);
          }
        } else {
          triggerPlay(item);
        }
      }}
    >
      <img
        src={item.logo}
        alt={item.name}
        className="w-52 h-72 object-cover rounded-2xl"
      />
      <p className="mt-3 text-sm">
        {item.name}
      </p>
    </div>
  ))}
</div>
</>
)}
  <ContentRow
  title="⭐ Películas mejor valoradas"
  items={items
    .filter(i => i.type === "movie")
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 10)}
  onSelect={triggerPlay}
/>

<ContentRow
  title="🆕 Añadidas recientemente"
  items={items
    .filter(i => i.type === "movie")
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 10)}
  onSelect={triggerPlay}
/>

<ContentRow
  title="📺 Series"
  items={items
    .filter(i => i.type === "series")
    .slice(0, 10)}
  onSelect={playSelectedItem}
/>

<ContentRow
  title="📡 TV en vivo"
  items={items
    .filter(i => i.type === "live")
    .slice(0, 10)}
  onSelect={triggerPlay}
  posterHeight="h-52"
  renderPoster={(item) => (
    <div className="w-52 h-52 rounded-2xl bg-[#111] flex items-center justify-center">
      <img
        src={item.logo}
        alt={item.name}
        className="max-w-full max-h-full object-contain p-6"
      />
    </div>
  )}
/>

<div className="mt-10">
  <button
    onClick={onExploreCatalog}
    className="px-8 py-3 rounded-xl bg-[#0066FF] text-white font-bold"
  >
    Explorar catálogo
  </button>
</div>
</div>
  );
}