"use client";

import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/theme";
import { UNKNOWN_MOLECULE_NAME } from "@/lib/molecules";
import { queueNameResolution } from "@/lib/nameResolver";
import { parseMoleculesFromCsv } from "@/lib/csv";
import { submitMoleculesForPrediction } from "@/lib/prediction";
import { useHistory } from "@/hooks/useHistory";
import type { Molecule } from "@/types/molecule";
import type { InvalidMolecule } from "@/types/prediction";
import { AlertIcon, GraduationCapIcon, ClockIcon, Spinner } from "./icons";
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
export type Stage = "input" | "loading" | "opening" | "results";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Etapas reais do pipeline (ver backend/app.py e backend/train_models.py):
// validação -> descritores RDKit -> scaler + modelo primário (stacking/Lasso)
// -> modelo de erro -> margem conformal (UQ). A barra avança até a
// penúltima etapa enquanto espera o backend responder e só chega a 100%
// quando a resposta realmente chega.
const PIPELINE_STEPS = [
  { p: 10, label: "Validating SMILES structure..." },
  { p: 25, label: "Filtering compounds and handling exceptions..." },
  { p: 45, label: "Generating molecular descriptors (RDKit)..." },
  { p: 65, label: "Applying the scaler and the primary model (stacking + Lasso)..." },
  { p: 82, label: "Estimating the model's error (Random Forest)..." },
  { p: 92, label: "Computing the conformal margin (UQ, 90% confidence)..." },
];

const MAX_LISTED_INVALID = 5;

function describeInvalidMolecules(invalid: InvalidMolecule[]): { title: string; message: string } {
  const items = invalid
    .slice(0, MAX_LISTED_INVALID)
    .map((m) => `${m.name || m.smiles} (${m.reason})`)
    .join("; ");
  const rest = invalid.length - MAX_LISTED_INVALID;
  const suffix = rest > 0 ? ` and ${rest} more` : "";
  return {
    title: invalid.length === 1 ? "1 molecule skipped" : `${invalid.length} molecules skipped`,
    message: `${items}${suffix}. The rest of the study's molecules were processed normally.`,
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
      ...smilesList.map((smiles) => ({ id: ++seqRef.current, smiles, name: UNKNOWN_MOLECULE_NAME })),
    ]);
    // Nome final sempre vem da API — o dicionário local só serve de placeholder
    // instantâneo enquanto a resolução acontece em segundo plano.
    queueNameResolution(smilesList);
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
      setLoadingLabel("Done!");

      const newId = history.registerStudy(payload);

      setTimeout(() => {
        setActiveStudyId(newId);
        setStage("results");
        if (payload.invalid.length) setNotice(describeInvalidMolecules(payload.invalid));
      }, 550);
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setStage("input");
      setNotice({
        title: "Prediction failed",
        message:
          err instanceof Error
            ? err.message
            : "Could not run the prediction. Make sure the Python backend is running (uvicorn app:app --port 8000, in the backend/ folder).",
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
        name: p.name?.trim() || UNKNOWN_MOLECULE_NAME,
      }));
      setMolecules(parsedMolecules);
      // Nome final sempre vem da API, mesmo quando o CSV já trazia um nome.
      queueNameResolution(parsedMolecules.map((m) => m.smiles));
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

  const openStudy = async (id: number) => {
    history.close();
    setStage("opening");
    try {
      await history.fetchResults(id);
      setActiveStudyId(id);
      setStage("results");
    } catch (err) {
      setStage("input");
      setNotice({
        title: "Could not open the study",
        message:
          err instanceof Error
            ? err.message
            : "Could not load this study. Make sure the backend is running.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    const deletedId = await history.confirmDelete();
    if (deletedId != null && deletedId === activeStudyId) {
      resetForm();
    }
  };

  const activeResults = activeStudyId != null ? history.getCachedResults(activeStudyId) : null;
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
              <span style={{ fontSize: 18, fontWeight: 500, color: colors.inkText }}>New study</span>
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
              <span style={{ fontSize: 18, fontWeight: 500, color: colors.tabIdleText }}>History</span>
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
            {activeTab === "desenho" && <DesenhoTab onComingSoon={() => openComingSoon("Structure drawing")} />}

            <div style={{ position: "absolute", left: 1225, top: 100, width: 440 }}>
              <span style={{ fontWeight: 400, fontSize: 18, color: colors.stepDesc, lineHeight: 1.55 }}>
                This tool predicts key ADMET properties while assessing the reliability of each result for better
                decision-making. Currently focused on logS, our Machine Learning platform estimates solubility and
                clearly shows how much you can trust the numbers, automatically flagging compounds that fall outside
                the applicability domain. Here is how to get started:
              </span>
            </div>

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

        {stage === "opening" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Spinner size={32} color={colors.tabIdleText} />
            <span style={{ fontSize: 18, color: colors.tabIdleText }}>Opening study...</span>
          </div>
        )}

        {stage === "results" && activeResults && (
          <ResultsDashboard
            studyId={activeResults.id}
            results={activeResults.results}
            radarAxes={activeResults.radarAxes}
            radarRanges={activeResults.radarRanges}
            onMoleculesDeleted={history.applyStudyUpdate}
            onError={(message) => setNotice({ title: "Something went wrong", message })}
          />
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
