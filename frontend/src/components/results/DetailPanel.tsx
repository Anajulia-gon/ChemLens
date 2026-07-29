"use client";

import { codGray, colors } from "@/lib/theme";
import { structureImageUrl } from "@/lib/molecules";
import { useResolvedName } from "@/hooks/useResolvedName";
import { classTagColor } from "@/lib/solubility";
import type { MoleculeResult, RadarRange } from "@/types/prediction";
import { InfoIcon } from "../InfoIcon";
import { RadarChart, RadarLegend } from "./RadarChart";
import { UncertaintyChart } from "./UncertaintyChart";

interface DetailPanelProps {
  molecule: MoleculeResult | null;
  radarAxes: string[];
  radarRanges: Record<string, RadarRange>;
  onOpenImage: () => void;
  onOpenRadar: () => void;
}

interface DescriptorRow {
  key: string;
  label: string;
  info: string;
  integer?: boolean;
}

// Mesmo conjunto e ordem dos eixos do radar (ver backend/domain.py RADAR_AXES),
// com o texto exato de cada popover "i" conforme especificado.
const DESCRIPTOR_ROWS: DescriptorRow[] = [
  { key: "MolWt", label: "MW", info: "Molecular weight of the compound. Optimal: 100~500" },
  { key: "nRig", label: "nRig", info: "Number of rigid bonds in the molecule. Optimal: 0~30", integer: true },
  { key: "fChar", label: "FCharge", info: "Total formal charge of the molecule. Optimal: -2~2", integer: true },
  { key: "NumHeteroatoms", label: "nHet", info: "Number of heteroatoms (non-carbon, non-hydrogen atoms). Optimal: 1~15", integer: true },
  { key: "MaxRing", label: "MaxRing", info: "Number of atoms in the biggest ring. Optimal: 0~18", integer: true },
  { key: "RingCount", label: "nRing", info: "Total number of rings in the molecule. Optimal: 0~6", integer: true },
  { key: "NumRotatableBonds", label: "nRot", info: "Number of rotatable bonds. Optimal: 0~10", integer: true },
  { key: "TPSA", label: "TPSA", info: "Topological polar surface area. Optimal: 0~140" },
  { key: "NHOHCount", label: "nHD", info: "Number of hydrogen bond donors (NH and OH groups). Optimal: 0~5", integer: true },
  { key: "nHA", label: "nHA", info: "Number of hydrogen bond acceptors. Optimal: 0~12", integer: true },
  { key: "MolLogP", label: "LogP", info: "Octanol-water partition coefficient (lipophilicity). Optimal: 0~5" },
  {
    key: "logS",
    label: "LogS",
    info: "Base-10 logarithm machine learning estimation of aqueous solubility with calculated confidence interval. See documentation for more details",
  },
];

export function DetailPanel({ molecule, radarAxes, radarRanges, onOpenImage, onOpenRadar }: DetailPanelProps) {
  const displayName = useResolvedName(molecule?.smiles ?? "", molecule?.name ?? "");

  if (!molecule) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 1006,
        top: 40,
        width: 874,
        height: 1000,
        background: colors.detailPanelBg,
        borderRadius: 16,
        boxShadow: "-8px 0 40px rgba(0,0,0,.12)",
        padding: "24px 26px 34px",
        overflowY: "auto",
        zIndex: 40,
        willChange: "transform, opacity",
        animation: "detailIn .3s cubic-bezier(.22,.61,.36,1)",
      }}
    >
      <div style={{ marginBottom: 20, animation: "infoUp .4s ease 0s both" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 22,
            color: colors.cardTitle,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "monospace",
            fontSize: 13,
            color: codGray[500],
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {molecule.smiles}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, animation: "infoUp .4s ease .05s both" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              position: "relative",
              height: 168,
              background: colors.white,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={structureImageUrl(molecule.smiles)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 14, boxSizing: "border-box" }}
            />
            <ExpandButton onClick={onOpenImage} />
          </div>

          <div
            style={{
              position: "relative",
              height: 432,
              borderRadius: 10,
              padding: "10px 6px 6px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: colors.white,
            }}
          >
            <div style={{ paddingLeft: 6 }}>
              <RadarLegend />
            </div>
            <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
              <RadarChart descriptors={molecule.descriptors} axes={radarAxes} ranges={radarRanges} />
            </div>
            <ExpandButton onClick={onOpenRadar} />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: colors.white,
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: colors.tableHeaderBg,
              fontWeight: 600,
              fontSize: 14,
              color: codGray[800],
              flexShrink: 0,
            }}
          >
            Physicochemical properties
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {DESCRIPTOR_ROWS.map((row) => {
              const value = molecule.descriptors[row.key];
              const formatted = row.integer ? Math.round(value).toString() : value.toFixed(2);
              return (
                <div
                  key={row.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flex: 1,
                    minHeight: 32,
                    padding: "0 16px",
                    borderBottom: `1px solid ${colors.tableDividerRow}`,
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: colors.tabIdleText, fontWeight: 500 }}>{row.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: codGray[800], fontWeight: 600 }}>{formatted}</span>
                    <InfoIcon text={row.info} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          background: colors.white,
          borderRadius: 10,
          overflow: "hidden",
          animation: "infoUp .4s ease .12s both",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            background: colors.tableHeaderBg,
            fontWeight: 600,
            fontSize: 14,
            color: codGray[800],
          }}
        >
          LogS
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 83, color: classTagColor(molecule.classTag), lineHeight: 1 }}>
                {molecule.logS.toFixed(2)}
              </span>
              <span style={{ fontWeight: 400, fontSize: 34, color: classTagColor(molecule.classTag) }}>
                ± {molecule.margin.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.emptySubtitle,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Class Range
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.white,
                  background: classTagColor(molecule.classTag),
                  padding: "4px 11px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {molecule.classTag}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <UncertaintyChart logS={molecule.logS} lowerBound={molecule.lowerBound} upperBound={molecule.upperBound} />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          background: colors.white,
          borderRadius: 10,
          padding: "20px 24px 24px",
          animation: "infoUp .4s ease .16s both",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: colors.buttonSecondary,
            color: colors.tabIdleText,
            fontWeight: 700,
            fontSize: 14,
            padding: "8px 18px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {molecule.alertName}
        </span>
        <div style={{ marginTop: 10, fontSize: 14, color: codGray[700], lineHeight: 1.5 }}>{molecule.alertDescription}</div>
      </div>
    </div>
  );
}

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      title="Expand"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.white;
        e.currentTarget.style.color = codGray[900];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.85)";
        e.currentTarget.style.color = codGray[600];
      }}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 8,
        background: "rgba(255,255,255,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: codGray[600],
        fontSize: 34,
        lineHeight: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      ⤢
    </div>
  );
}
