"use client";

import { colors } from "@/lib/theme";
import { UploadCloudIcon } from "../icons";

interface FileLoadingModalProps {
  isOpen: boolean;
  fileName: string;
  progress: number;
}

export function FileLoadingModal({ isOpen, fileName, progress }: FileLoadingModalProps) {
  if (!isOpen) return null;

  const progressStr = `${Math.min(100, Math.round(progress))}%`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.modalOverlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 440,
          background: colors.modalBg,
          borderRadius: 20,
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          boxShadow: `0 24px 70px ${colors.modalShadow}`,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: colors.modalIconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UploadCloudIcon size={34} color={colors.white} strokeWidth={1.6} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 24, color: colors.ink }}>Carregando arquivo</span>
        <span style={{ fontWeight: 400, fontSize: 14, color: colors.emptySubtitle, textAlign: "center" }}>
          {fileName}
        </span>
        <div style={{ width: "100%", height: 8, borderRadius: 5, background: colors.progressTrack, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              background: colors.ink,
              borderRadius: 5,
              transition: "width .2s ease",
              width: progressStr,
            }}
          />
        </div>
        <span style={{ fontWeight: 500, fontSize: 13, color: colors.tabIdleText }}>{progressStr}</span>
      </div>
    </div>
  );
}
