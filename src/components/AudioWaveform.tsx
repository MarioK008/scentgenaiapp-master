import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  analyser: AnalyserNode | null;
  active: boolean;
  bars?: number;
}

const AudioWaveform = ({ analyser, active, bars = 7 }: AudioWaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !analyser) {
      // Reset bars
      if (containerRef.current) {
        containerRef.current.querySelectorAll<HTMLSpanElement>("span[data-bar]").forEach((el) => {
          el.style.height = "8px";
        });
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const els = containerRef.current?.querySelectorAll<HTMLSpanElement>("span[data-bar]");
      if (els) {
        const step = Math.floor(data.length / bars);
        els.forEach((el, i) => {
          // sample evenly across the spectrum, skipping highest empty bins
          const sample = data[i * step] || 0;
          const pct = sample / 255;
          const h = 8 + pct * 40; // 8px to 48px
          el.style.height = `${h}px`;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active, bars]);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center gap-1.5 h-14"
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          data-bar
          className="block w-1.5 rounded-full bg-primary transition-[height] duration-75 ease-out"
          style={{ height: "8px" }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
