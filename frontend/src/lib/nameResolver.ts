/**
 * Resolução de nomes de moléculas desconhecidas via PubChem (mesma API que o
 * Claude Design usava). `lib/molecules.ts` só conhece um punhado de SMILES
 * fixos — qualquer coisa fora dessa lista cai em "Molécula" a menos que o
 * usuário tenha informado um nome (ex.: coluna do CSV). Este módulo resolve
 * esses casos de forma assíncrona, em segundo plano, e guarda o resultado em
 * cache (memória + localStorage) para não repetir a mesma consulta depois.
 *
 * É um cache/emissor simples fora do React (não um hook) para que várias
 * instâncias de componentes (cards, tabela de resultados, painel de detalhes)
 * compartilhem exatamente o mesmo estado sem precisar de Context — components
 * leem esse estado via `useResolvedName` (ver hooks/useResolvedName.ts), que
 * usa `useSyncExternalStore`.
 */

const STORAGE_KEY = "smiNames_v1";
const CONCURRENCY = 4;
const PUBCHEM_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/property/Title/JSON";

function loadCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage indisponível — segue só em memória.
  }
}

let cache: Record<string, string> = loadCache();
const pending = new Set<string>();
const queue: string[] = [];
let active = 0;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeToResolvedNames(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getResolvedNamesSnapshot(): Record<string, string> {
  return cache;
}

async function fetchPubChemTitle(smiles: string): Promise<string | null> {
  const response = await fetch(PUBCHEM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `smiles=${encodeURIComponent(smiles)}`,
  });
  if (!response.ok) return null;
  const json = await response.json();
  const title = json?.PropertyTable?.Properties?.[0]?.Title;
  return typeof title === "string" ? title : null;
}

function processQueue() {
  while (active < CONCURRENCY && queue.length) {
    const smiles = queue.shift() as string;
    active++;
    fetchPubChemTitle(smiles)
      .then((title) => {
        if (title) {
          cache = { ...cache, [smiles]: title };
          saveCache(cache);
          notify();
        }
      })
      .catch(() => {
        // Falha pontual de rede/CORS: mantém o fallback local, sem travar a UI.
      })
      .finally(() => {
        active--;
        pending.delete(smiles);
        processQueue();
      });
  }
}

/** Enfileira SMILES sem nome conhecido para resolução em segundo plano. */
export function queueNameResolution(smilesList: string[]): void {
  for (const smiles of smilesList) {
    if (cache[smiles] || pending.has(smiles)) continue;
    pending.add(smiles);
    queue.push(smiles);
  }
  processQueue();
}
