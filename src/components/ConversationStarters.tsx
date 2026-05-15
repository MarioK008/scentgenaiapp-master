import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const STARTER_PROMPTS = [
  "Find me a fragrance for a summer evening",
  "What scent pairs well with oud?",
  "I want something that lasts all day",
  "Suggest a fragrance similar to Bleu de Chanel",
];

interface ConversationStartersProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const ConversationStarters = ({ onSelect, disabled }: ConversationStartersProps) => {
  return (
    <div className="space-y-3 animate-fade-in">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Try one of these
      </p>
      <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(p)}
            className="rounded-full text-sm h-auto py-2 px-4 border-accent/30 hover:bg-accent/10 hover:border-accent/60"
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ConversationStarters;
