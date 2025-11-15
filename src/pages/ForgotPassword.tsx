import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { Logo } from "@/components/Logo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { requestPasswordReset, isLoading } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await requestPasswordReset(email);
    if (success) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-[#F7B731]/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo variant="compact" />
          </div>
          <CardTitle className="text-3xl font-playfair text-foreground">
            {submitted ? "Check Your Email" : "Reset Password"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {submitted 
              ? "We've sent you a password reset link if an account exists with that email."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-[#FF2E92] focus:ring-[#FF2E92]/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF2E92] to-[#F7B731] hover:opacity-90 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center pt-4">
                <Link
                  to="/auth"
                  className="text-sm text-[#FF2E92] hover:text-[#F7B731] font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/30 border border-[#F7B731]/30 rounded-lg p-4 text-center">
                <Mail className="h-12 w-12 mx-auto mb-3 text-[#F7B731]" />
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong className="text-foreground">{email}</strong>, you'll receive a password reset link shortly.
                </p>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#F7B731]/30 hover:bg-secondary/50"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                >
                  Try Again
                </Button>
                <Link to="/auth" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-[#FF2E92] to-[#F7B731]">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
