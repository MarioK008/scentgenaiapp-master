import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "slide-up" | "scale";
  delay?: number;
}

export const AnimatedPage = ({ 
  children, 
  className,
  variant = "fade",
  delay = 0 
}: AnimatedPageProps) => {
  const animationClass = {
    fade: "animate-fade-in",
    "slide-up": "animate-slide-up",
    scale: "animate-scale-in",
  }[variant];

  return (
    <div 
      className={cn(animationClass, className)}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
};

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const StaggeredGrid = ({ 
  children, 
  className,
  staggerDelay = 50 
}: StaggeredGridProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in opacity-0"
          style={{ 
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: "forwards"
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default AnimatedPage;
