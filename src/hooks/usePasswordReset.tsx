import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link. It expires in 1 hour.",
      });

      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      return true;
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Failed to update password",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestPasswordReset, updatePassword, isLoading };
};
