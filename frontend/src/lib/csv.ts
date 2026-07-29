export interface ParsedCsvMolecule {
  smiles: string;
  name?: string;
}

const SMILES_HEADER_RE = /smiles/i;
const NAME_HEADER_RE = /(nome|name)/i;

/**
 * Divide uma linha de CSV respeitando campos entre aspas — uma vírgula dentro
 * de um campo como `"(S)-butane-1,3-diol"` não pode contar como separador de
 * coluna, senão desalinha todas as colunas seguintes da linha (aspas duplas
 * repetidas `""` dentro de um campo entre aspas viram uma aspas literal,
 * como no formato CSV padrão).
 */
function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Parser de CSV com suporte a campos entre aspas (vírgulas e aspas escapadas
 * dentro do campo). Detecta uma coluna "smiles" pelo cabeçalho; se não houver
 * cabeçalho, assume que a primeira coluna já é o SMILES (mesmo formato do
 * exemplo do Briefing.md).
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
