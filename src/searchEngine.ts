import { IPTVItem } from "./types";

export interface SearchIndexItem {
  item: IPTVItem;
  searchText: string;
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
export function buildSearchIndex(
  items: IPTVItem[]
): SearchIndexItem[] {

  return items.map(item => ({

    item,

    searchText: normalizeText(
      [
        item.name,
        item.genre,
        item.year,
      ]
        .filter(Boolean)
        .join(" ")
    ),

  }));

}
export function searchItems(
  index: SearchIndexItem[],
  query: string,
  limit = 30
): IPTVItem[] {

  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  return index
    .filter(entry =>
      entry.searchText.includes(normalizedQuery)
    )
    .sort((a, b) => {

      const aExact =
        a.searchText === normalizedQuery;

      const bExact =
        b.searchText === normalizedQuery;

      if (aExact !== bExact) {
        return aExact ? -1 : 1;
      }

      const aStarts =
        a.searchText.startsWith(normalizedQuery);

      const bStarts =
        b.searchText.startsWith(normalizedQuery);

      if (aStarts !== bStarts) {
        return aStarts ? -1 : 1;
      }

      return a.searchText.localeCompare(b.searchText);

    })
    .slice(0, limit)
    .map(entry => entry.item);

}

