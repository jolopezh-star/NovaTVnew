import { useEffect, useRef } from "react";
import ContentRow from "./ContentRow";

interface Dashboard2Props {
  dashboardRowIndex: number;
  dashboardItemIndex: number;
  items: any[];
  continueWatching: any[];
  triggerPlay: (item: any, episodeId?: string) => void;
  playSelectedItem: (item: any) => void;
  openSeriesDetail: (item: any) => Promise<any>;
  onExploreCatalog: () => void;
}

export default function Dashboard2({
  dashboardRowIndex,
  dashboardItemIndex,
  items,
  continueWatching,
  triggerPlay,
  playSelectedItem,
  openSeriesDetail,
}: Dashboard2Props) {

  const recentChannels = items
    .filter(item => item.type === "live")
    .slice(0, 10);

  const topMovies = items
    .filter(item => item.type === "movie")
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 10);

const recentMovies = items
    .filter(item => item.type === "movie")
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 10);

const series = items
    .filter(item => item.type === "series")
    .slice(0, 10);
const rowSizes = {
  1: recentChannels.length,
  2: continueWatching.length,
  3: topMovies.length,
  4: recentMovies.length,
  5: series.length,
};
const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

useEffect(() => {

  if (dashboardRowIndex === 0) {

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  rowRefs.current[dashboardRowIndex]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

}, [dashboardRowIndex]);
return (
<div className="text-white mt-8">

<div
  ref={(el) => {
    rowRefs.current[1] = el;
  }}
>
  <ContentRow
    title="🕘 Canales recientes"
    items={recentChannels}
    focusedIndex={dashboardRowIndex === 1 ? dashboardItemIndex : -1}
    onSelect={triggerPlay}
    posterHeight="h-52"
  />
</div>

<div
  ref={(el) => {
    rowRefs.current[2] = el;
  }}
>
  <ContentRow
    title="▶ Continuar viendo"
    items={continueWatching.map(({ item }) => item)}
    focusedIndex={dashboardRowIndex === 2 ? dashboardItemIndex : -1}
    onSelect={async (item) => {

      const progress = continueWatching.find(
        p => p.item.id === item.id
      );

      if (!progress) return;

      if (item.type === "series") {

        const fullSeries = await openSeriesDetail(item);

        if (fullSeries && progress.progress.episodeId) {
          triggerPlay(fullSeries, progress.progress.episodeId);
        }

      } else {

        triggerPlay(item);

      }

    }}
  />
</div>
<div
  ref={(el) => {
    rowRefs.current[3] = el;
  }}
>
  <ContentRow
    title="⭐ Películas mejor valoradas"
    items={topMovies}
    focusedIndex={dashboardRowIndex === 3 ? dashboardItemIndex : -1}
    onSelect={triggerPlay}
  />
</div>

<div
  ref={(el) => {
    rowRefs.current[4] = el;
  }}
>
  <ContentRow
    title="🆕 Añadidas recientemente"
    items={recentMovies}
    focusedIndex={dashboardRowIndex === 4 ? dashboardItemIndex : -1}
    onSelect={triggerPlay}
  />
</div>

<div
  ref={(el) => {
    rowRefs.current[5] = el;
  }}
>
  <ContentRow
    title="📺 Series"
    items={series}
    focusedIndex={dashboardRowIndex === 5 ? dashboardItemIndex : -1}
    onSelect={playSelectedItem}
  />
</div>

</div>
);
}