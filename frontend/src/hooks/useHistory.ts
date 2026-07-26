"use client";

import { useCallback, useState } from "react";

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
 * Hoje nada chama `addStudy` ainda (o envio para predição não está implementado),
 * mas o hook já fica pronto para quando um estudo de verdade puder ser salvo.
 */
export function useHistory() {
  const [studies, setStudies] = useState<Study[]>(loadStudies);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addStudy = useCallback((molCount: number) => {
    setStudies((prev) => {
      const nextStudy: Study = {
        id: Date.now(),
        num: (prev[prev.length - 1]?.num ?? 0) + 1,
        date: new Date().toLocaleDateString("pt-BR"),
        molCount,
      };
      const updated = [...prev, nextStudy];
      saveStudies(updated);
      return updated;
    });
  }, []);

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
    confirmDeleteId,
    askDelete,
    cancelDelete,
    confirmDelete,
  };
}
