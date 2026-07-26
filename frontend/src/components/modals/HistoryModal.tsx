"use client";

import { colors } from "@/lib/theme";
import type { Study } from "@/hooks/useHistory";
import { BookIcon, TrashIcon } from "../icons";

interface HistoryModalProps {
  isOpen: boolean;
  studies: Study[];
  onClose: () => void;
  onAskDelete: (id: number) => void;
}

export function HistoryModal({ isOpen, studies, onClose, onAskDelete }: HistoryModalProps) {
  if (!isOpen) return null;

  const orderedStudies = [...studies].reverse();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: colors.modalOverlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxHeight: "72vh",
          background: colors.modalBg,
          borderRadius: 20,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: `0 24px 70px ${colors.modalShadow}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BookIcon size={26} color={colors.ink} strokeWidth={1.6} />
          <span style={{ fontWeight: 600, fontSize: 24, color: colors.ink }}>Histórico de estudos</span>
        </div>

        {studies.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
            {orderedStudies.map((study) => (
              <div
                key={study.id}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.historyItemHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.historyItem)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: colors.historyItem,
                  cursor: "pointer",
                  transition: "background .15s",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 16, color: colors.cardTitle }}>
                    Estudo {study.num}
                  </span>
                  <span style={{ fontWeight: 400, fontSize: 13, color: colors.fileRemoveText }}>
                    {study.date} · {study.molCount === 1 ? "1 molécula" : `${study.molCount} moléculas`}
                  </span>
                </div>
                <button
                  type="button"
                  title="Apagar estudo"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskDelete(study.id);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.historyDeleteHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  style={{
                    width: 34,
                    height: 34,
                    border: "none",
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    background: "transparent",
                    transition: "background .15s",
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <span
            style={{
              fontWeight: 400,
              fontSize: 15,
              color: colors.emptySubtitle,
              padding: "24px 0",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Nenhum estudo salvo ainda. Envie moléculas para predição e seus estudos aparecerão aqui.
          </span>
        )}
      </div>
    </div>
  );
}
