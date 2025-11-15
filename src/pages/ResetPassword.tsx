import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Lock } from "lucide-react";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { Logo } from "@/components/Logo";

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  return Math.min(strength, 100);
};

const getStrengthLabel = (strength: number): { label: string; color: string } => {
  if (strength >= 80) return { label: "Strong", color: "text-green-500" };
  if (strength >= 50) return { label: "Medium", color: "text-yellow-500" };
  return { label: "Weak", color: "text-red-500" };
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { updatePassword, isLoading } = usePasswordReset();
  const navigate = useNavigate();

  const passwordStrength = calculatePasswordStrength(password);
  const strengthInfo = getStrengthLabel(passwordStrength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return;
    }

    if (password.length < 8) {
      return;
    }

    const success = await updatePassword(password);
    if (success) {
      navigate("/auth");
    }
  };

  const isValid = password.length >= 8 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-[#F7B731]/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo variant="compact" />
          </div>
          <CardTitle className="text-3xl font-playfair text-foreground">
            Set New Password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create a strong password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-[#FF2E92]"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {password && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={strengthInfo.color}>{strengthInfo.label}</span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-[#FF2E92]"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-secondary/30 border border-border/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Password must contain:</p>
              <div className="space-y-1 text-xs">
                <div className={password.length >= 8 ? "text-green-500" : "text-muted-foreground"}>
                  • At least 8 characters
                </div>
                <div className={/[A-Z]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
                  • One uppercase letter
                </div>
                <div className={/[a-z]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
                  • One lowercase letter
                </div>
                <div className={/[0-9]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
                  • One number
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF2E92] to-[#F7B731] hover:opacity-90 text-white font-semibold"
              disabled={isLoading || !isValid}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
