"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { codGray, colors } from "@/lib/theme";

interface InfoIconProps {
  text: string;
}

const TOOLTIP_WIDTH = 220;

/** Small "i" icon that shows a tooltip with `text` on hover. Used next to
 * table values (MW, LogP, LogS) to explain what each metric means.
 *
 * The tooltip is rendered through a portal into `document.body` and
 * positioned with `position: fixed` from the icon's bounding rect, instead
 * of being absolutely positioned inside the table. This keeps it from being
 * clipped by (or forcing a horizontal scrollbar on) the table's scrollable
 * row container, which computes `overflow-x: auto` as soon as
 * `overflow-y: auto` is set. */
export function InfoIcon({ text }: InfoIconProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = iconRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.top - 6, left: rect.left + rect.width / 2 });
  };
  const hide = () => setPos(null);

  return (
    <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <span
        ref={iconRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: codGray[400],
          color: colors.white,
          fontSize: 9,
          fontWeight: 700,
          fontStyle: "italic",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "help",
          userSelect: "none",
        }}
      >
        i
      </span>
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              width: TOOLTIP_WIDTH,
              background: colors.ink,
              color: colors.white,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1.4,
              padding: "8px 10px",
              borderRadius: 8,
              zIndex: 3000,
              boxShadow: "0 6px 16px rgba(0,0,0,.28)",
              whiteSpace: "normal",
              pointerEvents: "none",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </span>
  );
}
