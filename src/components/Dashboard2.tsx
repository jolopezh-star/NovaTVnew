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

  return (
    <div className="text-white mt-8">

      <ContentRow
        title="🕘 Canales recientes"
        items={recentChannels}
        focusedIndex={
  dashboardRowIndex === 1
    ? dashboardItemIndex
    : -1
}
        onSelect={triggerPlay}
        posterHeight="h-52"
      />
      <ContentRow
  title="▶ Continuar viendo"
  items={continueWatching.map(({ item }) => item)}
  focusedIndex={
    dashboardRowIndex === 2
      ? dashboardItemIndex
      : -1
  }
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
  );
}