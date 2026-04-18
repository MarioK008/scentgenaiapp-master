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
      <img alt="ScentGenAI" className="h-12 w-auto transition-smooth object-contain" src="/lovable-uploads/258697a9-8e5b-436b-b210-b4cd99c8aed8.png" />

      {/* Text Logo - Only shown in full variant */}
      {variant === "full" && <span className="font-playfair text-2xl font-bold text-foreground tracking-tight">
          ScentGenAI
        </span>}
    </div>;
};