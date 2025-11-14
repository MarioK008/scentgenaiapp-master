import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateInitials, getAvatarColor } from "@/utils/avatar";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onUpload?: (file: File) => void;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-32 w-32",
};

export const UserAvatar = ({
  avatarUrl,
  username = "",
  size = "md",
  editable = false,
  onUpload,
  className,
}: UserAvatarProps) => {
  const initials = generateInitials(username);
  const bgColor = getAvatarColor(username);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <Avatar className={cn(sizeClasses[size], "transition-all")}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={username} />
        ) : (
          <AvatarFallback className={cn(bgColor, "text-white font-semibold")}>
            {initials}
          </AvatarFallback>
        )}
      </Avatar>

      {editable && (
        <label
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-black/50 rounded-full opacity-0 group-hover:opacity-100",
            "transition-opacity cursor-pointer"
          )}
        >
          <Camera className="h-6 w-6 text-white" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};
