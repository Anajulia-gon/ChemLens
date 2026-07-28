// Caracteres invisiveis que as vezes vem colados de SMILES copiados de outros apps.
const INVISIBLE_CHARS = new RegExp("[\\u200B-\\u200F\\u2060\\uFEFF\\u00A0]", "g");

export function normalizeSmiles(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, "").trim();
}

/** Nome usado até a API (PubChem, ver lib/nameResolver.ts) resolver o nome real. */
export const UNKNOWN_MOLECULE_NAME = "Molecule";

/** Divide um texto colado em uma lista de SMILES (separados por espaço ou vírgula). */
export function tokenizeSmilesInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map(normalizeSmiles)
    .filter(Boolean);
}

/**
 * URL da imagem 2D da estrutura, via CDK Depict (mesmo serviço usado no Claude Design
 * para renderizar as moléculas nos cards). "cow" = Color On White (átomos
 * coloridos por elemento — O em vermelho, N em azul etc.), diferente de "bow"
 * (Black On White, monocromático). Sem os parâmetros w/h, o CDK recorta o
 * SVG bem rente à molécula (sem margem morta) — pedir um w/h fixo faz o CDK
 * centralizar a mesma molécula (tamanho fixo, controlado só por `zoom`) num
 * canvas maior, sobrando espaço vazio ao redor dela mesmo em containers
 * grandes. Cada tela então escala esse SVG bem ajustado via CSS
 * (width/height:100% + objectFit:"contain"), preenchendo o espaço disponível
 * sem distorcer nem deixar a estrutura minúscula.
 */
export function structureImageUrl(smiles: string): string {
  const params = new URLSearchParams({
    smi: normalizeSmiles(smiles),
    abbr: "off",
    zoom: "1.7",
  });
  return `https://www.simolecule.com/cdkdepict/depict/cow/svg?${params.toString()}`;
}
