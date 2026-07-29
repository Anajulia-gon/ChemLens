"use client";

import { useState } from "react";
import { colors } from "@/lib/theme";
import { structureImageUrl } from "@/lib/molecules";
import { useResolvedName } from "@/hooks/useResolvedName";
import type { Molecule } from "@/types/molecule";
import { Spinner, XIcon } from "./icons";

interface MoleculeCardProps {
  molecule: Molecule;
  onRemove: (id: number) => void;
}

export function MoleculeCard({ molecule, onRemove }: MoleculeCardProps) {
  const [imageReady, setImageReady] = useState(false);
  const displayName = useResolvedName(molecule.smiles, molecule.name);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 96,
        borderRadius: 16,
        background: colors.cardIcon,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Sempre montada para disparar o carregamento; some da tela até resolver. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={structureImageUrl(molecule.smiles)}
        alt=""
        onLoad={() => setImageReady(true)}
        onError={() => setImageReady(true)}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      />

      {!imageReady ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner color={colors.cardSubtitle} />
        </div>
      ) : (
        <>
          <span
            style={{
              position: "absolute",
              left: 20,
              top: 16,
              width: 260,
              fontWeight: 700,
              fontSize: 22,
              color: colors.cardTitle,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>
          <div style={{ position: "absolute", left: 20, top: 54, display: "flex", alignItems: "center", gap: 8, width: 260 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.fileBadge, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: colors.cardSubtitle,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {molecule.smiles}
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 180,
              background: colors.white,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={structureImageUrl(molecule.smiles)}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: colors.white,
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onRemove(molecule.id)}
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 24,
              height: 24,
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 2,
              background: "transparent",
            }}
          >
            <XIcon color={colors.cardRemoveStroke} />
          </button>
        </>
      )}
    </div>
  );
}
