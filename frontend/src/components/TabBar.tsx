"use client";

import { colors } from "@/lib/theme";
import type { ActiveTab } from "./HomeScreen";

interface TabBarProps {
  activeTab: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
}

const TABS: { key: ActiveTab; label: string }[] = [
  { key: "smiles", label: "Smiles" },
  { key: "arquivo", label: "Arquivo" },
  { key: "desenho", label: "Desenho" },
];

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 180,
        top: 230,
        width: 610,
        height: 58,
        background: colors.tabBar,
        borderRadius: 12,
        display: "flex",
        flexDirection: "row",
        padding: 6,
        gap: 6,
        alignItems: "center",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <div
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              height: 46,
              flex: 1,
              borderRadius: 9,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
              transition: "all .15s",
              background: isActive ? colors.ink : "transparent",
              color: isActive ? colors.white : colors.tabIdleText,
            }}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}
