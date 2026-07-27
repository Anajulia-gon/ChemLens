import type { RadarRange } from "@/types/prediction";

interface RadarChartProps {
  descriptors: Record<string, number>;
  axes: string[];
  ranges: Record<string, RadarRange>;
}

const CX = 150;
const CY = 150;
const R = 104;
const FLOOR = 0.12;

/**
 * Radar de propriedades físico-químicas contra faixas de referência
 * farmacológicas FIXAS (Lipinski/Veber/Ghose, ver backend/domain.py) — não
 * o min/max do lote de moléculas enviado. É essa a principal diferença em
 * relação ao mock do Claude Design: ali o radar comparava a molécula contra
 * as outras do mesmo lote; aqui compara contra limiares farmacológicos reais,
 * como pipeline.py já definia em `limites_descritores_farmaco`.
 */
export function RadarChart({ descriptors, axes, ranges }: RadarChartProps) {
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

  return (
    <svg viewBox="-34 4 368 292" style={{ width: "100%", height: "100%" }}>
      {[0.25, 0.5, 0.75, 1].map((t, ri) => (
        <polygon key={`r${ri}`} points={pointsStr(R * t)} fill="none" stroke="#cfcfcf" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(R, i);
        return <line key={`s${i}`} x1={CX} y1={CY} x2={x} y2={y} stroke="#d8d8d8" strokeWidth={1} />;
      })}
      <polygon points={pointsStr(R)} fill="#8ea2f0" fillOpacity={0.4} stroke="#6f86e8" strokeWidth={1.5} />
      <polygon points={pointsStr(R * FLOOR)} fill="#7fce9e" fillOpacity={0.7} stroke="#57b97e" strokeWidth={1.5} />
      <polygon points={pointsStr(valueRadius)} fill="none" stroke="#f0a92e" strokeWidth={2} />
      {axes.map((key, i) => {
        const [x, y] = point(valueRadius(key), i);
        return <circle key={`d${i}`} cx={x} cy={y} r={2.4} fill="#f0a92e" />;
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
