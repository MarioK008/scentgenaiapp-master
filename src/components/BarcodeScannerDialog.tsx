import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Loader2, X } from "lucide-react";

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

const BarcodeScannerDialog = ({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerDialogProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<string>("Initializing camera...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // HTTPS check (allow localhost for dev)
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setError("Camera access requires HTTPS.");
      setStatus("");
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        setStatus("Requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("Scanning...");

        const controls = await reader.decodeFromStream(
          stream,
          videoRef.current!,
          (result, err, ctrls) => {
            if (result) {
              ctrls.stop();
              onDetected(result.getText());
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: any) {
        console.error("Scanner error:", e);
        setError(
          e?.name === "NotAllowedError"
            ? "Camera permission denied."
            : "Unable to access camera."
        );
        setStatus("");
      }
    })();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {}
      controlsRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen, onDetected]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-primary/70" />
        </div>

        <div className="text-center text-sm min-h-5">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            <span className="text-muted-foreground flex items-center justify-center gap-2">
              {status === "Scanning..." && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {status}
            </span>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerDialog;
