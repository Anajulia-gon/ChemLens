"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { codGray, colors } from "@/lib/theme";
import type { MoleculeResult, RadarRange } from "@/types/prediction";
import { RadarChart, RadarLegend, type RadarSeriesKey } from "./RadarChart";

interface RadarModalProps {
  molecule: MoleculeResult | null;
  radarAxes: string[];
  radarRanges: Record<string, RadarRange>;
  onClose: () => void;
}

export function RadarModal({ molecule, radarAxes, radarRanges, onClose }: RadarModalProps) {
  const [highlight, setHighlight] = useState<RadarSeriesKey | null>(null);
  const [lastMoleculeId, setLastMoleculeId] = useState<number | null | undefined>(molecule?.id);

  // Reseta o destaque ao trocar de molécula ou fechar/reabrir o modal.
  if (molecule?.id !== lastMoleculeId) {
    setLastMoleculeId(molecule?.id);
    setHighlight(null);
  }

  if (!molecule || typeof document === "undefined") return null;

  const toggleHighlight = (key: RadarSeriesKey) => setHighlight((prev) => (prev === key ? null : key));

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
          <span style={{ fontWeight: 600, fontSize: 18, color: colors.cardTitle }}>Physicochemical properties</span>
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
        <div style={{ paddingLeft: 4, marginBottom: 4 }}>
          <RadarLegend activeKey={highlight} onSelect={toggleHighlight} />
        </div>
        <div style={{ width: "100%", height: 540, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RadarChart descriptors={molecule.descriptors} axes={radarAxes} ranges={radarRanges} highlight={highlight} />
        </div>
      </div>
    </div>,
    document.body
  );
}
