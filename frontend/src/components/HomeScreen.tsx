"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/theme";
import { nameForSmiles, UNKNOWN_MOLECULE_NAME } from "@/lib/molecules";
import { queueNameResolution } from "@/lib/nameResolver";
import { parseMoleculesFromCsv } from "@/lib/csv";
import { submitMoleculesForPrediction } from "@/lib/prediction";
import { useHistory } from "@/hooks/useHistory";
import type { Molecule } from "@/types/molecule";
import type { InvalidMolecule } from "@/types/prediction";
import { AlertIcon, GraduationCapIcon, ClockIcon } from "./icons";
import { TabBar } from "./TabBar";
import { StepsPanel } from "./StepsPanel";
import { CollapsedSidebar } from "./CollapsedSidebar";
import { LoadingScreen } from "./LoadingScreen";
import { SmilesTab } from "./tabs/SmilesTab";
import { ArquivoTab } from "./tabs/ArquivoTab";
import { DesenhoTab } from "./tabs/DesenhoTab";
import { ComingSoonModal } from "./modals/ComingSoonModal";
import { HistoryModal } from "./modals/HistoryModal";
import { ConfirmDeleteModal } from "./modals/ConfirmDeleteModal";
import { FileLoadingModal } from "./modals/FileLoadingModal";
import { MessageModal } from "./modals/MessageModal";
import { ResultsDashboard } from "./results/ResultsDashboard";

export type ActiveTab = "smiles" | "arquivo" | "desenho";
export type FileStage = "idle" | "loading" | "done";
export type Stage = "input" | "loading" | "results";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Etapas reais do pipeline (ver backend/app.py e backend/train_models.py):
// validação -> descritores RDKit -> scaler + modelo primário (stacking/Lasso)
// -> modelo de erro -> margem conformal (UQ). A barra avança até a
// penúltima etapa enquanto espera o backend responder e só chega a 100%
// quando a resposta realmente chega.
const PIPELINE_STEPS = [
  { p: 10, label: "Validando estrutura SMILES..." },
  { p: 25, label: "Filtrando compostos e tratando exceções..." },
  { p: 45, label: "Gerando descritores moleculares (RDKit)..." },
  { p: 65, label: "Aplicando o scaler e o modelo primário (stacking + Lasso)..." },
  { p: 82, label: "Estimando o erro do modelo (Random Forest)..." },
  { p: 92, label: "Calculando margem conformal (UQ, 90% de confiança)..." },
];

const MAX_LISTED_INVALID = 5;

function describeInvalidMolecules(invalid: InvalidMolecule[]): { title: string; message: string } {
  const items = invalid
    .slice(0, MAX_LISTED_INVALID)
    .map((m) => `${m.name || m.smiles} (${m.reason})`)
    .join("; ");
  const rest = invalid.length - MAX_LISTED_INVALID;
  const suffix = rest > 0 ? ` e mais ${rest}` : "";
  return {
    title: invalid.length === 1 ? "1 molécula ignorada" : `${invalid.length} moléculas ignoradas`,
    message: `${items}${suffix}. As demais moléculas do estudo foram processadas normalmente.`,
  };
}

function computeScale() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
}

export function HomeScreen() {
  const [scale, setScale] = useState(1);
  const [stage, setStage] = useState<Stage>("input");
  const [activeTab, setActiveTab] = useState<ActiveTab>("smiles");
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [fileStage, setFileStage] = useState<FileStage>("idle");
  const [fileName, setFileName] = useState("");
  const [fileProgress, setFileProgress] = useState(0);
  const [formResetKey, setFormResetKey] = useState(0);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState(PIPELINE_STEPS[0].label);
  const [activeStudyId, setActiveStudyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const seqRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const history = useHistory();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o tamanho real da janela, indisponível no SSR
    setScale(computeScale());
    const onResize = () => setScale(computeScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const addMolecules = (smilesList: string[]) => {
    setMolecules((prev) => [
      ...prev,
      ...smilesList.map((smiles) => ({ id: ++seqRef.current, smiles, name: nameForSmiles(smiles) })),
    ]);
    queueNameResolution(smilesList.filter((smiles) => nameForSmiles(smiles) === UNKNOWN_MOLECULE_NAME));
  };

  const removeMolecule = (id: number) => {
    setMolecules((prev) => prev.filter((m) => m.id !== id));
  };

  const openComingSoon = (label: string) => setComingSoon(label);
  const closeComingSoon = () => setComingSoon(null);

  const handleSubmit = async () => {
    if (!molecules.length) return;

    setStage("loading");
    setLoadingProgress(PIPELINE_STEPS[0].p);
    setLoadingLabel(PIPELINE_STEPS[0].label);

    let stepIndex = 0;
    progressTimerRef.current = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, PIPELINE_STEPS.length - 1);
      setLoadingProgress(PIPELINE_STEPS[stepIndex].p);
      setLoadingLabel(PIPELINE_STEPS[stepIndex].label);
    }, 900);

    try {
      const payload = await submitMoleculesForPrediction({ molecules });
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setLoadingProgress(100);
      setLoadingLabel("Pronto!");

      const newId = history.addStudy(payload.results.length, payload);

      setTimeout(() => {
        setActiveStudyId(newId);
        setStage("results");
        if (payload.invalid.length) setNotice(describeInvalidMolecules(payload.invalid));
      }, 550);
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setStage("input");
      setNotice({
        title: "Falha na predição",
        message:
          err instanceof Error
            ? err.message
            : "Não foi possível rodar a predição. Verifique se o backend Python está rodando (uvicorn app:app --port 8000, na pasta backend/).",
      });
    }
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
      queueNameResolution(
        parsedMolecules.filter((m) => m.name === UNKNOWN_MOLECULE_NAME).map((m) => m.smiles)
      );
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
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setStage("input");
    setActiveTab("smiles");
    setMolecules([]);
    setFileStage("idle");
    setFileName("");
    setFileProgress(0);
    setActiveStudyId(null);
    setFormResetKey((k) => k + 1);
  };

  const openStudy = (id: number) => {
    if (!history.getResults(id)) {
      history.close();
      setNotice({
        title: "Estudo indisponível",
        message: "Os resultados desse estudo não estão mais disponíveis nesta sessão (não ficam salvos entre recarregamentos da página).",
      });
      return;
    }
    setActiveStudyId(id);
    setStage("results");
    history.close();
  };

  const handleConfirmDelete = () => {
    const deletingId = history.confirmDeleteId;
    history.confirmDelete();
    if (deletingId != null && deletingId === activeStudyId) {
      resetForm();
    }
  };

  const activeResults = activeStudyId != null ? history.getResults(activeStudyId) : null;
  const deletingStudy = history.studies.find((s) => s.id === history.confirmDeleteId) ?? null;
  const isLoading = stage === "loading";
  const showCollapsedSidebar = stage !== "input";

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
        {stage === "input" && (
          <div>
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
                onSubmit={handleSubmit}
              />
            )}
            {activeTab === "arquivo" && (
              <ArquivoTab
                fileStage={fileStage}
                fileName={fileName}
                onFileSelected={handleFileSelected}
                onClearFile={clearFile}
                onSubmit={handleSubmit}
              />
            )}
            {activeTab === "desenho" && <DesenhoTab onComingSoon={() => openComingSoon("Desenho de estrutura")} />}

            <StepsPanel />
          </div>
        )}

        {showCollapsedSidebar && (
          <CollapsedSidebar
            isLoading={isLoading}
            studies={history.studies}
            activeStudyId={activeStudyId}
            onNovoEstudo={resetForm}
            onHistorico={history.open}
            onOpenStudy={openStudy}
          />
        )}

        {stage === "loading" && <LoadingScreen progress={loadingProgress} progressLabel={loadingLabel} />}

        {stage === "results" && activeResults && (
          <ResultsDashboard results={activeResults.results} radarAxes={activeResults.radarAxes} radarRanges={activeResults.radarRanges} />
        )}
      </div>

      <FileLoadingModal isOpen={fileStage === "loading"} fileName={fileName} progress={fileProgress} />
      <HistoryModal
        isOpen={history.isOpen}
        studies={history.studies}
        activeStudyId={activeStudyId}
        onClose={history.close}
        onOpenStudy={openStudy}
        onAskDelete={history.askDelete}
      />
      <ConfirmDeleteModal study={deletingStudy} onCancel={history.cancelDelete} onConfirm={handleConfirmDelete} />
      <ComingSoonModal actionLabel={comingSoon} onClose={closeComingSoon} />
      <MessageModal
        isOpen={!!notice}
        icon={<AlertIcon size={36} color={colors.white} strokeWidth={1.6} />}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
    </div>
  );
}
