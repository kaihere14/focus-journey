export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const MAPBOX_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

export type MapboxStyleKey = keyof typeof MAPBOX_STYLES;
