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
 * URL da imagem 2D da estrutura, via CDK Depict. Sem `w`/`h` fixos: o canvas
 * se ajusta (auto-crop) exatamente ao tamanho da molécula, então o
 * <img style="objectFit:contain"> do card consegue escalar a molécula para
 * preencher a caixa inteira em vez de sobrar margem em branco ao redor de
 * moléculas pequenas (ex.: água).
 */
export function structureImageUrl(smiles: string): string {
  const params = new URLSearchParams({
    smi: normalizeSmiles(smiles),
    abbr: "off",
    zoom: "0.5",
  });
  return `https://www.simolecule.com/cdkdepict/depict/bow/svg?${params.toString()}`;
}
