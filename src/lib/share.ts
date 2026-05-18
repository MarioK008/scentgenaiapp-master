import { toast } from "sonner";

export async function copyLink(url: string, successMessage = "Link copied!") {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      // Fallback for non-secure contexts / older browsers / iframes
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) throw new Error("execCommand failed");
    }
    toast.success(successMessage);
    return true;
  } catch (err) {
    console.error("Copy failed", err);
    toast.error("Could not copy link", { description: url });
    return false;
  }
}
