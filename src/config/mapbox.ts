export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const MAPBOX_STYLES = {
  monochrome: "mapbox://styles/mapbox/dark-v11",
  terra: "mapbox://styles/mapbox/satellite-v9",
  standard: "mapbox://styles/mapbox/standard",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

export type MapboxStyleKey = keyof typeof MAPBOX_STYLES;

export const MAPBOX_STYLE_OPTIONS: {
  key: MapboxStyleKey;
  label: string;
  previewClassName: string;
}[] = [
  {
    key: "monochrome",
    label: "Monochrome",
    previewClassName: "bg-gradient-to-br from-neutral-700 to-neutral-900",
  },
  {
    key: "terra",
    label: "Terra",
    previewClassName: "bg-gradient-to-br from-slate-800 via-slate-900 to-black",
  },
  {
    key: "standard",
    label: "Standard",
    previewClassName:
      "bg-gradient-to-br from-emerald-700 via-teal-800 to-blue-900",
  },
  {
    key: "satellite",
    label: "Satellite",
    previewClassName:
      "bg-gradient-to-br from-emerald-800 via-teal-900 to-cyan-950",
  },
];
