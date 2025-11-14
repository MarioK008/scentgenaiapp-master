import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

export const Logo = ({ variant = "full", className }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Perfume Bottle with Genie Swirl - Thin Line Art */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-smooth"
      >
        {/* Bottle Cap */}
        <rect
          x="13"
          y="4"
          width="6"
          height="3"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-accent"
        />
        {/* Bottle Neck */}
        <path
          d="M14 7 L14 10 L18 10 L18 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-foreground"
        />
        {/* Bottle Body */}
        <path
          d="M12 10 C12 10 11 11 11 12 L11 24 C11 25.5 12 26 13.5 26 L18.5 26 C20 26 21 25.5 21 24 L21 12 C21 11 20 10 20 10 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
        />
        {/* Genie Swirl Inside */}
        <path
          d="M15 14 Q16 16 15 18 Q14 20 16 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          className="text-primary opacity-80"
        />
        <circle
          cx="16"
          cy="23"
          r="0.8"
          fill="currentColor"
          className="text-accent"
        />
      </svg>

      {/* Text Logo - Only shown in full variant */}
      {variant === "full" && (
        <span className="font-playfair text-2xl font-bold text-foreground tracking-tight">
          ScentGenAI
        </span>
      )}
    </div>
  );
};
