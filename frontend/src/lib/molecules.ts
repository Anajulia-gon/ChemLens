// Caracteres invisiveis que as vezes vem colados de SMILES copiados de outros apps.
const INVISIBLE_CHARS = new RegExp("[\\u200B-\\u200F\\u2060\\uFEFF\\u00A0]", "g");

// Mesmo dicionário de compostos conhecidos do design original, usado para dar um
// nome amigável a SMILES comuns em vez de "Molécula".
const KNOWN_COMPOUNDS: Record<string, string> = {
  "CC(C)Cc1ccc(cc1)C(C)C(=O)O": "Ibuprofeno",
  "CCCCCCCCC=CCCCCCCCC(=O)O": "Ácido Oleico",
  "CC1=C2[C@H](C(=O)[C@@]3([C@H](C[C@@H]4[C@]([C@H]3[C@@H]([C@@](C2(C)C)(C[C@@H]1OC(=O)[C@@H]([C@H](C5=CC=CC=C5)NC(=O)C6=CC=CC=C6)O)O)OC(=O)C7=CC=CC=C7)(CO4)OC(=O)C)O)C)OC(=O)C":
    "Paclitaxel",
  "C[C@H](CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CC=C4[C@@]3(CC[C@@H](C4)O)C)C": "Colesterol",
  "CCO": "Etanol",
  "CC(=O)O": "Ácido Acético",
  "c1ccccc1": "Benzeno",
  "C1=CC=CC=C1": "Benzeno",
  O: "Água",
  "CC(=O)Oc1ccccc1C(=O)O": "Aspirina",
  "CN1C=NC2=C1C(=O)N(C(=O)N2C)C": "Cafeína",
  "C(C1C(C(C(C(O1)O)O)O)O)O": "Glicose",
};

export function normalizeSmiles(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, "").trim();
}

/** Nome usado quando nem o dicionário local nem o usuário (CSV) informaram um. */
export const UNKNOWN_MOLECULE_NAME = "Molécula";

export function nameForSmiles(smiles: string): string {
  return KNOWN_COMPOUNDS[normalizeSmiles(smiles)] || UNKNOWN_MOLECULE_NAME;
}

/** Divide um texto colado em uma lista de SMILES (separados por espaço ou vírgula). */
export function tokenizeSmilesInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map(normalizeSmiles)
    .filter(Boolean);
}

/**
 * URL da imagem 2D da estrutura, via CDK Depict (mesmo serviço usado no Claude Design
 * para renderizar as moléculas nos cards).
 */
export function structureImageUrl(smiles: string): string {
  const params = new URLSearchParams({
    smi: normalizeSmiles(smiles),
    w: "150",
    h: "64",
    abbr: "off",
    zoom: "1.7",
  });
  return `https://www.simolecule.com/cdkdepict/depict/bow/svg?${params.toString()}`;
}
