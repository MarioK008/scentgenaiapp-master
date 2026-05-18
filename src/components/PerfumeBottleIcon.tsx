import { cn } from "@/lib/utils";

interface PerfumeBottleIconProps {
  className?: string;
}

/** Simple, neutral line-art perfume bottle placeholder (no AI imagery). */
const PerfumeBottleIcon = ({ className }: PerfumeBottleIconProps) => (
  <svg
    viewBox="0 0 64 80"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("w-1/2 h-1/2 text-muted-foreground/50", className)}
    aria-hidden="true"
  >
    {/* cap */}
    <rect x="24" y="4" width="16" height="10" rx="1.5" />
    {/* neck */}
    <rect x="26" y="14" width="12" height="8" />
    {/* shoulders */}
    <path d="M20 28c0-3 2-6 6-6h12c4 0 6 3 6 6" />
    {/* bottle body */}
    <rect x="14" y="28" width="36" height="44" rx="6" />
    {/* label */}
    <rect x="22" y="44" width="20" height="14" rx="1" opacity="0.6" />
  </svg>
);

export default PerfumeBottleIcon;
