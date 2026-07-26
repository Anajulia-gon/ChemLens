"use client";

import { colors } from "@/lib/theme";
import { PencilIcon, DiagonalLineIcon } from "../icons";

interface DesenhoTabProps {
  onComingSoon: () => void;
}

export function DesenhoTab({ onComingSoon }: DesenhoTabProps) {
  return (
    <div>
      <div
        onClick={onComingSoon}
        style={{
          position: "absolute",
          left: 180,
          top: 376,
          width: 626,
          height: 250,
          borderRadius: 16,
          background: colors.dropZoneInner,
          outline: `1.5px dashed ${colors.dropZoneOutline}`,
          outlineOffset: -2,
          cursor: "pointer",
        }}
      />
      <div style={{ position: "absolute", left: 196, top: 392, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={onComingSoon}
          style={{
            width: 38,
            height: 38,
            border: "none",
            borderRadius: 10,
            background: colors.white,
            boxShadow: `0 1px 2px ${colors.toolButtonShadow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <PencilIcon color={colors.toolIconStroke} />
        </button>
        <button
          type="button"
          onClick={onComingSoon}
          style={{
            width: 38,
            height: 38,
            border: "none",
            borderRadius: 10,
            background: colors.white,
            boxShadow: `0 1px 2px ${colors.toolButtonShadow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ width: 15, height: 15, borderRadius: "50%", border: `1.6px solid ${colors.toolIconStroke}` }} />
        </button>
        <button
          type="button"
          onClick={onComingSoon}
          style={{
            width: 38,
            height: 38,
            border: "none",
            borderRadius: 10,
            background: colors.white,
            boxShadow: `0 1px 2px ${colors.toolButtonShadow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <DiagonalLineIcon color={colors.toolIconStroke} />
        </button>
      </div>
      <div
        onClick={onComingSoon}
        onMouseEnter={(e) => (e.currentTarget.style.background = colors.secondarySendHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = colors.secondarySend)}
        style={{
          position: "absolute",
          left: 606,
          top: 646,
          width: 200,
          height: 56,
          borderRadius: 12,
          background: colors.secondarySend,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          transition: "background .15s",
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 16, color: colors.secondarySendText }}>Enviar</span>
      </div>
    </div>
  );
}
