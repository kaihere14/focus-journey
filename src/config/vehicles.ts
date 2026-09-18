import {
  Car,
  Motorbike,
  Bike,
  Footprints,
  type LucideIcon,
} from "lucide-react";
import type { MapboxRoutingProfile } from "@/components/map/focus-map";

export type VehicleKey = "car" | "motorcycle" | "bicycle" | "walking";

export type VehicleOption = {
  key: VehicleKey;
  label: string;
  icon: LucideIcon;
  profile: MapboxRoutingProfile;
  markerImage: string;
};

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    key: "car",
    label: "Car",
    icon: Car,
    profile: "driving",
    markerImage: "/vehicles/car.webp",
  },
  {
    key: "motorcycle",
    label: "Motorcycle",
    icon: Motorbike,
    profile: "driving",
    markerImage: "/vehicles/motorcycle.webp",
  },
  {
    key: "bicycle",
    label: "Bicycle",
    icon: Bike,
    profile: "cycling",
    markerImage: "/vehicles/bicycle.webp",
  },
  {
    key: "walking",
    label: "Walking",
    icon: Footprints,
    profile: "walking",
    markerImage: "/vehicles/walking.webp",
  },
];

export const DEFAULT_VEHICLE: VehicleKey = "car";

export function getVehicleOption(key: VehicleKey): VehicleOption {
  return (
    VEHICLE_OPTIONS.find((option) => option.key === key) ?? VEHICLE_OPTIONS[0]
  );
}
