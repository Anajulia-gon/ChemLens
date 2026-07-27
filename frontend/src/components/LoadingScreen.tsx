import { colors } from "@/lib/theme";

interface LoadingScreenProps {
  progress: number;
  progressLabel: string;
}

export function LoadingScreen({ progress, progressLabel }: LoadingScreenProps) {
  const progressPct = `${Math.round(progress)}%`;

  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 440,
        width: 840,
        background: "#e6e6e6",
        borderRadius: 16,
        padding: "34px 40px 30px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 44, color: "#1f1f1f" }}>Carregando pipeline...</span>
        <span style={{ fontWeight: 700, fontSize: 44, color: "#1f1f1f" }}>{progressPct}</span>
      </div>
      <div style={{ marginTop: 24, width: "100%", height: 30, background: "#cccccc", borderRadius: 9, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            background: "#a5a5a5",
            borderRadius: 9,
            width: progressPct,
            transition: "width .5s ease",
          }}
        />
      </div>
      <span style={{ display: "block", marginTop: 16, fontWeight: 400, fontSize: 18, color: colors.tabIdleText }}>
        {progressLabel}
      </span>
    </div>
  );
}
