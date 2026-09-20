// Capsule label above a landing section heading. Top highlight + soft drop
// shadow so it reads as a lifted pill rather than a flat outline.
export default function SectionBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-gradient-to-b from-white to-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_14px_-4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.05)] dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-200 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_6px_14px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.4)]">
      {children}
    </span>
  );
}
