"use client";

import { colors } from "@/lib/theme";
import type { Study } from "@/hooks/useHistory";
import { GraduationCapIcon, ClockIcon } from "./icons";

interface CollapsedSidebarProps {
  isLoading: boolean;
  studies: Study[];
  activeStudyId: number | null;
  onNovoEstudo: () => void;
  onHistorico: () => void;
  onOpenStudy: (id: number) => void;
}

export function CollapsedSidebar({
  isLoading,
  studies,
  activeStudyId,
  onNovoEstudo,
  onHistorico,
  onOpenStudy,
}: CollapsedSidebarProps) {
  return (
    <div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 104,
          height: 1080,
          background: colors.sidebarCollapsed,
          animation: "sidebarBar .42s cubic-bezier(.65,0,.35,1) both",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 30,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
          animation: "sidebarNav .55s ease both",
        }}
      >
        <div
          onClick={onNovoEstudo}
          title="Novo estudo"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: isLoading ? colors.ink : colors.navIdleBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all .15s",
          }}
        >
          <GraduationCapIcon size={24} color={isLoading ? colors.white : colors.navIdleStroke} strokeWidth={1.5} />
        </div>
        <div
          onClick={onHistorico}
          title="Histórico"
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.buttonSecondaryHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.navIdleBg)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: colors.navIdleBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background .15s",
          }}
        >
          <ClockIcon size={22} color={colors.navIdleStroke} strokeWidth={1.6} />
        </div>
        <div style={{ width: 40, height: 1, background: "#c9c9c9", margin: "2px 0" }} />
        {studies.map((study) => {
          const isActive = !isLoading && study.id === activeStudyId;
          return (
            <div
              key={study.id}
              onClick={() => onOpenStudy(study.id)}
              style={{
                position: "relative",
                width: 56,
                height: 56,
                borderRadius: 14,
                background: isActive ? colors.ink : colors.navIdleBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? colors.white : colors.navIdleStroke} strokeWidth={1.4}>
                <rect x="4" y="4" width="16" height="16" rx="3" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? colors.white : colors.navIdleStroke,
                }}
              >
                {study.num}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
