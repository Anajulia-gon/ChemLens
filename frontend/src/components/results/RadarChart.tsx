import type { RadarRange } from "@/types/prediction";

export type RadarSeriesKey = "upper" | "lower" | "compound";

interface RadarChartProps {
  descriptors: Record<string, number>;
  axes: string[];
  ranges: Record<string, RadarRange>;
  /** Série a evidenciar (ver RadarLegend) — as demais continuam visíveis,
   * só com opacidade reduzida, nunca somem. */
  highlight?: RadarSeriesKey | null;
}

const LEGEND_ITEMS: { key: RadarSeriesKey; color: string; label: string }[] = [
  { key: "upper", color: "#6f86e8", label: "Upper limit" },
  { key: "lower", color: "#57b97e", label: "Lower limit" },
  { key: "compound", color: "#f0a92e", label: "Compound properties" },
];

interface RadarLegendProps {
  /** Série atualmente evidenciada. Só faz sentido junto de `onSelect`. */
  activeKey?: RadarSeriesKey | null;
  /** Quando presente, a legenda vira clicável — clicar de novo no mesmo item
   * limpa a seleção. Deixe undefined para a legenda estática (ex.: card
   * minimizado do DetailPanel). */
  onSelect?: (key: RadarSeriesKey) => void;
}

/** Legend explaining the radar chart's three shapes — the fixed upper/lower
 * reference bounds (see backend/domain.py RADAR_REFERENCE_RANGES) and the
 * molecule's actual computed values. Interactive (clickable, highlighting the
 * matching series) only when `onSelect` is passed — used in the enlarged
 * modal view; the mini card keeps the plain static legend. */
export function RadarLegend({ activeKey, onSelect }: RadarLegendProps) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {LEGEND_ITEMS.map((item) => {
        const isActive = activeKey === item.key;
        const isDimmed = !!activeKey && !isActive;
        return (
          <div
            key={item.key}
            onClick={onSelect ? () => onSelect(item.key) : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: onSelect ? "pointer" : "default",
              opacity: isDimmed ? 0.4 : 1,
              userSelect: "none",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#5a5a5a", fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const CX = 150;
const CY = 150;
const R = 104;
const FLOOR = 0.12;
const DIMMED_OPACITY = 0.22;

/**
 * Radar de propriedades físico-químicas contra faixas de referência
 * farmacológicas FIXAS (Lipinski/Veber/Ghose, ver backend/domain.py) — não
 * o min/max do lote de moléculas enviado. É essa a principal diferença em
 * relação ao mock do Claude Design: ali o radar comparava a molécula contra
 * as outras do mesmo lote; aqui compara contra limiares farmacológicos reais,
 * como pipeline.py já definia em `limites_descritores_farmaco`.
 */
export function RadarChart({ descriptors, axes, ranges, highlight }: RadarChartProps) {
  const n = axes.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2 + step / 2;

  const point = (radius: number, i: number): [number, number] => {
    const angle = start + i * step;
    return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
  };

  const valueRadius = (key: string): number => {
    const range = ranges[key] || { min: 0, max: 1 };
    const span = range.max - range.min || 1;
    let t = (descriptors[key] - range.min) / span;
    if (!isFinite(t)) t = 0;
    t = Math.max(0, Math.min(1, t));
    return R * (FLOOR + t * (1 - FLOOR));
  };

  const pointsStr = (radiusOrFn: number | ((key: string) => number)) =>
    axes
      .map((key, i) => {
        const r = typeof radiusOrFn === "function" ? radiusOrFn(key) : radiusOrFn;
        const [x, y] = point(r, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const opacityFor = (key: RadarSeriesKey) => (highlight && highlight !== key ? DIMMED_OPACITY : 1);
  const widthFor = (key: RadarSeriesKey, base: number) => (highlight === key ? base * 1.5 : base);

  return (
    <svg viewBox="-34 4 368 292" style={{ width: "100%", height: "100%" }}>
      {[0.25, 0.5, 0.75, 1].map((t, ri) => (
        <polygon key={`r${ri}`} points={pointsStr(R * t)} fill="none" stroke="#cfcfcf" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(R, i);
        return <line key={`s${i}`} x1={CX} y1={CY} x2={x} y2={y} stroke="#d8d8d8" strokeWidth={1} />;
      })}
      <polygon
        points={pointsStr(R)}
        fill="#8ea2f0"
        fillOpacity={0.4 * opacityFor("upper")}
        stroke="#6f86e8"
        strokeOpacity={opacityFor("upper")}
        strokeWidth={widthFor("upper", 1.5)}
      />
      <polygon
        points={pointsStr(R * FLOOR)}
        fill="#7fce9e"
        fillOpacity={0.7 * opacityFor("lower")}
        stroke="#57b97e"
        strokeOpacity={opacityFor("lower")}
        strokeWidth={widthFor("lower", 1.5)}
      />
      <polygon
        points={pointsStr(valueRadius)}
        fill="none"
        stroke="#f0a92e"
        strokeOpacity={opacityFor("compound")}
        strokeWidth={widthFor("compound", 2)}
      />
      {axes.map((key, i) => {
        const [x, y] = point(valueRadius(key), i);
        return <circle key={`d${i}`} cx={x} cy={y} r={2.4} fill="#f0a92e" fillOpacity={opacityFor("compound")} />;
      })}
      {axes.map((key, i) => {
        const [x, y] = point(R + 17, i);
        const dx = x - CX;
        const dy = y - CY;
        const anchor = dx > 12 ? "start" : dx < -12 ? "end" : "middle";
        const baseline = dy > 40 ? "hanging" : dy < -40 ? "auto" : "middle";
        return (
          <text
            key={`t${i}`}
            x={x}
            y={y}
            fontSize={11}
            fontWeight={700}
            fill="#2f3033"
            stroke="#fff"
            strokeWidth={3.5}
            paintOrder="stroke"
            textAnchor={anchor}
            dominantBaseline={baseline}
          >
            {key}
          </text>
        );
      })}
    </svg>
  );
}
