"use client";

import { colors } from "@/lib/theme";
import { ClockIcon } from "../icons";

interface ComingSoonModalProps {
  actionLabel: string | null;
  onClose: () => void;
}

export function ComingSoonModal({ actionLabel, onClose }: ComingSoonModalProps) {
  if (!actionLabel) return null;

  return (
    <div
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          background: colors.modalBg,
          borderRadius: 20,
          padding: "48px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow: `0 24px 70px ${colors.modalShadow}`,
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            background: colors.modalIconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ClockIcon size={36} color={colors.white} strokeWidth={1.6} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 28, color: colors.ink }}>Em breve</span>
        <span
          style={{
            fontWeight: 400,
            fontSize: 15,
            color: colors.emptySubtitle,
            textAlign: "center",
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          {`A ação "${actionLabel}" ainda não está disponível. Estamos trabalhando nisso — em breve por aqui.`}
        </span>
        <div
          onClick={onClose}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          style={{
            marginTop: 8,
            height: 48,
            borderRadius: 12,
            background: colors.ink,
            display: "flex",
            padding: "0 36px",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "opacity .15s",
          }}
        >
          <span style={{ fontWeight: 500, fontSize: 16, color: colors.white }}>Voltar</span>
        </div>
      </div>
    </div>
  );
}
