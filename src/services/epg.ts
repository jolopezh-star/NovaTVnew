import { XtreamCredentials } from "../types";

export interface EPGEntry {
  title: string;
  description: string;
  start: string;
  end: string;
}

export async function fetchShortEPG(
  creds: XtreamCredentials,
  streamId: string
): Promise<EPGEntry[]> {

  const cleanUrl = creds.url.replace(/\/$/, "");

  const url =
    `${cleanUrl}/player_api.php` +
    `?username=${encodeURIComponent(creds.username)}` +
    `&password=${encodeURIComponent(creds.password)}` +
    `&action=get_short_epg` +
    `&stream_id=${streamId}`;

  try {

    const res = await fetch(url);

    if (!res.ok) {
      return [];
    }

    const data = await res.json();

    if (!data?.epg_listings) {
      return [];
    }

    return data.epg_listings.map((epg: any) => ({

  title: decodeURIComponent(escape(atob(epg.title))),

description: epg.description
  ? decodeURIComponent(escape(atob(epg.description)))
  : "",

  start: epg.start,

  end: epg.end,

}));

  } catch (err) {

    console.error("Error loading EPG:", err);

    return [];
  }

}
export function getCurrentProgram(epg: EPGEntry[]): EPGEntry | null {

  const now = new Date();

  for (const program of epg) {

    const start = new Date(program.start);
    const end = new Date(program.end);

    if (now >= start && now <= end) {
      return program;
    }

  }

  return null;

}
export function formatEPGTime(dateString: string): string {

  if (!dateString) return "--:--";

  const date = new Date(dateString);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

}