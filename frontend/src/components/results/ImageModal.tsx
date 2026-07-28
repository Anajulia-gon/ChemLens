"use client";

import { createPortal } from "react-dom";
import { codGray, colors } from "@/lib/theme";
import { structureImageUrl } from "@/lib/molecules";
import { useResolvedName } from "@/hooks/useResolvedName";
import type { MoleculeResult } from "@/types/prediction";

interface ImageModalProps {
  molecule: MoleculeResult | null;
  onClose: () => void;
}

export function ImageModal({ molecule, onClose }: ImageModalProps) {
  const displayName = useResolvedName(molecule?.smiles ?? "", molecule?.name ?? "");

  if (!molecule || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
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
          width: 640,
          maxWidth: "88vw",
          background: colors.modalBg,
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 18,
              color: colors.cardTitle,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>
          <div
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = codGray[200];
              e.currentTarget.style.color = codGray[900];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = codGray[500];
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: codGray[500],
              fontSize: 22,
            }}
          >
            ×
          </div>
        </div>
        <div style={{ width: "100%", height: 560, background: colors.white, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={structureImageUrl(molecule.smiles)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 24, boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
