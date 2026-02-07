import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Search, 
  Users, 
  Mic, 
  Sparkles,
  Heart,
  MessageSquare 
} from "lucide-react";

type EmptyStateVariant = 
  | "collection" 
  | "search" 
  | "feed" 
  | "conversation" 
  | "recommendations"
  | "wishlist"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: typeof FolderOpen;
  defaultTitle: string;
  defaultDescription: string;
  iconClassName: string;
  bgClassName: string;
}> = {
  collection: {
    icon: Heart,
    defaultTitle: "Your collection awaits",
    defaultDescription: "Start exploring fragrances and add your favorites to build your personal collection",
    iconClassName: "text-primary",
    bgClassName: "bg-primary/10",
  },
  wishlist: {
    icon: Sparkles,
    defaultTitle: "Your wishlist is empty",
    defaultDescription: "Discover fragrances you'd love to try and add them to your wishlist",
    iconClassName: "text-accent",
    bgClassName: "bg-accent/10",
  },
  search: {
    icon: Search,
    defaultTitle: "No fragrances found",
    defaultDescription: "Try adjusting your search terms or explore our recommendations",
    iconClassName: "text-muted-foreground",
    bgClassName: "bg-muted/30",
  },
  feed: {
    icon: Users,
    defaultTitle: "Your scent circle is quiet",
    defaultDescription: "Follow other fragrance enthusiasts to see their discoveries and collections",
    iconClassName: "text-primary",
    bgClassName: "bg-primary/10",
  },
  conversation: {
    icon: Mic,
    defaultTitle: "Ready to chat",
    defaultDescription: "Start a conversation with your AI perfume consultant to discover your next signature scent",
    iconClassName: "text-accent",
    bgClassName: "bg-accent/10",
  },
  recommendations: {
    icon: Sparkles,
    defaultTitle: "Discover your perfect scent",
    defaultDescription: "Tell us your preferences and let AI find the perfect fragrances for you",
    iconClassName: "text-accent",
    bgClassName: "bg-gradient-to-br from-primary/10 to-accent/10",
  },
  generic: {
    icon: FolderOpen,
    defaultTitle: "Nothing here yet",
    defaultDescription: "This space is waiting to be filled with content",
    iconClassName: "text-muted-foreground",
    bgClassName: "bg-muted/20",
  },
};

export const EmptyState = ({
  variant = "generic",
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in",
        className
      )}
    >
      {/* Illustrated icon with ambient background */}
      <div className="relative mb-8">
        <div 
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            config.bgClassName
          )}
        >
          <Icon 
            className={cn("w-10 h-10", config.iconClassName)} 
            strokeWidth={1.5} 
          />
        </div>
        
        {/* Decorative elements */}
        {variant !== "generic" && (
          <>
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
            <div 
              className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-accent/30 animate-pulse" 
              style={{ animationDelay: "300ms" }}
            />
          </>
        )}
      </div>

      {/* Text content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-playfair font-medium">
          {title || config.defaultTitle}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {description || config.defaultDescription}
        </p>
      </div>

      {/* Action button */}
      {(actionLabel || onAction) && (
        <Button 
          onClick={onAction} 
          variant="hero"
          className="mt-8"
          size="lg"
        >
          {actionLabel || "Get Started"}
        </Button>
      )}

      {/* Custom children */}
      {children && (
        <div className="mt-8">
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
