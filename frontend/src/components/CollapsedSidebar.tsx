"use client";

import { codGray, colors } from "@/lib/theme";
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
          bottom: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "sidebarNav .55s ease both",
        }}
      >
        {/* topo fixo: não rola com a lista de estudos abaixo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", flexShrink: 0 }}>
          <div
            onClick={onNovoEstudo}
            title="New study"
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
            title="History"
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
          <div style={{ width: 40, height: 1, background: codGray[300], margin: "2px 0" }} />
        </div>

        {/* lista de estudos: única parte que rola */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "center",
            marginTop: 14,
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            scrollbarWidth: "none",
          }}
        >
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
                  flexShrink: 0,
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
                    fontSize: 14,
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
    </div>
  );
}
