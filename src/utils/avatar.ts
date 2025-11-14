/**
 * Generate initials from a name
 */
export const generateInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generate a consistent background color based on name
 */
export const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

/**
 * Validate image file for avatar upload
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    return { valid: false, error: "Image must be less than 2MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG and WEBP are allowed" };
  }

  return { valid: true };
};
