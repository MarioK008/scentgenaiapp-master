import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trophy, Heart, Star, Users, Sparkles, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

type Rule = { label: string; value: number; suffix: string };
type Group = { key: string; title: string; icon: React.ComponentType<any>; rules: Rule[] };

const GROUPS: Group[] = [
  {
    key: "collection",
    title: "Collection",
    icon: Heart,
    rules: [
      { label: "First Step", value: 1, suffix: "perfume in collection" },
      { label: "Getting Started", value: 5, suffix: "perfumes in collection" },
      { label: "Growing Collection", value: 10, suffix: "perfumes in collection" },
      { label: "Dedicated Collector", value: 25, suffix: "perfumes in collection" },
      { label: "Master Collector", value: 50, suffix: "perfumes in collection" },
      { label: "Perfume Connoisseur", value: 100, suffix: "perfumes in collection" },
    ],
  },
  {
    key: "engagement",
    title: "Engagement",
    icon: Star,
    rules: [
      { label: "First Review", value: 1, suffix: "perfume rated" },
      { label: "Active Reviewer", value: 10, suffix: "perfumes rated" },
      { label: "Expert Critic", value: 25, suffix: "perfumes rated" },
      { label: "Master Reviewer", value: 50, suffix: "perfumes rated" },
      { label: "Quality Seeker", value: 5, suffix: "five-star ratings given" },
      { label: "Perfectionist", value: 10, suffix: "five-star ratings given" },
    ],
  },
  {
    key: "social",
    title: "Social",
    icon: Users,
    rules: [
      { label: "Social Butterfly", value: 5, suffix: "people followed" },
      { label: "Community Member", value: 10, suffix: "people followed" },
      { label: "Influencer", value: 10, suffix: "followers earned" },
      { label: "Popular", value: 25, suffix: "followers earned" },
    ],
  },
  {
    key: "wishlist",
    title: "Wishlist",
    icon: Bookmark,
    rules: [
      { label: "Wish List Starter", value: 5, suffix: "items wishlisted" },
      { label: "Dreaming Big", value: 10, suffix: "items wishlisted" },
      { label: "Ultimate Wishlist", value: 25, suffix: "items wishlisted" },
    ],
  },
  {
    key: "discovery",
    title: "Discovery",
    icon: Sparkles,
    rules: [
      { label: "Note Explorer", value: 10, suffix: "unique notes in collection" },
      { label: "Note Expert", value: 25, suffix: "unique notes in collection" },
      { label: "Note Master", value: 50, suffix: "unique notes in collection" },
    ],
  },
];

export const BadgeRules = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" strokeWidth={1.5} />
              How to earn badges
            </CardTitle>
            <CardDescription>
              Unlock badges by growing your collection, reviewing perfumes, and engaging with the community.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="badge-rules-content"
            className="shrink-0"
          >
            {open ? "Hide" : "Show"}
            <ChevronDown
              className={cn("ml-1 h-4 w-4 transition-transform", open && "rotate-180")}
              strokeWidth={1.5}
            />
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent id="badge-rules-content" className="space-y-6">
          {GROUPS.map(({ key, title, icon: Icon, rules }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
              </div>
              <ul className="space-y-2 pl-6">
                {rules.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-baseline justify-between gap-4 text-sm border-b border-border/30 pb-2 last:border-0"
                  >
                    <span className="text-foreground/90">{r.label}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {r.value} {r.suffix}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default BadgeRules;
