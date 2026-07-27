"use client";

import { colors } from "@/lib/theme";
import { structureImageUrl } from "@/lib/molecules";
import { useResolvedName } from "@/hooks/useResolvedName";
import type { MoleculeResult } from "@/types/prediction";

interface ImageModalProps {
  molecule: MoleculeResult | null;
  onClose: () => void;
}

export function ImageModal({ molecule, onClose }: ImageModalProps) {
  const displayName = useResolvedName(molecule?.smiles ?? "", molecule?.name ?? "");

  if (!molecule) return null;

  return (
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
              e.currentTarget.style.background = "#ececec";
              e.currentTarget.style.color = "#1a1a1a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6a6a6a";
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6a6a6a",
              fontSize: 20,
            }}
          >
            ×
          </div>
        </div>
        <div style={{ width: "100%", height: 560, background: colors.white, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={structureImageUrl(molecule.smiles)} alt="" style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
      </div>
    </div>
  );
}
