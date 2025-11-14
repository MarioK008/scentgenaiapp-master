import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { useWaitlist } from "@/hooks/useWaitlist";

interface WaitlistFormProps {
  variant?: "hero" | "cta";
  className?: string;
}

export const WaitlistForm = ({ variant = "hero", className = "" }: WaitlistFormProps) => {
  const [email, setEmail] = useState("");
  const { submitEmail, isLoading, isSuccess } = useWaitlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const success = await submitEmail(email);
    if (success) {
      setEmail(""); // Reset form on success
    }
  };

  // Styles based on variant
  const inputStyles = variant === "hero" 
    ? "h-14 bg-[#1C3B63] border-[#F7B731]/30 focus:border-[#FF2E92] text-white placeholder:text-[#B0C4DE]"
    : "h-14 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:border-white/50";

  const buttonStyles = variant === "hero"
    ? "bg-gradient-to-r from-[#FF2E92] to-[#F7B731] hover:opacity-90 text-white h-14 px-8"
    : "bg-white text-[#FF2E92] hover:bg-white/90 h-14 px-8";

  return (
    <form onSubmit={handleSubmit} className={`max-w-md mx-auto ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || isSuccess}
          className={`flex-1 rounded-full px-6 text-base ${inputStyles}`}
        />
        <Button
          type="submit"
          disabled={isLoading || isSuccess || !email}
          className={`whitespace-nowrap font-semibold rounded-full shadow-lg hover:shadow-xl transition-all ${buttonStyles}`}
        >
          {isLoading ? (
            "Joining..."
          ) : isSuccess ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Joined!
            </>
          ) : (
            <>
              {variant === "hero" ? "Join Waitlist" : "Get Early Access"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
