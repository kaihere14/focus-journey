import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MapControlButton({
  icon: Icon,
  onClick,
  active,
  label,
  className,
}: {
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white",
        active && "bg-white/15 text-white",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  );
}
