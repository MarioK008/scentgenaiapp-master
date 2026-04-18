import { cn } from "@/lib/utils";
import logoImage from "@/assets/scentgenai-logo.png";
interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}
export const Logo = ({
  variant = "full",
  className
}: LogoProps) => {
  return <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Image */}
      <img alt="ScentGenAI" className="h-12 w-auto transition-smooth" src="/lovable-uploads/3603309c-95d3-4aea-8e22-13030b65d4bd.png" />

      {/* Text Logo - Only shown in full variant */}
      {variant === "full" && <span className="font-playfair text-2xl font-bold text-foreground tracking-tight">
          ScentGenAI
        </span>}
    </div>;
};