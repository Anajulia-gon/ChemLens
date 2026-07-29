"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { codGray, colors } from "@/lib/theme";
import { useResolvedNames } from "@/hooks/useResolvedName";
import { queueNameResolution } from "@/lib/nameResolver";
import { deleteMolecules } from "@/lib/api";
import { InfoIcon } from "../InfoIcon";
import type { MoleculeResult, PredictionResponse, RadarRange, ReliabilityStatus } from "@/types/prediction";
import { ArrowRightIcon, CheckIcon, FilterIcon, SearchIcon } from "../icons";
import { DetailPanel } from "./DetailPanel";
import { ImageModal } from "./ImageModal";
import { RadarModal } from "./RadarModal";

interface ResultsDashboardProps {
  studyId: number;
  results: MoleculeResult[];
  radarAxes: string[];
  radarRanges: Record<string, RadarRange>;
  onMoleculesDeleted: (updated: PredictionResponse) => void;
  onError: (message: string) => void;
}

const STATUS_LIST: ReliabilityStatus[] = ["Risk Alert", "Review Suggested", "High Confidence"];
const STATUS_COLORS: Record<ReliabilityStatus, string> = {
  "Risk Alert": colors.statusRiskAlert,
  "Review Suggested": colors.statusReviewSuggested,
  "High Confidence": colors.statusHighConfidence,
};

const INFO_TEXT = {
  MW: "Molecular weight of the compound. Optimal: 100~500",
  LogP: "Octanol-water partition coefficient (lipophilicity). Optimal: 0~5",
  LogS: "Base-10 logarithm machine learning estimation of aqueous solubility with calculated confidence interval. See documentation for more details",
};

function Checkbox({ checked, onClick }: { checked: boolean; onClick: (e: MouseEvent) => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 19,
        height: 19,
        borderRadius: 5,
        border: `1.5px solid ${checked ? colors.ink : codGray[400]}`,
        background: checked ? colors.ink : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && <CheckIcon />}
    </div>
  );
}

export function ResultsDashboard({ studyId, results, radarAxes, radarRanges, onMoleculesDeleted, onError }: ResultsDashboardProps) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({});
  const [regMin, setRegMin] = useState("");
  const [regMax, setRegMax] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [detailId, setDetailId] = useState<number | null>(results[0]?.id ?? null);
  const [imgOpen, setImgOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [lastStudyId, setLastStudyId] = useState(studyId);

  // Ao abrir um estudo diferente (troca de studyId), volta a mostrar os
  // detalhes da primeira molécula por padrão.
  if (studyId !== lastStudyId) {
    setLastStudyId(studyId);
    setDetailId(results[0]?.id ?? null);
  }

  const resolvedNames = useResolvedNames();

  // Nome final sempre vem da API — reabrir um estudo enfileira a resolução
  // de novo aqui também (o cache evita refazer consultas já resolvidas).
  useEffect(() => {
    queueNameResolution(results.map((m) => m.smiles));
  }, [results]);

  const nameFor = (m: MoleculeResult) => resolvedNames[m.smiles] || m.name;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const anyStatus = STATUS_LIST.some((s) => statusFilter[s]);
    const rmin = parseFloat(regMin);
    const rmax = parseFloat(regMax);
    return results.filter((m) => {
      if (q && !nameFor(m).toLowerCase().includes(q) && !m.smiles.toLowerCase().includes(q)) return false;
      if (anyStatus && !statusFilter[m.status]) return false;
      if (!isNaN(rmin) && m.logS < rmin) return false;
      if (!isNaN(rmax) && m.logS > rmax) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, search, statusFilter, regMin, regMax, resolvedNames]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const allOn = filtered.length > 0 && filtered.every((m) => selected[m.id]);

  const detailMolecule = detailId != null ? results.find((m) => m.id === detailId) ?? null : null;

  const toggleSelect = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleAll = () => {
    const on = filtered.length > 0 && filtered.every((m) => selected[m.id]);
    const next = { ...selected };
    filtered.forEach((m) => {
      if (on) delete next[m.id];
      else next[m.id] = true;
    });
    setSelected(next);
  };
  const toggleStatusFilter = (s: string) => setStatusFilter((prev) => ({ ...prev, [s]: !prev[s] }));
  const clearFilters = () => {
    setStatusFilter({});
    setRegMin("");
    setRegMax("");
  };

  const openDetail = (id: number) => {
    setDetailId(id);
  };

  const handleDeleteSelected = async () => {
    const ids = Object.keys(selected)
      .filter((k) => selected[Number(k)])
      .map(Number);
    if (!ids.length) return;
    try {
      const updated = await deleteMolecules(studyId, ids);
      onMoleculesDeleted(updated);
      setSelected({});
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete the selected molecules.");
    }
  };

  return (
    <div style={{ animation: "resultsIn .5s cubic-bezier(.22,.61,.36,1) .18s both" }}>
      <div style={{ position: "absolute", left: 150, top: 40, width: 828 }}>
        <span style={{ display: "block", fontWeight: 700, fontSize: 22, color: colors.cardTitle }}>
          Molecular Screening Results
        </span>
        <span style={{ display: "block", marginTop: 6, fontSize: 14, color: colors.emptySubtitle, lineHeight: 1.4 }}>
          Review predicted properties and LogS reliability.
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 136,
          width: 690,
          height: 56,
          background: colors.inputField,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 12,
        }}
      >
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a molecule"
          style={{ flex: 1, border: "none", background: "transparent", fontSize: 18, color: colors.cardTitle, height: "100%" }}
        />
      </div>

      <div
        onClick={() => setFilterOpen((v) => !v)}
        style={{
          position: "absolute",
          left: 858,
          top: 136,
          width: 120,
          height: 56,
          background: codGray[300],
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <FilterIcon />
        <span style={{ fontWeight: 500, fontSize: 18, color: colors.tabIdleText }}>Filter</span>
      </div>

      {filterOpen && (
        <div
          style={{
            position: "absolute",
            left: 730,
            top: 204,
            width: 300,
            background: colors.white,
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.18)",
            padding: 20,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: colors.ink, display: "block", marginBottom: 10 }}>Status</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {STATUS_LIST.map((s) => (
                <div key={s} onClick={() => toggleStatusFilter(s)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <Checkbox checked={!!statusFilter[s]} onClick={() => toggleStatusFilter(s)} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: STATUS_COLORS[s] }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: colors.ink, display: "block", marginBottom: 10 }}>Regression (LogS)</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={regMin}
                onChange={(e) => setRegMin(e.target.value)}
                placeholder="min"
                style={{ width: "100%", height: 36, border: `1px solid ${codGray[300]}`, borderRadius: 8, padding: "0 10px", fontSize: 14, color: colors.cardTitle }}
              />
              <span style={{ color: colors.emptySubtitle }}>–</span>
              <input
                value={regMax}
                onChange={(e) => setRegMax(e.target.value)}
                placeholder="max"
                style={{ width: "100%", height: 36, border: `1px solid ${codGray[300]}`, borderRadius: 8, padding: "0 10px", fontSize: 14, color: colors.cardTitle }}
              />
            </div>
          </div>
          <div onClick={clearFilters} style={{ alignSelf: "flex-start", fontSize: 14, color: codGray[500], cursor: "pointer", textDecoration: "underline" }}>
            Clear filters
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 225,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: colors.ink }}>
          Select a molecule below to explore its full details
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 256,
          width: 828,
          height: 52,
          background: colors.tableHeaderBg,
          borderRadius: "10px 10px 0 0",
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          fontSize: 14,
          color: codGray[800],
          paddingLeft: 6,
        }}
      >
        <div style={{ width: 48, display: "flex", justifyContent: "center" }}>
          <Checkbox checked={allOn} onClick={toggleAll} />
        </div>
        <div style={{ width: 150 }}>Molecule Name</div>
        <div style={{ width: 230 }}>Smiles</div>
        <div style={{ width: 130 }}>Molecular Weight</div>
        <div style={{ width: 110 }}>LogP</div>
        <div style={{ flex: 1 }}>LogS</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 308,
          width: 828,
          height: 712,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            overflowX: "hidden",
            background: colors.white,
            border: `1px solid ${colors.tableBorder}`,
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
          }}
        >
          {filtered.map((m) => {
            const isActive = m.id === detailId;
            const baseBg = isActive ? colors.tableRowActive : colors.white;
            return (
            <div
              key={m.id}
              onClick={() => openDetail(m.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.tableRowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = baseBg)}
              style={{
                display: "flex",
                alignItems: "center",
                height: 46,
                borderBottom: `1px solid ${colors.tableDividerRow}`,
                fontSize: 14,
                paddingLeft: 6,
                background: baseBg,
                transition: "background .12s",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 48, display: "flex", justifyContent: "center" }}>
                <Checkbox
                  checked={!!selected[m.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(m.id);
                  }}
                />
              </div>
              <div style={{ width: 150, color: codGray[800], fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 10 }}>
                {nameFor(m)}
              </div>
              <div style={{ width: 230, fontFamily: "monospace", fontSize: 12, color: codGray[500], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 12 }}>
                {m.smiles}
              </div>
              <div style={{ width: 130, display: "flex", alignItems: "center", color: codGray[800] }}>
                <span style={{ width: 56 }}>{m.descriptors.MolWt.toFixed(2)}</span>
                <InfoIcon text={INFO_TEXT.MW} />
              </div>
              <div style={{ width: 110, display: "flex", alignItems: "center", color: codGray[800] }}>
                <span style={{ width: 46 }}>{m.descriptors.MolLogP.toFixed(2)}</span>
                <InfoIcon text={INFO_TEXT.LogP} />
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "baseline", color: codGray[800], paddingRight: 12 }}>
                <span style={{ width: 96 }}>
                  {m.logS.toFixed(2)}{" "}
                  <span style={{ fontSize: 12, color: codGray[500] }}>± {m.margin.toFixed(2)}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <InfoIcon text={INFO_TEXT.LogS} />
                </span>
              </div>
            </div>
            );
          })}
        </div>

        {selectedCount > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 20,
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              background: codGray[900],
              borderRadius: 999,
              boxShadow: "0 10px 28px rgba(0,0,0,.35)",
              overflow: "hidden",
              zIndex: 60,
            }}
          >
            <span style={{ padding: "14px 22px", fontSize: 14, fontWeight: 500, color: colors.white, whiteSpace: "nowrap" }}>
              {selectedCount} Selected
            </span>
            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.18)" }} />
            <div
              onClick={handleDeleteSelected}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              style={{
                padding: "14px 22px",
                fontSize: 14,
                fontWeight: 500,
                color: colors.statusRiskAlert,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Delete
            </div>
          </div>
        )}
      </div>

      <DetailPanel
        molecule={detailMolecule}
        radarAxes={radarAxes}
        radarRanges={radarRanges}
        onOpenImage={() => setImgOpen(true)}
        onOpenRadar={() => setRadarOpen(true)}
      />
      <ImageModal molecule={imgOpen ? detailMolecule : null} onClose={() => setImgOpen(false)} />
      <RadarModal molecule={radarOpen ? detailMolecule : null} radarAxes={radarAxes} radarRanges={radarRanges} onClose={() => setRadarOpen(false)} />
    </div>
  );
}
