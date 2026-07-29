import { codGray, colors } from "@/lib/theme";
import { SOLUBILITY_ZONE_BOUNDARIES, SOLUBILITY_ZONE_LABELS } from "@/lib/solubility";

interface UncertaintyChartProps {
  logS: number;
  lowerBound: number;
  upperBound: number;
}

// Régua fixa do eixo (-9 a +5) — não se expande com os dados; predições ou
// limites fora dessa faixa apenas ficam visualmente presos na borda da barra.
const AXIS_MIN = -9;
const AXIS_MAX = 5;

const ZONE_COLORS = [colors.statusRiskAlert, colors.statusReviewSuggested, colors.statusHighConfidence];

// Layout vertical fixo da barra + linha do intervalo + ticks + rótulos dos
// limites + legenda de zonas, todos no mesmo container relativo (ver render
// abaixo). A legenda fica abaixo dos rótulos de limite (não mais acima da
// barra), com um espaçamento fixo grande o bastante para nunca se sobrepor
// a eles, não importa o conteúdo.
const BAR_TOP = 28;
const BAR_HEIGHT = 30;
const BAR_CENTER = BAR_TOP + BAR_HEIGHT / 2;
const BAR_BOTTOM = BAR_TOP + BAR_HEIGHT;
const TICKS_TOP = BAR_BOTTOM + 8;
const TICKS_HEIGHT = 16;
const CONNECTOR_TOP = BAR_BOTTOM;
const LABEL_TOP = TICKS_TOP + TICKS_HEIGHT + 6;
const LABEL_HEIGHT = 16;
const ZONE_LEGEND_TOP = LABEL_TOP + LABEL_HEIGHT + 22;
const ZONE_LEGEND_HEIGHT = 18;
const CONTAINER_HEIGHT = ZONE_LEGEND_TOP + ZONE_LEGEND_HEIGHT;

// Este gráfico só é usado dentro do DetailPanel (largura fixa de 874px, com
// 26px de padding de cada lado) — usamos essa largura real pra decidir se os
// rótulos "Lower bound"/"Upper bound" cabem lado a lado sem se sobrepor
// (intervalos estreitos aproximam demais os dois pontos).
const CONTENT_WIDTH_PX = 874 - 26 * 2;
const MIN_LABEL_GAP_PX = 210;

function clamp(x: number) {
  return Math.max(0, Math.min(100, x));
}

/** Passo "redondo" pros ticks do eixo, adaptado ao tamanho da faixa. */
function niceStep(span: number) {
  if (span <= 10) return 2;
  if (span <= 16) return 4;
  if (span <= 30) return 5;
  return Math.ceil(span / 6 / 5) * 5;
}

export function UncertaintyChart({ logS, lowerBound, upperBound }: UncertaintyChartProps) {
  const span = AXIS_MAX - AXIS_MIN;
  const pct = (v: number) => clamp(((v - AXIS_MIN) / span) * 100);

  const [boundary1, boundary2] = SOLUBILITY_ZONE_BOUNDARIES;
  const b1Pct = pct(boundary1);
  const b2Pct = pct(boundary2);
  const markPct = pct(logS);
  const lowerPct = pct(lowerBound);
  const upperPct = pct(upperBound);

  const labelGapPx = ((upperPct - lowerPct) / 100) * CONTENT_WIDTH_PX;
  const labelsOverlap = labelGapPx < MIN_LABEL_GAP_PX;

  const step = niceStep(span);
  const ticks: number[] = [];
  for (let v = Math.ceil(AXIS_MIN / step) * step; v <= AXIS_MAX + 1e-9; v += step) {
    ticks.push(Math.round(v));
  }

  // Transição de cor concentrada bem em cima da linha tracejada de cada
  // fronteira (não espalhada pela zona inteira) — assim a cor de cada trecho
  // da barra reflete de fato os limites de SOLUBILITY_ZONE_BOUNDARIES, em vez
  // de já começar a misturar com a próxima zona logo no início dela.
  const TRANSITION_PCT = 5;
  const gradient = `linear-gradient(to right,
    ${ZONE_COLORS[0]} ${Math.max(0, b1Pct - TRANSITION_PCT)}%,
    ${ZONE_COLORS[1]} ${Math.min(100, b1Pct + TRANSITION_PCT)}%,
    ${ZONE_COLORS[1]} ${Math.max(0, b2Pct - TRANSITION_PCT)}%,
    ${ZONE_COLORS[2]} ${Math.min(100, b2Pct + TRANSITION_PCT)}%)`;

  const zoneSpans: [number, number][] = [
    [0, b1Pct],
    [b1Pct, b2Pct],
    [b2Pct, 100],
  ];

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: colors.tabIdleText }}>Reliability Assessment</span>
        <span style={{ fontSize: 12, color: colors.emptySubtitle }}>Prediction Error Margin</span>
      </div>

      {/* previsão média (tooltip) + barra gradiente + intervalo + limites + legenda de zonas */}
      <div style={{ position: "relative", marginTop: 40, height: CONTAINER_HEIGHT }}>
        {/* tooltip da previsão média */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${markPct}%`,
            transform: "translateX(-50%)",
            fontSize: 12,
            fontWeight: 600,
            color: colors.white,
            background: colors.ink,
            padding: "4px 9px",
            borderRadius: 6,
            whiteSpace: "nowrap",
          }}
        >
          Average prediction: {logS.toFixed(2)} logS
        </div>

        {/* barra gradiente das classes de solubilidade */}
        <div
          style={{
            position: "absolute",
            top: BAR_TOP,
            left: 0,
            right: 0,
            height: BAR_HEIGHT,
            borderRadius: BAR_HEIGHT / 2,
            background: gradient,
          }}
        />

        {/* linhas tracejadas marcando as fronteiras entre zonas de solubilidade */}
        {[b1Pct, b2Pct].map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: BAR_TOP,
              left: `${p}%`,
              height: BAR_HEIGHT,
              borderLeft: "2px dashed rgba(0,0,0,0.4)",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* linha do intervalo de confiança, centralizada verticalmente na barra */}
        <div
          style={{
            position: "absolute",
            top: BAR_CENTER,
            height: 6,
            borderRadius: 3,
            background: colors.ink,
            left: `${lowerPct}%`,
            width: `${Math.max(0, upperPct - lowerPct)}%`,
            transform: "translateY(-50%)",
          }}
        />
        {/* bolinhas do limite inferior e superior */}
        {[lowerPct, upperPct].map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: BAR_CENTER,
              left: `${p}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors.ink,
              border: `2px solid ${colors.white}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {/* bolinha da previsão média (maior, centralizada na barra) */}
        <div
          style={{
            position: "absolute",
            top: BAR_CENTER,
            left: `${markPct}%`,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: colors.ink,
            border: `2.5px solid ${colors.white}`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 1px 3px rgba(0,0,0,.3)",
          }}
        />

        {/* ticks do eixo */}
        {ticks.map((v) => (
          <span
            key={v}
            style={{
              position: "absolute",
              top: TICKS_TOP,
              left: `${pct(v)}%`,
              transform: "translateX(-50%)",
              fontSize: 12,
              color: colors.emptySubtitle,
            }}
          >
            {v > 0 ? `+${v}` : v}
          </span>
        ))}

        {/* linhas ligando as bolinhas dos limites aos rótulos numéricos */}
        {[lowerPct, upperPct].map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: CONNECTOR_TOP,
              left: `${p}%`,
              width: 1.5,
              height: LABEL_TOP - CONNECTOR_TOP,
              background: codGray[400],
              transform: "translateX(-50%)",
            }}
          />
        ))}

        {/* limites numéricos do intervalo — juntos numa linha só quando o
            intervalo é estreito demais pra caber "Lower bound"/"Upper bound"
            lado a lado sem sobrepor */}
        {labelsOverlap ? (
          <span
            style={{
              position: "absolute",
              top: LABEL_TOP,
              height: LABEL_HEIGHT,
              left: `${(lowerPct + upperPct) / 2}%`,
              transform: `translateX(${(lowerPct + upperPct) / 2 < 15 ? "0%" : (lowerPct + upperPct) / 2 > 85 ? "-100%" : "-50%"})`,
              fontSize: 12,
              fontWeight: 600,
              color: colors.tabIdleText,
              whiteSpace: "nowrap",
            }}
          >
            Bounds: {lowerBound.toFixed(2)} to {upperBound.toFixed(2)}
          </span>
        ) : (
          <>
            <span
              style={{
                position: "absolute",
                top: LABEL_TOP,
                height: LABEL_HEIGHT,
                left: `${lowerPct}%`,
                transform: `translateX(${lowerPct < 15 ? "0%" : "-50%"})`,
                fontSize: 12,
                fontWeight: 600,
                color: colors.tabIdleText,
                whiteSpace: "nowrap",
              }}
            >
              Lower bound: {lowerBound.toFixed(2)}
            </span>
            <span
              style={{
                position: "absolute",
                top: LABEL_TOP,
                height: LABEL_HEIGHT,
                left: `${upperPct}%`,
                transform: `translateX(${upperPct > 85 ? "-100%" : "-50%"})`,
                fontSize: 12,
                fontWeight: 600,
                color: colors.tabIdleText,
                whiteSpace: "nowrap",
              }}
            >
              Upper bound: {upperBound.toFixed(2)}
            </span>
          </>
        )}

        {/* legenda das zonas de solubilidade — abaixo dos rótulos de limite,
            com espaçamento fixo (ZONE_LEGEND_TOP) que garante que nunca
            fiquem cobertas por eles */}
        {zoneSpans.map(([from, to], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: ZONE_LEGEND_TOP,
              height: ZONE_LEGEND_HEIGHT,
              left: `${(from + to) / 2}%`,
              transform: "translateX(-50%)",
              fontSize: 12,
              fontWeight: 600,
              color: ZONE_COLORS[i],
              whiteSpace: "nowrap",
            }}
          >
            {SOLUBILITY_ZONE_LABELS[i]}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, color: codGray[400] }}>
        <span>← less soluble</span>
        <span>more soluble →</span>
      </div>
    </div>
  );
}
