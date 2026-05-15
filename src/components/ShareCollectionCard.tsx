import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Share2, Download } from "lucide-react";
import { toast } from "sonner";

interface TopPerfume {
  id: string;
  name: string;
  brand?: string | null;
  image_url?: string | null;
}

interface ShareCollectionCardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  avatarUrl?: string | null;
}

export const ShareCollectionCard = ({
  isOpen,
  onClose,
  userId,
  username,
  avatarUrl,
}: ShareCollectionCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [perfumes, setPerfumes] = useState<TopPerfume[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: cols } = await supabase
          .from("user_collections")
          .select("perfume_id, rating, added_at")
          .eq("user_id", userId)
          .eq("status", "owned")
          .order("rating", { ascending: false, nullsFirst: false })
          .order("added_at", { ascending: false })
          .limit(6);

        const ids = (cols ?? []).map((c: any) => c.perfume_id);
        if (ids.length === 0) {
          setPerfumes([]);
          return;
        }
        const { data: ps } = await supabase
          .from("perfumes")
          .select("id, name, image_url, brand:brands(name)")
          .in("id", ids);

        const byId: Record<string, TopPerfume> = {};
        (ps ?? []).forEach((p: any) => {
          byId[p.id] = {
            id: p.id,
            name: p.name,
            image_url: p.image_url,
            brand: Array.isArray(p.brand) ? p.brand[0]?.name : p.brand?.name,
          };
        });
        setPerfumes(ids.map((id) => byId[id]).filter(Boolean));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, userId]);

  const generate = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0E2A47",
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await generate();
      if (!blob) return;
      const file = new File([blob], `${username}-collection.png`, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        // @ts-ignore
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `${username}'s ScentGenAI collection`,
          text: "My top fragrances on ScentGenAI",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${username}-collection.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Image downloaded");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error("Could not share image");
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share my collection</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-auto rounded-lg">
              <div
                ref={cardRef}
                style={{
                  width: 540,
                  padding: 32,
                  background: "linear-gradient(135deg, #0E2A47 0%, #1C3B63 100%)",
                  color: "#fff",
                  fontFamily: "Playfair Display, serif",
                  borderRadius: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      crossOrigin="anonymous"
                      alt=""
                      style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #F7B731" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: "#FF2E92", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff",
                        border: "2px solid #F7B731",
                      }}
                    >
                      {username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>@{username}</div>
                    <div style={{ fontSize: 13, color: "#B0C4DE", letterSpacing: 1 }}>
                      MY TOP FRAGRANCES
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                  }}
                >
                  {perfumes.length === 0 ? (
                    <div style={{ gridColumn: "span 3", color: "#B0C4DE", textAlign: "center", padding: 24 }}>
                      No perfumes in your collection yet
                    </div>
                  ) : (
                    perfumes.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 12,
                          padding: 8,
                          border: "1px solid rgba(247,183,49,0.25)",
                        }}
                      >
                        <div
                          style={{
                            width: "100%", aspectRatio: "1",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 8, overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              crossOrigin="anonymous"
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: 36 }}>🌸</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, lineHeight: 1.2 }}>
                          {p.name}
                        </div>
                        {p.brand && (
                          <div style={{ fontSize: 10, color: "#B0C4DE", marginTop: 2 }}>
                            {p.brand}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    color: "#F7B731",
                    letterSpacing: 1.5,
                  }}
                >
                  <span>SCENTGENAI</span>
                  <span style={{ fontStyle: "italic", color: "#B0C4DE" }}>
                    Discover. Organize. Understand.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="hero" onClick={handleShare} disabled={generating || perfumes.length === 0}>
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : typeof navigator !== "undefined" && (navigator as any).share ? (
                  <Share2 className="h-4 w-4 mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {typeof navigator !== "undefined" && (navigator as any).share ? "Share" : "Download"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
