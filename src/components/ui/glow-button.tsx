"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * B6 UI: Glow Button
 *
 * A solid button lit from the inside: an inset glow and a hairline inset ring,
 * both of which brighten on hover. The light never leaves the surface, so a lit
 * control still reads as one flat object rather than as a lamp. A filled face
 * carries a band of its own colour just outside it, which is what keeps the
 * ring reading as a line inside the object instead of as its edge. The focus
 * outline is offset clear of that band.
 */
/**
 * B6 type steps, written as direct token reads.
 *
 * `text-body` and `text-primary-foreground` fall into the same tailwind-merge
 * class group unless cn() has been told the B6 scale is a font size, so under a
 * stock shadcn cn() the size silently deletes the colour and the label renders
 * in whatever colour it inherits, invisible on a solid button. Reading the
 * token directly lands the step in the font-size group for every cn(), extended
 * or not, and still loses to a consumer's own `text-lg`.
 */
const TYPE = {
  small: "text-(length:--text-small) leading-(--text-small--line-height)",
  body: "text-(length:--text-body) leading-(--text-body--line-height)",
} as const;

const glowButtonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2",
    "font-medium whitespace-nowrap select-none",
    "transition-[box-shadow,transform,background-color,color,border-color] duration-200 ease-b6",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
    "active:scale-98",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-primary-foreground shadow-b6-glow-band",
          "inset-shadow-b6-glow inset-ring inset-ring-glow",
          "hover:inset-shadow-b6-glow-strong hover:inset-ring-glow-strong",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground shadow-b6-glow-band-secondary",
          "inset-shadow-b6-glow-secondary inset-ring inset-ring-glow-secondary",
          "hover:inset-shadow-b6-glow-secondary-strong hover:inset-ring-glow-secondary-strong",
        ],
        outline: [
          "border border-border bg-background text-foreground",
          "inset-shadow-b6-glow-secondary",
          "hover:inset-shadow-b6-glow-secondary-strong",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground shadow-b6-glow-band-destructive",
          "inset-shadow-b6-glow-destructive inset-ring inset-ring-glow-destructive",
          "hover:inset-shadow-b6-glow-destructive-strong hover:inset-ring-glow-destructive-strong",
        ],
      },
      size: {
        sm: `h-8 rounded-sm px-3 ${TYPE.small}`,
        md: `h-10 rounded-md px-4 ${TYPE.body}`,
        lg: `h-12 rounded-md px-6 ${TYPE.body}`,
        icon: "size-10 rounded-md p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export interface GlowButtonProps
  extends
    React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof glowButtonVariants> {
  /** Render the child element instead of a `<button>`, keeping all styling. */
  asChild?: boolean;
  /** Show a spinner, block interaction and mark the control busy. */
  loading?: boolean;
  /** Accessible label announced while `loading` is true. */
  loadingLabel?: string;
  /** Icon rendered before the label. Replaced by the spinner while loading. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  function GlowButton(
    {
      className,
      variant,
      size,
      block,
      asChild = false,
      loading = false,
      loadingLabel = "Loading",
      leftIcon,
      rightIcon,
      disabled,
      children,
      type,
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(glowButtonVariants({ variant, size, block }), className)}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={asChild ? isDisabled || undefined : undefined}
        aria-busy={loading || undefined}
        data-loading={loading ? "" : undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            <span className="sr-only">{loadingLabel}</span>
          </>
        ) : (
          leftIcon
        )}
        <Slottable>{children}</Slottable>
        {rightIcon}
      </Comp>
    );
  },
);

export { glowButtonVariants };
