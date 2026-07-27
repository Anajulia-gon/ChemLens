"use client";

import { useState } from "react";
import { colors } from "@/lib/theme";
import { structureImageUrl } from "@/lib/molecules";
import { useResolvedName } from "@/hooks/useResolvedName";
import type { Molecule } from "@/types/molecule";
import { MoleculeGlyph, Spinner, XIcon } from "./icons";

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
        height: 84,
        borderRadius: 16,
        background: colors.card,
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
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 16,
              width: 52,
              height: 52,
              borderRadius: 10,
              background: colors.cardIcon,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MoleculeGlyph size={26} color={colors.cardIconStroke} strokeWidth={1.8} />
          </div>
          <span
            style={{
              position: "absolute",
              left: 82,
              top: 22,
              width: 320,
              fontWeight: 600,
              fontSize: 16,
              color: colors.cardTitle,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              position: "absolute",
              left: 82,
              top: 48,
              width: 320,
              fontWeight: 400,
              fontSize: 11,
              color: colors.cardSubtitle,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {molecule.smiles}
          </span>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 200,
              height: "100%",
              background: colors.white,
              borderRadius: 16,
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
            <button
              type="button"
              onClick={() => onRemove(molecule.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.cardRemoveHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              style={{
                position: "absolute",
                top: 6,
                right: 8,
                width: 24,
                height: 24,
                border: "none",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
                background: "transparent",
                transition: "background .15s",
              }}
            >
              <XIcon color={colors.cardRemoveStroke} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
