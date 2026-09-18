import { Car } from "lucide-react";

export function MapLoader({
  visible,
  label = "Loading map…",
}: {
  visible: boolean;
  label?: string;
}) {
  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="map-loader-car text-white">
        <Car className="size-10" strokeWidth={1.5} />
      </div>
      <div className="map-loader-road h-px w-24 bg-white/10" />
      <p className="text-sm font-medium text-white/60">{label}</p>
    </div>
  );
}
