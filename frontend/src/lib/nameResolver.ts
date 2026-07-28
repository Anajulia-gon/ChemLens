/**
 * Resolução do nome de TODA molécula via PubChem (mesma API que o Claude
 * Design usava) — mesmo as que já têm um nome local (lib/molecules.ts) ou
 * vindo de um CSV: esses nomes servem só de placeholder instantâneo até a
 * API responder. O resultado fica em cache (memória + localStorage) para não
 * repetir a mesma consulta depois.
 *
 * Falha de rede (não "PubChem não conhece este composto", que é uma resposta
 * válida sem título) agenda uma nova tentativa — ver `scheduleRetry` — em vez
 * de deixar a molécula presa no placeholder para sempre.
 *
 * É um cache/emissor simples fora do React (não um hook) para que várias
 * instâncias de componentes (cards, tabela de resultados, painel de detalhes)
 * compartilhem exatamente o mesmo estado sem precisar de Context — components
 * leem esse estado via `useResolvedName` (ver hooks/useResolvedName.ts), que
 * usa `useSyncExternalStore`.
 */

const STORAGE_KEY = "smiNames_v1";
// Sequencial e espaçado — PubChem é uma API pública e sem chave; rajadas
// concorrentes tendem a disparar o "PUGREST.ServerBusy" (429/503) dele.
const CONCURRENCY = 1;
const MIN_INTERVAL_MS = 300;
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

const MAX_RETRIES = 3;

let cache: Record<string, string> = loadCache();
const pending = new Set<string>();
const queue: string[] = [];
const retryCounts = new Map<string, number>();
let active = 0;
let lastDispatchAt = 0;
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

  // 429/5xx = PubChem sobrecarregado/limitando taxa — transitório, joga pro
  // catch() do processQueue pra agendar retry. Diferente de um 404 (composto
  // não encontrado), que é uma resposta permanente e não deve ser retentada.
  if (response.status === 429 || response.status >= 500) {
    throw new Error(`PubChem unavailable (HTTP ${response.status})`);
  }
  if (!response.ok) return null;

  const json = await response.json();
  const title = json?.PropertyTable?.Properties?.[0]?.Title;
  return typeof title === "string" ? title : null;
}

/** Falha de rede ou PubChem sobrecarregado (429/5xx) — não "composto não
 * encontrado" — tenta de novo mais tarde, com backoff exponencial, até
 * `MAX_RETRIES` vezes. */
function scheduleRetry(smiles: string) {
  const attempts = (retryCounts.get(smiles) ?? 0) + 1;
  if (attempts > MAX_RETRIES) return;
  retryCounts.set(smiles, attempts);
  setTimeout(() => {
    if (cache[smiles] || pending.has(smiles)) return;
    pending.add(smiles);
    queue.push(smiles);
    processQueue();
  }, 4000 * 3 ** (attempts - 1));
}

function dispatchNext() {
  if (active >= CONCURRENCY || !queue.length) return;
  const smiles = queue.shift() as string;
  lastDispatchAt = Date.now();
  active++;
  fetchPubChemTitle(smiles)
    .then((title) => {
      if (title) {
        cache = { ...cache, [smiles]: title };
        saveCache(cache);
        notify();
      }
    })
    .catch(() => scheduleRetry(smiles))
    .finally(() => {
      active--;
      pending.delete(smiles);
      processQueue();
    });
}

function processQueue() {
  if (active >= CONCURRENCY || !queue.length) return;
  const wait = Math.max(0, lastDispatchAt + MIN_INTERVAL_MS - Date.now());
  setTimeout(dispatchNext, wait);
}

/** Enfileira SMILES sem nome conhecido para resolução em segundo plano.
 * Cada chamada é uma tentativa nova por parte do usuário (adicionou a
 * molécula de novo, reabriu um estudo) — zera o contador de retries em vez
 * de herdar o esgotamento de uma tentativa anterior, que pode ter falhado
 * por um motivo totalmente diferente (ex.: throttling temporário). */
export function queueNameResolution(smilesList: string[]): void {
  for (const smiles of smilesList) {
    if (cache[smiles] || pending.has(smiles)) continue;
    retryCounts.delete(smiles);
    pending.add(smiles);
    queue.push(smiles);
  }
  processQueue();
}
