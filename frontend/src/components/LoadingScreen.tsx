import { codGray, colors } from "@/lib/theme";

interface LoadingScreenProps {
  progress: number;
  progressLabel: string;
}

const BAR_COUNT = 24;
const BAR_GAP = 6;

export function LoadingScreen({ progress, progressLabel }: LoadingScreenProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const filledBars = Math.round((pct / 100) * BAR_COUNT);

  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 440,
        width: 840,
        background: codGray[100],
        borderRadius: 20,
        padding: "28px 36px 32px",
        boxShadow: "0 24px 60px rgba(0,0,0,.18)",
      }}
    >
      <span style={{ display: "block", fontWeight: 400, fontSize: 27, color: codGray[900] }}>Running pipeline...</span>
      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 43, color: codGray[900] }}>{pct}%</span>
        <span style={{ fontWeight: 400, fontSize: 14, color: colors.tabIdleText }}>{progressLabel}</span>
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: BAR_GAP, height: 64 }}>
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 6,
              background: i < filledBars ? colors.statusReviewSuggested : codGray[300],
              transition: "background .25s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
