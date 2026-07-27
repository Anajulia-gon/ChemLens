"use client";

import { useCallback, useState } from "react";
import type { PredictionResponse } from "@/types/prediction";

export interface Study {
  id: number;
  num: number;
  date: string;
  molCount: number;
}

const STORAGE_KEY = "smiStudies_v1";

function loadStudies(): Study[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStudies(studies: Study[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — segue só em memória.
  }
}

/**
 * Funções principais do histórico de estudos, isoladas do resto da tela.
 * A metadata (id/num/data/contagem) persiste em localStorage; os RESULTADOS
 * completos de cada estudo (moléculas + predições) ficam só em memória nesta
 * sessão — evita inflar o localStorage com payloads potencialmente grandes,
 * e reabrir um estudo de uma sessão anterior mostra um aviso em vez de dados
 * inexistentes (ver `getResults`).
 */
export function useHistory() {
  const [studies, setStudies] = useState<Study[]>(loadStudies);
  const [resultsById, setResultsById] = useState<Record<number, PredictionResponse>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addStudy = useCallback((molCount: number, payload: PredictionResponse): number => {
    const id = Date.now();
    setStudies((prev) => {
      const nextStudy: Study = {
        id,
        num: (prev[prev.length - 1]?.num ?? 0) + 1,
        date: new Date().toLocaleDateString("pt-BR"),
        molCount,
      };
      const updated = [...prev, nextStudy];
      saveStudies(updated);
      return updated;
    });
    setResultsById((prev) => ({ ...prev, [id]: payload }));
    return id;
  }, []);

  const getResults = useCallback(
    (id: number): PredictionResponse | undefined => resultsById[id],
    [resultsById]
  );

  const askDelete = useCallback((id: number) => setConfirmDeleteId(id), []);
  const cancelDelete = useCallback(() => setConfirmDeleteId(null), []);
  const confirmDelete = useCallback(() => {
    setConfirmDeleteId((id) => {
      if (id != null) {
        setStudies((prev) => {
          const updated = prev.filter((s) => s.id !== id);
          saveStudies(updated);
          return updated;
        });
        setResultsById((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      return null;
    });
  }, []);

  return {
    studies,
    isOpen,
    open,
    close,
    addStudy,
    getResults,
    confirmDeleteId,
    askDelete,
    cancelDelete,
    confirmDelete,
  };
}
