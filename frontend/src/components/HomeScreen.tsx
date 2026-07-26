"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/theme";
import { nameForSmiles } from "@/lib/molecules";
import { parseMoleculesFromCsv } from "@/lib/csv";
import { submitMoleculesForPrediction } from "@/lib/prediction";
import { useHistory } from "@/hooks/useHistory";
import type { Molecule } from "@/types/molecule";
import { GraduationCapIcon, ClockIcon } from "./icons";
import { TabBar } from "./TabBar";
import { StepsPanel } from "./StepsPanel";
import { SmilesTab } from "./tabs/SmilesTab";
import { ArquivoTab } from "./tabs/ArquivoTab";
import { DesenhoTab } from "./tabs/DesenhoTab";
import { ComingSoonModal } from "./modals/ComingSoonModal";
import { HistoryModal } from "./modals/HistoryModal";
import { ConfirmDeleteModal } from "./modals/ConfirmDeleteModal";
import { FileLoadingModal } from "./modals/FileLoadingModal";

export type ActiveTab = "smiles" | "arquivo" | "desenho";
export type FileStage = "idle" | "loading" | "done";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

function computeScale() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
}

export function HomeScreen() {
  // Começa em 1 (mesmo valor que o servidor renderiza, já que `window` não existe
  // no SSR) e é corrigido no efeito abaixo assim que o tamanho real da janela é
  // conhecido — sincronizar com o viewport do navegador é exatamente o tipo de
  // efeito colateral que useEffect existe para tratar.
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>("smiles");
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [fileStage, setFileStage] = useState<FileStage>("idle");
  const [fileName, setFileName] = useState("");
  const [fileProgress, setFileProgress] = useState(0);
  const [formResetKey, setFormResetKey] = useState(0);

  const seqRef = useRef(0);
  const history = useHistory();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o tamanho real da janela, indisponível no SSR
    setScale(computeScale());
    const onResize = () => setScale(computeScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const addMolecules = (smilesList: string[]) => {
    setMolecules((prev) => [
      ...prev,
      ...smilesList.map((smiles) => ({ id: ++seqRef.current, smiles, name: nameForSmiles(smiles) })),
    ]);
  };

  const removeMolecule = (id: number) => {
    setMolecules((prev) => prev.filter((m) => m.id !== id));
  };

  const openComingSoon = (label: string) => setComingSoon(label);
  const closeComingSoon = () => setComingSoon(null);

  const handleSubmit = (label: string) => {
    // A função já existe e é chamada — só não há backend ainda para responder.
    submitMoleculesForPrediction({ molecules }).catch(() => {});
    openComingSoon(label);
  };

  const handleFileSelected = (file: File) => {
    setFileStage("loading");
    setFileName(file.name);
    setFileProgress(0);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) setFileProgress((e.loaded / e.total) * 100);
    };
    reader.onload = () => {
      const text = String(reader.result || "");
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const parsed = isCsv ? parseMoleculesFromCsv(text) : [];
      const parsedMolecules = parsed.map((p) => ({
        id: ++seqRef.current,
        smiles: p.smiles,
        name: p.name?.trim() || nameForSmiles(p.smiles),
      }));
      setMolecules(parsedMolecules);
      setFileProgress(100);
      setFileStage("done");
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileStage("idle");
    setFileName("");
    setFileProgress(0);
    setMolecules([]);
  };

  const resetForm = () => {
    setActiveTab("smiles");
    setMolecules([]);
    setFileStage("idle");
    setFileName("");
    setFileProgress(0);
    setFormResetKey((k) => k + 1);
  };

  const deletingStudy = history.studies.find((s) => s.id === history.confirmDeleteId) ?? null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.pageBackground,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          flexShrink: 0,
          position: "relative",
          background: colors.canvas,
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* LEFT PANEL */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: 1080, background: colors.panel }} />

        <div
          onClick={resetForm}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          style={{
            position: "absolute",
            left: 18,
            top: 47,
            width: 460,
            height: 110,
            borderRadius: 14,
            background: colors.ink,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            transition: "opacity .15s",
          }}
        >
          <GraduationCapIcon />
          <span style={{ fontSize: 16, fontWeight: 500, color: colors.inkText }}>Novo estudo</span>
        </div>

        <div
          onClick={history.open}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.buttonSecondaryHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.buttonSecondary)}
          style={{
            position: "absolute",
            left: 494,
            top: 47,
            width: 460,
            height: 110,
            borderRadius: 14,
            background: colors.buttonSecondary,
            border: `1px solid ${colors.buttonSecondaryBorder}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            transition: "background .15s",
          }}
        >
          <ClockIcon />
          <span style={{ fontSize: 16, fontWeight: 500, color: colors.tabIdleText }}>Histórico</span>
        </div>

        <div style={{ position: "absolute", left: 18, top: 190, width: 918, height: 1, background: colors.divider }} />

        <TabBar activeTab={activeTab} onSelect={setActiveTab} />

        {activeTab === "smiles" && (
          <SmilesTab
            key={formResetKey}
            molecules={molecules}
            onAddMolecules={addMolecules}
            onRemoveMolecule={removeMolecule}
            onSubmit={() => handleSubmit("Enviar para predição")}
          />
        )}
        {activeTab === "arquivo" && (
          <ArquivoTab
            fileStage={fileStage}
            fileName={fileName}
            onFileSelected={handleFileSelected}
            onClearFile={clearFile}
            onSubmit={() => handleSubmit("Enviar para predição")}
          />
        )}
        {activeTab === "desenho" && <DesenhoTab onComingSoon={() => openComingSoon("Desenho de estrutura")} />}

        <StepsPanel />
      </div>

      <FileLoadingModal isOpen={fileStage === "loading"} fileName={fileName} progress={fileProgress} />
      <HistoryModal
        isOpen={history.isOpen}
        studies={history.studies}
        onClose={history.close}
        onAskDelete={history.askDelete}
      />
      <ConfirmDeleteModal study={deletingStudy} onCancel={history.cancelDelete} onConfirm={history.confirmDelete} />
      <ComingSoonModal actionLabel={comingSoon} onClose={closeComingSoon} />
    </div>
  );
}
