"use client";

import { codGray, colors } from "@/lib/theme";
import type { Study } from "@/hooks/useHistory";
import { TrashIcon } from "../icons";

interface ConfirmDeleteModalProps {
  study: Study | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ study, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  if (!study) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(38, 38, 38, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          background: colors.modalBg,
          borderRadius: 20,
          padding: "36px 34px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.32)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#f3e2e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrashIcon size={30} strokeWidth={1.7} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 22, color: colors.ink, textAlign: "center" }}>
          Delete Study {study.num}?
        </span>
        <span
          style={{
            fontWeight: 400,
            fontSize: 14,
            color: colors.emptySubtitle,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          This action cannot be undone. The study will be permanently removed from the history.
        </span>
        <div style={{ display: "flex", gap: 12, width: "100%", marginTop: 4 }}>
          <div
            onClick={onCancel}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.buttonSecondaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = codGray[200])}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 12,
              background: codGray[200],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background .15s",
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 14, color: colors.tabIdleText }}>Cancel</span>
          </div>
          <div
            onClick={onConfirm}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 12,
              background: colors.historyDeleteStroke,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "opacity .15s",
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 14, color: colors.white }}>Delete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
