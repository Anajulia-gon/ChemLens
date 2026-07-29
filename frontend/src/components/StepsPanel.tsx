import { colors } from "@/lib/theme";

const STEPS = [
  {
    num: "1",
    title: "Submit your molecules",
    desc: "Paste a SMILES, upload a .csv/.sdf file, or draw the structure.",
  },
  {
    num: "2",
    title: "Wait for processing",
    desc: "Descriptor generation, prediction, and uncertainty calculation in seconds.",
  },
  {
    num: "3",
    title: "See the prediction and reliability",
    desc: "Solubility value (logS) with uncertainty margin and risk alerts, if any.",
  },
  {
    num: "4",
    title: "Explore the molecule's details",
    desc: "Structure, key properties, and the descriptors that weighed most in the prediction.",
  },
];

export function StepsPanel() {
  return (
    <div
      style={{
        width: 440,
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      {STEPS.map((step) => (
        <div key={step.num} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", flexDirection: "row", gap: 11, alignItems: "center" }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: colors.stepNumberBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.white }}>{step.num}</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 22, color: colors.stepTitle }}>{step.title}</span>
          </div>
          <span style={{ fontWeight: 400, fontSize: 18, color: colors.stepDesc, lineHeight: 1.4 }}>
            {step.desc}
          </span>
        </div>
      ))}
    </div>
  );
}
