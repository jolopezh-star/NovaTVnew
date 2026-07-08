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
  triggerPlay,
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

    </div>
  );
}