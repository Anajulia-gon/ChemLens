"use client";

import { useSyncExternalStore } from "react";
import { getResolvedNamesSnapshot, subscribeToResolvedNames } from "@/lib/nameResolver";

const emptySnapshot: Record<string, string> = {};

/** Nome exibido para um SMILES: usa o resolvido via PubChem quando disponível,
 * senão cai no `fallback` (nome local/CSV/"Molécula"). Reativo — quando a
 * resolução em segundo plano chega, todo componente que chama isso re-renderiza. */
export function useResolvedName(smiles: string, fallback: string): string {
  const names = useResolvedNames();
  return names[smiles] || fallback;
}

/** Todo o cache de nomes resolvidos — útil para listas, onde chamar o hook
 * por item violaria as regras de hooks (nº de itens pode variar). */
export function useResolvedNames(): Record<string, string> {
  return useSyncExternalStore(subscribeToResolvedNames, getResolvedNamesSnapshot, () => emptySnapshot);
}
