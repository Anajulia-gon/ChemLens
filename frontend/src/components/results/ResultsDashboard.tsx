"use client";

import { useEffect, useMemo, useState } from "react";
import { colors } from "@/lib/theme";
import { useResolvedNames } from "@/hooks/useResolvedName";
import { queueNameResolution } from "@/lib/nameResolver";
import { UNKNOWN_MOLECULE_NAME } from "@/lib/molecules";
import type { MoleculeResult, RadarRange, ReliabilityStatus } from "@/types/prediction";
import { CheckIcon, FilterIcon, SearchIcon } from "../icons";
import { DetailPanel } from "./DetailPanel";
import { ImageModal } from "./ImageModal";
import { RadarModal } from "./RadarModal";

interface ResultsDashboardProps {
  results: MoleculeResult[];
  radarAxes: string[];
  radarRanges: Record<string, RadarRange>;
}

const STATUS_LIST: ReliabilityStatus[] = ["Risk Alert", "Review Suggested", "High Confidence"];
const STATUS_COLORS: Record<ReliabilityStatus, string> = {
  "Risk Alert": colors.statusRiskAlert,
  "Review Suggested": colors.statusReviewSuggested,
  "High Confidence": colors.statusHighConfidence,
};

// Faixa do histograma casada com o eixo do painel de detalhes (-8 a +2 logS).
const BIN_MIN = -8;
const BIN_COUNT = 11;

function binOf(logS: number) {
  let i = Math.floor(logS - BIN_MIN);
  if (i < 0) i = 0;
  if (i > BIN_COUNT - 1) i = BIN_COUNT - 1;
  return i;
}

function Checkbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 19,
        height: 19,
        borderRadius: 5,
        border: `1.5px solid ${checked ? colors.ink : "#b0b0b0"}`,
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

export function ResultsDashboard({ results, radarAxes, radarRanges }: ResultsDashboardProps) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({});
  const [regMin, setRegMin] = useState("");
  const [regMax, setRegMax] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [binFilter, setBinFilter] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);

  const resolvedNames = useResolvedNames();

  // Reabrir um estudo cujas moléculas ainda não tiveram o nome resolvido
  // (ex.: veio de um CSV sem coluna de nome) enfileira a resolução aqui também.
  useEffect(() => {
    const unresolved = results.filter((m) => m.name === UNKNOWN_MOLECULE_NAME).map((m) => m.smiles);
    if (unresolved.length) queueNameResolution(unresolved);
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

  const selectedFiltered = filtered.filter((m) => selected[m.id]);
  const considered = selectedFiltered.length ? selectedFiltered : filtered;

  const orderedFiltered =
    binFilter != null ? [...filtered].sort((a, b) => (selected[b.id] ? 1 : 0) - (selected[a.id] ? 1 : 0)) : filtered;

  const allOn = filtered.length > 0 && filtered.every((m) => selected[m.id]);

  const counts = new Array(BIN_COUNT).fill(0);
  considered.forEach((m) => counts[binOf(m.logS)]++);
  const baseCounts = new Array(BIN_COUNT).fill(0);
  filtered.forEach((m) => baseCounts[binOf(m.logS)]++);
  const maxC = Math.max(...baseCounts, ...counts, 1);
  const yMax = Math.max(5, Math.ceil(maxC / 5) * 5);
  const showGhost = selectedFiltered.length > 0 && selectedFiltered.length < filtered.length;

  const detailMolecule = detailId != null ? results.find((m) => m.id === detailId) ?? null : null;

  const toggleSelect = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setBinFilter(null);
  };
  const toggleAll = () => {
    const on = filtered.length > 0 && filtered.every((m) => selected[m.id]);
    const next = { ...selected };
    filtered.forEach((m) => {
      if (on) delete next[m.id];
      else next[m.id] = true;
    });
    setSelected(next);
    setBinFilter(null);
  };
  const selectBin = (i: number) => {
    if (binFilter === i) {
      setBinFilter(null);
      setSelected({});
      return;
    }
    const next: Record<number, boolean> = {};
    filtered.forEach((m) => {
      if (binOf(m.logS) === i) next[m.id] = true;
    });
    setBinFilter(i);
    setSelected(next);
  };
  const toggleStatusFilter = (s: string) => setStatusFilter((prev) => ({ ...prev, [s]: !prev[s] }));
  const clearFilters = () => {
    setStatusFilter({});
    setRegMin("");
    setRegMax("");
  };

  const openDetail = (id: number) => {
    setDetailClosing(false);
    setDetailId(id);
  };
  const closeDetail = () => {
    setDetailClosing(true);
    setTimeout(() => {
      setDetailId(null);
      setDetailClosing(false);
    }, 240);
  };

  return (
    <div style={{ animation: "resultsIn .5s cubic-bezier(.22,.61,.36,1) .18s both" }}>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 56,
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
          placeholder="Pesquise por molécula"
          style={{ flex: 1, border: "none", background: "transparent", fontSize: 16, color: colors.cardTitle, height: "100%" }}
        />
      </div>

      <div
        onClick={() => setFilterOpen((v) => !v)}
        style={{
          position: "absolute",
          left: 858,
          top: 56,
          width: 120,
          height: 56,
          background: "#d8dadd",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <FilterIcon />
        <span style={{ fontWeight: 500, fontSize: 16, color: colors.tabIdleText }}>Filtro</span>
      </div>

      {filterOpen && (
        <div
          style={{
            position: "absolute",
            left: 730,
            top: 124,
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
                placeholder="mín"
                style={{ width: "100%", height: 36, border: "1px solid #d5d5d5", borderRadius: 8, padding: "0 10px", fontSize: 14, color: colors.cardTitle }}
              />
              <span style={{ color: colors.emptySubtitle }}>–</span>
              <input
                value={regMax}
                onChange={(e) => setRegMax(e.target.value)}
                placeholder="máx"
                style={{ width: "100%", height: 36, border: "1px solid #d5d5d5", borderRadius: 8, padding: "0 10px", fontSize: 14, color: colors.cardTitle }}
              />
            </div>
          </div>
          <div onClick={clearFilters} style={{ alignSelf: "flex-start", fontSize: 13, color: "#6a6a6a", cursor: "pointer", textDecoration: "underline" }}>
            Limpar filtros
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 150,
          width: 828,
          height: 52,
          background: colors.tableHeaderBg,
          borderRadius: "10px 10px 0 0",
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          fontSize: 14,
          color: "#242424",
          paddingLeft: 6,
        }}
      >
        <div style={{ width: 48, display: "flex", justifyContent: "center" }}>
          <Checkbox checked={allOn} onClick={toggleAll} />
        </div>
        <div style={{ width: 150 }}>Nome</div>
        <div style={{ width: 224 }}>SMILES</div>
        <div style={{ width: 158, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>
          Regression pred logS
        </div>
        <div style={{ width: 158 }}>Status Confiability</div>
        <div style={{ flex: 1 }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 202,
          width: 828,
          height: 818,
          overflowY: "auto",
          background: colors.white,
          border: `1px solid ${colors.tableBorder}`,
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
        }}
      >
        {orderedFiltered.map((m, i) => (
          <div
            key={m.id}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.tableRowHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? colors.white : colors.tableRowAlt)}
            style={{
              display: "flex",
              alignItems: "center",
              height: 46,
              borderBottom: `1px solid ${colors.tableDividerRow}`,
              fontSize: 15,
              paddingLeft: 6,
              background: i % 2 === 0 ? colors.white : colors.tableRowAlt,
              transition: "background .12s",
            }}
          >
            <div style={{ width: 48, display: "flex", justifyContent: "center" }}>
              <Checkbox checked={!!selected[m.id]} onClick={() => toggleSelect(m.id)} />
            </div>
            <div style={{ width: 150, color: "#222", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 10 }}>
              {nameFor(m)}
            </div>
            <div style={{ width: 224, fontFamily: "monospace", fontSize: 12.5, color: "#6a6a6a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 12 }}>
              {m.smiles}
            </div>
            <div style={{ width: 158, color: "#222" }}>{m.logS.toFixed(2)}</div>
            <div style={{ width: 158, fontWeight: 600, color: STATUS_COLORS[m.status] }}>{m.status}</div>
            <div
              onClick={() => openDetail(m.id)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4a4a4a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9a9a")}
              style={{ flex: 1, color: "#9a9a9a", cursor: "pointer", transition: "color .15s" }}
            >
              Detalhes
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 1030,
          top: 150,
          width: 820,
          height: 346,
          background: colors.canvas,
          border: "1px solid #ececec",
          borderRadius: 12,
          padding: "22px 26px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 18, color: "#333" }}>SMILES count por LogS_pred(mol/L)</span>
        <div style={{ display: "flex", height: 250, marginTop: 14 }}>
          <div style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontSize: 12, color: colors.chartAxisText }}>
              SMILES count
            </span>
          </div>
          <div style={{ width: 34, position: "relative" }}>
            <span style={{ position: "absolute", top: -6, right: 6, fontSize: 12, color: colors.chartAxisText }}>{yMax}</span>
            <span style={{ position: "absolute", top: "calc(50% - 19px)", right: 6, fontSize: 12, color: colors.chartAxisText }}>
              {yMax / 2}
            </span>
            <span style={{ position: "absolute", bottom: 24, right: 6, fontSize: 12, color: colors.chartAxisText }}>0</span>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 26 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, borderTop: `1px dashed ${colors.chartGridLine}` }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: `1px dashed ${colors.chartGridLine}` }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTop: `1px solid ${colors.chartBaseline}` }} />
              {showGhost && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 4px" }}>
                  {baseCounts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${(c / yMax) * 100}%`,
                        background: colors.chartBar,
                        opacity: 0.2,
                        borderRadius: "3px 3px 0 0",
                        minHeight: 2,
                      }}
                    />
                  ))}
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 4px" }}>
                {counts.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => selectBin(i)}
                    title="Filtrar por esta faixa"
                    onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                    style={{
                      flex: 1,
                      height: `${(c / yMax) * 100}%`,
                      background: binFilter === i ? colors.chartBarActive : colors.chartBar,
                      borderRadius: "3px 3px 0 0",
                      minHeight: 2,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 22, display: "flex", gap: 8, padding: "0 4px" }}>
              {counts.map((_, i) => {
                const edge = BIN_MIN + i;
                const showLabel = edge % 2 === 0;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#999" }}>
                    {showLabel ? (edge > 0 ? `+${edge}` : edge) : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: colors.chartAxisText, marginTop: 4, paddingLeft: 52 }}>
          LogS_pred(mol/L)
        </div>
      </div>

      <span style={{ position: "absolute", left: 1030, top: 512, fontWeight: 600, fontSize: 22, color: "#1f1f1f" }}>
        Resumo do estudo
      </span>
      <div style={{ position: "absolute", left: 1030, top: 556, width: 820, display: "flex", gap: 26 }}>
        <SummaryCard title="Total de moléculas" value={considered.length} />
        <SummaryCard
          title="Hits Confiáveis"
          desc="volume de moléculas classificadas com o sinal verde pelo Error Model"
          value={considered.filter((m) => m.status === "High Confidence").length}
        />
        <SummaryCard
          title="Retidos por Incerteza"
          desc="O total de moléculas sinalizadas com alto risco de predição incorreta devido a limitações de generalização da IA"
          value={considered.filter((m) => m.status === "Risk Alert").length}
          smallTitle
        />
      </div>

      <DetailPanel
        molecule={detailMolecule}
        radarAxes={radarAxes}
        radarRanges={radarRanges}
        isClosing={detailClosing}
        onClose={closeDetail}
        onOpenImage={() => setImgOpen(true)}
        onOpenRadar={() => setRadarOpen(true)}
      />
      <ImageModal molecule={imgOpen ? detailMolecule : null} onClose={() => setImgOpen(false)} />
      <RadarModal molecule={radarOpen ? detailMolecule : null} radarAxes={radarAxes} radarRanges={radarRanges} onClose={() => setRadarOpen(false)} />
    </div>
  );
}

function SummaryCard({ title, desc, value, smallTitle }: { title: string; desc?: string; value: number; smallTitle?: boolean }) {
  return (
    <div style={{ flex: 1, height: 230, background: colors.summaryCardBg, borderRadius: 8, padding: "22px 24px", display: "flex", flexDirection: "column" }}>
      <span style={{ fontWeight: 600, fontSize: smallTitle ? 20 : 22, lineHeight: smallTitle ? 1.15 : undefined, color: "#1f1f1f" }}>
        {title}
      </span>
      {desc && <span style={{ marginTop: 8, fontWeight: 400, fontSize: 12, color: "#5a5a5a", lineHeight: 1.35 }}>{desc}</span>}
      <span style={{ marginTop: "auto", fontWeight: 400, fontSize: smallTitle ? 60 : 64, color: "#1a1a1a", lineHeight: 1 }}>{value}</span>
    </div>
  );
}
