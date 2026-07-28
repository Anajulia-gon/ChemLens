"use client";

import { useRef } from "react";
import { colors } from "@/lib/theme";
import { tokenizeSmilesInput } from "@/lib/molecules";
import type { Molecule } from "@/types/molecule";
import { MoleculeGlyph, PlusIcon, ArrowRightIcon } from "../icons";
import { MoleculeCard } from "../MoleculeCard";

interface SmilesTabProps {
  molecules: Molecule[];
  onAddMolecules: (smilesList: string[]) => void;
  onRemoveMolecule: (id: number) => void;
  onSubmit: () => void;
}

export function SmilesTab({ molecules, onAddMolecules, onRemoveMolecule, onSubmit }: SmilesTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFromInput = () => {
    const el = inputRef.current;
    if (!el) return;
    const tokens = tokenizeSmilesInput(el.value);
    if (!tokens.length) return;
    onAddMolecules(tokens);
    el.value = "";
    el.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFromInput();
    }
  };

  const isEmpty = molecules.length === 0;

  return (
    <div>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 376,
          width: 626,
          height: 58,
          borderRadius: 10,
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        <div style={{ flexGrow: 1, background: colors.inputField, display: "flex", alignItems: "center", padding: "0 20px" }}>
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            placeholder="Type one or more SMILES here..."
            style={{ flexGrow: 1, border: "none", background: "transparent", fontSize: 18, color: colors.cardTitle, height: "100%" }}
          />
        </div>
        <div
          onClick={addFromInput}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.addButtonHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.addButton)}
          style={{
            width: 172,
            flexShrink: 0,
            background: colors.addButton,
            display: "flex",
            flexDirection: "row",
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            transition: "background .15s",
          }}
        >
          <PlusIcon />
          <span style={{ fontWeight: 500, fontSize: 18, color: colors.white }}>Add</span>
        </div>
      </div>

      {isEmpty && (
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 508,
            width: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <MoleculeGlyph size={42} color={colors.emptyIcon} />
          <span style={{ fontWeight: 500, fontSize: 18, color: colors.emptyTitle, whiteSpace: "nowrap" }}>
            Your molecules will show up here
          </span>
          <span style={{ fontWeight: 400, fontSize: 14, color: colors.emptySubtitle, textAlign: "center", lineHeight: 1.45 }}>
            Paste a SMILES above, draw a structure, or upload a file
          </span>
        </div>
      )}

      {!isEmpty && (
        <>
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 462,
              width: 626,
              maxHeight: 500,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "2px 4px 8px 0",
            }}
          >
            {molecules.map((mol) => (
              <MoleculeCard key={mol.id} molecule={mol} onRemove={onRemoveMolecule} />
            ))}
          </div>
          <div
            onClick={onSubmit}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            style={{
              position: "absolute",
              left: 180,
              top: 990,
              width: 626,
              height: 56,
              borderRadius: 12,
              background: colors.ink,
              display: "flex",
              flexDirection: "row",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "opacity .15s",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 18, color: colors.white }}>Submit for prediction</span>
            <ArrowRightIcon />
          </div>
        </>
      )}
    </div>
  );
}
