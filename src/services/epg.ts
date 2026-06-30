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

    return data.epg_listings.map((epg: {
  title: string;
  description: string;
  start: string;
  end: string;
}) => ({
      title: epg.title,
      description: epg.description,
      start: epg.start,
      end: epg.end,
    }));

  } catch (err) {

    console.error("Error loading EPG:", err);

    return [];
  }

}