"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteStudy, getStudy, listStudies } from "@/lib/api";
import type { PredictionResponse, StudyMeta } from "@/types/prediction";

export type Study = StudyMeta;

/**
 * Funções principais do histórico de estudos, isoladas do resto da tela.
 * Os estudos são salvos de verdade pelo backend (backend/studies/<id>.json,
 * ver storage.py) — `/predict` já persiste ao terminar, então só precisamos
 * listar/buscar/apagar por aqui. Isso resolve o problema de perder os
 * estudos ao recarregar a página: a lista é carregada do backend assim que
 * o hook monta.
 */
export function useHistory() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [resultsById, setResultsById] = useState<Record<number, PredictionResponse>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    listStudies()
      .then(setStudies)
      .catch(() => {
        // Backend fora do ar — o histórico só fica vazio até ele voltar.
      });
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  /** `/predict` já salvou o estudo — só precisamos registrar localmente. */
  const registerStudy = useCallback((payload: PredictionResponse): number => {
    const meta: Study = { id: payload.id, num: payload.num, date: payload.date, molCount: payload.molCount };
    setStudies((prev) => [...prev, meta]);
    setResultsById((prev) => ({ ...prev, [payload.id]: payload }));
    return payload.id;
  }, []);

  const getCachedResults = useCallback(
    (id: number): PredictionResponse | undefined => resultsById[id],
    [resultsById]
  );

  /** Busca os resultados completos do estudo, usando o cache em memória
   * quando possível e só chamando o backend se necessário. */
  const fetchResults = useCallback(
    async (id: number): Promise<PredictionResponse> => {
      const cached = resultsById[id];
      if (cached) return cached;
      const data = await getStudy(id);
      setResultsById((prev) => ({ ...prev, [id]: data }));
      return data;
    },
    [resultsById]
  );

  /** Atualiza o cache local depois de uma mudança no estudo já persistida
   * pelo backend (ex.: remoção de moléculas selecionadas). */
  const applyStudyUpdate = useCallback((payload: PredictionResponse) => {
    setResultsById((prev) => ({ ...prev, [payload.id]: payload }));
    setStudies((prev) => prev.map((s) => (s.id === payload.id ? { ...s, molCount: payload.molCount } : s)));
  }, []);

  const askDelete = useCallback((id: number) => setConfirmDeleteId(id), []);
  const cancelDelete = useCallback(() => setConfirmDeleteId(null), []);

  const confirmDelete = useCallback(async (): Promise<number | null> => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (id == null) return null;

    await deleteStudy(id).catch(() => {
      // Se apagar no backend falhar, ainda tiramos da lista local — o pior
      // caso é o arquivo ficar órfão em disco, não uma inconsistência na UI.
    });
    setStudies((prev) => prev.filter((s) => s.id !== id));
    setResultsById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    return id;
  }, [confirmDeleteId]);

  return {
    studies,
    isOpen,
    open,
    close,
    registerStudy,
    applyStudyUpdate,
    getCachedResults,
    fetchResults,
    confirmDeleteId,
    askDelete,
    cancelDelete,
    confirmDelete,
  };
}
