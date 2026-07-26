export interface ParsedCsvMolecule {
  smiles: string;
  name?: string;
}

const SMILES_HEADER_RE = /smiles/i;
const NAME_HEADER_RE = /(nome|name)/i;

function splitCsvRow(line: string): string[] {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

/**
 * Parser de CSV simples (sem suporte a vírgulas dentro de campos com aspas).
 * Detecta uma coluna "smiles" pelo cabeçalho; se não houver cabeçalho, assume
 * que a primeira coluna já é o SMILES (mesmo formato do exemplo do Briefing.md).
 */
export function parseMoleculesFromCsv(text: string): ParsedCsvMolecule[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const firstRow = splitCsvRow(lines[0]);
  const hasHeader = firstRow.some((cell) => SMILES_HEADER_RE.test(cell));

  let smilesIdx = 0;
  let nameIdx = -1;
  let dataLines = lines;

  if (hasHeader) {
    smilesIdx = firstRow.findIndex((cell) => SMILES_HEADER_RE.test(cell));
    nameIdx = firstRow.findIndex((cell) => NAME_HEADER_RE.test(cell));
    dataLines = lines.slice(1);
  }

  return dataLines
    .map(splitCsvRow)
    .filter((cells) => cells[smilesIdx])
    .map((cells) => ({
      smiles: cells[smilesIdx],
      name: nameIdx >= 0 ? cells[nameIdx] : undefined,
    }));
}
