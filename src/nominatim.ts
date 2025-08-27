// Lightweight Nominatim helper for place autocomplete (OpenStreetMap)
// - Uses the public Nominatim API for client-side autocomplete
// - Includes simple in-memory cache and debounced query helper
// - NOTE: Public Nominatim has strict rate limits and forbids heavy production use.
//   For production, self-host Nominatim or use a hosted OSM provider.

export type NominatimPlace = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

const CACHE: Record<string, NominatimPlace[]> = {};

export async function searchPlaces(
  query: string,
  limit = 6
): Promise<NominatimPlace[]> {
  const q = query.trim();
  if (!q) return [];
  const key = `${q}|${limit}`;
  if (CACHE[key]) return CACHE[key];

  // Public Nominatim endpoint
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", String(limit));

  const resp = await fetch(url.toString(), {
    headers: {
      // Identify the application per Nominatim usage policy
      "Accept-Language": "en",
      // It's recommended to set a valid Referer or User-Agent from your app
    },
  });

  if (!resp.ok) {
    throw new Error(`Nominatim error: ${resp.status}`);
  }

  const raw = (await resp.json()) as unknown;
  const arr = Array.isArray(raw) ? raw : [];
  const places = arr.map((p) => {
    const obj = p as Record<string, unknown>;
    return {
      place_id: String(obj.place_id ?? ""),
      display_name: String(obj.display_name ?? ""),
      lat: String(obj.lat ?? ""),
      lon: String(obj.lon ?? ""),
      type: typeof obj.type === "string" ? obj.type : undefined,
    } as NominatimPlace;
  });

  CACHE[key] = places;
  return places;
}

// Simple debounce helper
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait = 300
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): Promise<unknown> =>
    new Promise<unknown>((resolve, reject) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        Promise.resolve(fn(...args)).then(resolve, reject);
      }, wait);
    });
}
