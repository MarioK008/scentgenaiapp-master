import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <Check className="h-3 w-3 text-green-500" />
    ) : (
      <X className="h-3 w-3 text-muted-foreground" />
    )}
    <span className={met ? "text-green-500" : "text-muted-foreground"}>
      {text}
    </span>
  </div>
);

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  
  return Math.min(strength, 100);
};

const getPasswordStrengthLabel = (password: string): string => {
  const strength = calculatePasswordStrength(password);
  
  if (strength < 30) return "🔴 Débil";
  if (strength < 60) return "🟡 Media";
  if (strength < 80) return "🔵 Fuerte";
  return "🟢 Muy fuerte";
};

export const ChangePasswordDialog = ({
  open,
  onOpenChange,
  userEmail,
}: ChangePasswordDialogProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "La contraseña actual es requerida";
    }

    if (!newPassword) {
      newErrors.newPassword = "La nueva contraseña es requerida";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = "Debe contener al menos una mayúscula";
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = "Debe contener al menos una minúscula";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Debe contener al menos un número";
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = "La nueva contraseña debe ser diferente a la actual";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar la nueva contraseña";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setErrors({ currentPassword: "Contraseña actual incorrecta" });
        setLoading(false);
        return;
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Password updated successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Error changing password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y elige una nueva contraseña segura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangePassword} className="space-y-5">
          {/* Contraseña Actual */}
          <div className="space-y-2">
            <Label htmlFor="current">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="current"
                type={showPasswords.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={errors.currentPassword ? "border-destructive" : ""}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          <Separator />

          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="new">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="new"
                type={showPasswords.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={errors.newPassword ? "border-destructive" : ""}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Barra de fortaleza */}
            {newPassword && (
              <div className="space-y-1">
                <Progress value={calculatePasswordStrength(newPassword)} />
                <p className="text-xs text-muted-foreground">
                  {getPasswordStrengthLabel(newPassword)}
                </p>
              </div>
            )}

            {/* Requisitos */}
            <div className="space-y-1">
              <PasswordRequirement
                met={newPassword.length >= 8}
                text="Al menos 8 caracteres"
              />
              <PasswordRequirement
                met={/[A-Z]/.test(newPassword)}
                text="Una letra mayúscula"
              />
              <PasswordRequirement
                met={/[a-z]/.test(newPassword)}
                text="Una letra minúscula"
              />
              <PasswordRequirement
                met={/[0-9]/.test(newPassword)}
                text="Un número"
              />
            </div>

            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showPasswords.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={errors.confirmPassword ? "border-destructive" : ""}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Indicador de coincidencia */}
            {confirmPassword && (
              <div className="flex items-center gap-2">
                {newPassword === confirmPassword ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500">
                      Las contraseñas coinciden
                    </span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-xs text-destructive">
                      Las contraseñas no coinciden
                    </span>
                  </>
                )}
              </div>
            )}

            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
