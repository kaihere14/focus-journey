import { Car, Motorbike, Truck, type LucideIcon } from "lucide-react";
import type { MapboxRoutingProfile } from "@/components/map/focus-map";

export type VehicleKey = "car" | "motorcycle" | "truck";

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
    key: "truck",
    label: "Truck",
    icon: Truck,
    profile: "driving",
    markerImage: "/vehicles/truck.webp",
  },
];

export const DEFAULT_VEHICLE: VehicleKey = "car";

export function getVehicleOption(key: VehicleKey): VehicleOption {
  return (
    VEHICLE_OPTIONS.find((option) => option.key === key) ?? VEHICLE_OPTIONS[0]
  );
}

export type VehicleEnum = "CAR" | "MOTORCYCLE" | "TRUCK";

const VEHICLE_ENUM_TO_KEY: Record<VehicleEnum, VehicleKey> = {
  CAR: "car",
  MOTORCYCLE: "motorcycle",
  TRUCK: "truck",
};

export function vehicleEnumToKey(vehicle: VehicleEnum): VehicleKey {
  return VEHICLE_ENUM_TO_KEY[vehicle];
}
