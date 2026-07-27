"use client";

import { colors } from "@/lib/theme";
import { structureImageUrl } from "@/lib/molecules";
import { useResolvedName } from "@/hooks/useResolvedName";
import type { MoleculeResult, RadarRange } from "@/types/prediction";
import { ArrowLeftIcon } from "../icons";
import { RadarChart } from "./RadarChart";

interface DetailPanelProps {
  molecule: MoleculeResult | null;
  radarAxes: string[];
  radarRanges: Record<string, RadarRange>;
  isClosing: boolean;
  onClose: () => void;
  onOpenImage: () => void;
  onOpenRadar: () => void;
}

const AXIS_MIN = -8;
const AXIS_MAX = 2;
const AXIS_SPAN = AXIS_MAX - AXIS_MIN;
const TICKS = [-8, -6, -4, -2, 0, 2];

function clamp(x: number) {
  return Math.max(0, Math.min(100, x));
}

function axisPct(value: number) {
  return clamp(((value - AXIS_MIN) / AXIS_SPAN) * 100);
}

export function DetailPanel({ molecule, radarAxes, radarRanges, isClosing, onClose, onOpenImage, onOpenRadar }: DetailPanelProps) {
  const displayName = useResolvedName(molecule?.smiles ?? "", molecule?.name ?? "");

  if (!molecule) return null;

  const markLeft = axisPct(molecule.logS);
  const bandLeft = axisPct(molecule.lowerBound);
  const bandRight = axisPct(molecule.upperBound);

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
        animation: isClosing ? "detailOut .22s ease forwards" : "detailIn .3s cubic-bezier(.22,.61,.36,1)",
      }}
    >
      <div
        onClick={onClose}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 18, width: "fit-content" }}
      >
        <ArrowLeftIcon />
        <span style={{ fontSize: 16, color: colors.tabIdleText }}>Voltar</span>
      </div>

      <div style={{ display: "flex", gap: 16, animation: "infoUp .4s ease .05s both" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              position: "relative",
              height: 220,
              background: colors.white,
              borderRadius: "10px 10px 0 0",
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
              height: 52,
              boxSizing: "border-box",
              background: colors.detailFooterBg,
              borderRadius: "0 0 10px 10px",
              padding: "8px 14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
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
                fontFamily: "monospace",
                fontSize: 11,
                color: "#7a7a7a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {molecule.smiles}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              position: "relative",
              height: 220,
              borderRadius: "10px 10px 0 0",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundColor: colors.white,
            }}
          >
            <RadarChart descriptors={molecule.descriptors} axes={radarAxes} ranges={radarRanges} />
            <ExpandButton onClick={onOpenRadar} />
          </div>
          <div
            style={{
              height: 52,
              boxSizing: "border-box",
              background: colors.detailFooterBg,
              borderTop: "1px solid #c2c2c2",
              borderRadius: "0 0 10px 10px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
              fontSize: 14,
              color: colors.tabIdleText,
            }}
          >
            Physical Chemical properties
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          animation: "infoUp .4s ease .12s both",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16, color: colors.tabIdleText }}>Solubilidade aquosa</span>
        <div style={{ background: colors.buttonSecondary, borderRadius: 8, padding: "8px 16px", fontSize: 14, color: colors.tabIdleText }}>
          {molecule.predictedClassLabel}
        </div>
      </div>
      <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontWeight: 800, fontSize: 84, color: "#1a1a1a", lineHeight: 1 }}>{molecule.logS.toFixed(2)}</span>
        <span style={{ fontWeight: 400, fontSize: 34, color: "#2a2a2a" }}>± {molecule.margin.toFixed(2)} logS</span>
      </div>

      <div style={{ marginTop: 30 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: colors.tabIdleText }}>Quantificação de incerteza</span>
          <span style={{ fontSize: 13, color: colors.emptySubtitle }}>Margem cromatizada ao risco</span>
        </div>
        <div style={{ position: "relative", marginTop: 54, height: 26 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 12, height: 2, background: colors.detailUncertaintyLine }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              height: 26,
              borderRadius: 8,
              background: colors.detailBandBg,
              border: `1px solid ${colors.detailBandBorder}`,
              left: `${bandLeft}%`,
              width: `${bandRight - bandLeft}%`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -8,
              height: 42,
              width: 2,
              background: colors.detailMarker,
              borderRadius: 2,
              left: `${markLeft}%`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 34,
              left: `${markLeft}%`,
              transform: "translateX(-50%)",
              fontSize: 13,
              color: colors.detailMarker,
              whiteSpace: "nowrap",
            }}
          >
            {molecule.logS.toFixed(2)} logS
          </div>
        </div>
        <div style={{ position: "relative", marginTop: 14, height: 16 }}>
          {TICKS.map((v) => (
            <div
              key={v}
              style={{
                position: "absolute",
                transform: "translateX(-50%)",
                left: `${axisPct(v)}%`,
                fontSize: 12,
                color: colors.emptySubtitle,
              }}
            >
              {v > 0 ? `+${v}` : v}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#a8a8a8" }}>
          <span>← menos solúvel</span>
          <span>mais solúvel →</span>
        </div>
      </div>

      <div style={{ marginTop: 38, animation: "infoUp .4s ease .19s both" }}>
        <span style={{ fontWeight: 700, fontSize: 28, color: "#1a1a1a" }}>Alarmes e riscos</span>
        {molecule.alerts.length > 0 ? (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {molecule.alerts.map((alert, i) => (
              <div key={i} style={{ background: colors.alertCardBg, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#2a2a2a", fontSize: 13 }}>◆</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: colors.cardTitle }}>{alert.key}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#565656", lineHeight: 1.4 }}>{alert.val}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 16, fontSize: 15, color: colors.tabIdleText }}>
            Nenhum alerta — molécula dentro do domínio do modelo.
          </div>
        )}
      </div>
    </div>
  );
}

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      title="Ampliar"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.color = "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.85)";
        e.currentTarget.style.color = "#4a4a4a";
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
        color: "#4a4a4a",
        fontSize: 32,
        lineHeight: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      ⤢
    </div>
  );
}
