/**
 * Mesmos limiares de classificação de solubilidade de backend/domain.py
 * (`SOLUBILITY_LIMITS`) — mantidos em sincronia manualmente, já que não há
 * geração de tipos compartilhada entre as duas linguagens. Usado pra desenhar
 * as zonas de cor no gráfico de incerteza (mesmas 3 classes da tabela).
 */
import { colors } from "./theme";

export const SOLUBILITY_ZONE_BOUNDARIES = [-4, -2] as const;
export const SOLUBILITY_ZONE_LABELS = ["Poorly soluble", "Slightly soluble", "Highly soluble"] as const;

/**
 * Cor do rótulo "Class Range" (`classTag`, vindo de backend/classification.py
 * `build_class_tag`) — vermelho sempre que o intervalo de confiança alcança
 * a classe "Low Solubility" (o worst-case fica "...to Insoluble" ou o tag é
 * "Low Solubility" isolado), amarelo/laranja quando cruza para "Slightly
 * Soluble" sem chegar lá, e verde só quando o tag é "High Solubility" puro
 * (intervalo inteiro contido na melhor classe).
 */
export function classTagColor(tag: string): string {
  if (tag.includes("Insoluble") || tag === "Low Solubility") return colors.statusRiskAlert;
  if (tag.includes("Slightly Soluble")) return colors.statusReviewSuggested;
  return colors.statusHighConfidence;
}
