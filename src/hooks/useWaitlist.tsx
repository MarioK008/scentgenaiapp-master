import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useWaitlist = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitEmail = async (email: string) => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const { data, error } = await supabase.functions.invoke('submit-waitlist', {
        body: { email }
      });

      if (error) throw error;

      // Handle error response from edge function
      if (data?.error) {
        if (data.error.includes('already on the waitlist')) {
          toast({
            title: "You're already registered!",
            description: "We'll notify you when we launch early access.",
            variant: "default"
          });
        } else {
          toast({
            title: "Something went wrong",
            description: data.error || "Please try again later.",
            variant: "destructive"
          });
        }
        return false;
      }

      // Success
      setIsSuccess(true);
      toast({
        title: "Welcome to the waitlist! 🎉",
        description: "You're among the first to explore your personal scent universe.",
        variant: "default"
      });
      
      return true;

    } catch (error) {
      console.error('Waitlist submission error:', error);
      toast({
        title: "Failed to join waitlist",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitEmail, isLoading, isSuccess };
};
