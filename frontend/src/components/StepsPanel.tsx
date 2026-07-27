import { colors } from "@/lib/theme";

const STEPS = [
  {
    num: "1",
    title: "Envie suas moléculas",
    desc: "Cole o SMILES, envie um arquivo .csv/.sdf ou desenhe a estrutura.",
  },
  {
    num: "2",
    title: "Aguarde o processamento",
    desc: "Geração de descritores, predição e cálculo de incerteza em segundos.",
  },
  {
    num: "3",
    title: "Veja a predição e a confiabilidade",
    desc: "Valor de solubilidade (logS) com margem de incerteza e alertas de risco, se houver.",
  },
  {
    num: "4",
    title: "Explore os detalhes da molécula",
    desc: "Estrutura, propriedades-chave e os descritores que mais pesaram na predição.",
  },
];

export function StepsPanel() {
  return (
    <div
      style={{
        position: "absolute",
        left: 1225,
        top: 284,
        width: 440,
        display: "flex",
        flexDirection: "column",
        gap: 56,
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
            <span style={{ fontWeight: 600, fontSize: 24, color: colors.stepTitle }}>{step.title}</span>
          </div>
          <span style={{ fontWeight: 400, fontSize: 16, color: colors.stepDesc, lineHeight: 1.4 }}>
            {step.desc}
          </span>
        </div>
      ))}
    </div>
  );
}
