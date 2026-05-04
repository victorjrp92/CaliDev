"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";

interface PhotoPositionAdjusterProps {
  src: string;
  position: string;
  onChange: (position: string) => void;
}

export function PhotoPositionAdjuster({ src, position, onChange }: PhotoPositionAdjusterProps) {
  const [posX, posY] = parsePosition(position);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function parsePosition(pos: string): [number, number] {
    const parts = pos.replace(/%/g, "").split(/\s+/);
    const x = parts[0] === "center" ? 50 : parseFloat(parts[0]) || 50;
    const y = parts.length > 1 ? parseFloat(parts[1]) : 50;
    return [x, y];
  }

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      onChange(`${Math.round(x)}% ${Math.round(y)}%`);
    },
    [onChange]
  );

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    handleMove(e.clientX, e.clientY);

    const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function handleTouchStart(e: React.TouchEvent) {
    setDragging(true);
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      handleMove(ev.touches[0].clientX, ev.touches[0].clientY);
    };
    const onTouchEnd = () => {
      setDragging(false);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }

  return (
    <div className="space-y-3">
      <Label>Position (drag to adjust)</Label>
      <div className="flex items-start gap-6">
        {/* Draggable area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`relative h-48 w-48 overflow-hidden rounded-xl border-2 ${
            dragging ? "border-primary" : "border-border"
          } cursor-crosshair`}
        >
          <Image
            src={src}
            alt="Position preview"
            fill
            className="object-cover pointer-events-none"
            style={{ objectPosition: `${posX}% ${posY}%` }}
            sizes="192px"
          />
          {/* Crosshair indicator */}
          <div
            className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              background: "rgba(10, 60, 48, 0.6)",
            }}
          />
        </div>

        {/* Circle preview */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Preview</p>
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border shadow-md">
            <Image
              src={src}
              alt="Circle preview"
              fill
              className="object-cover pointer-events-none"
              style={{ objectPosition: `${posX}% ${posY}%` }}
              sizes="96px"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">{Math.round(posX)}% {Math.round(posY)}%</p>
        </div>
      </div>

      {/* Sliders as fallback */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Horizontal</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={posX}
            onChange={(e) => onChange(`${e.target.value}% ${posY}%`)}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Vertical</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={posY}
            onChange={(e) => onChange(`${posX}% ${e.target.value}%`)}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
