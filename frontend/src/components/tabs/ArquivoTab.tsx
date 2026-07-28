"use client";

import { useRef, useState } from "react";
import { colors } from "@/lib/theme";
import { CsvFileIcon, UploadCloudIcon, XIcon } from "../icons";
import type { FileStage } from "../HomeScreen";

interface ArquivoTabProps {
  fileStage: FileStage;
  fileName: string;
  onFileSelected: (file: File) => void;
  onClearFile: () => void;
  onSubmit: () => void;
}

const ACCEPTED_EXTENSIONS = [".csv", ".sdf"];

export function ArquivoTab({ fileStage, fileName, onFileSelected, onClearFile, onSubmit }: ArquivoTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const isAccepted = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAccepted) return;
    onFileSelected(file);
  };

  const handleEnviar = () => {
    if (fileStage === "done") onSubmit();
    else openFilePicker();
  };

  const isIdle = fileStage !== "done";
  const isDone = fileStage === "done";

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.sdf"
        style={{ display: "none" }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          position: "absolute",
          left: 180,
          top: 376,
          width: 626,
          height: 230,
          borderRadius: 16,
          background: colors.dropZoneOuter,
          padding: 10,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 11,
            background: colors.dropZoneInner,
            outline: `1.5px dashed ${isDragOver ? colors.dropZoneActiveOutline : colors.dropZoneOutline}`,
            outlineOffset: -2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          {isIdle && (
            <>
              <UploadCloudIcon size={34} color={colors.dropZoneText} />
              <span style={{ fontWeight: 500, fontSize: 14, color: colors.dropZoneText }}>
                Drag a .csv or .sdf file here
              </span>
              <div
                onClick={openFilePicker}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                style={{
                  height: 38,
                  borderRadius: 9,
                  background: colors.ink,
                  display: "flex",
                  padding: "0 18px",
                  gap: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "opacity .15s",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 14, color: colors.white }}>Add file</span>
              </div>
            </>
          )}
          {isDone && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <CsvFileIcon size={52} />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: colors.fileName,
                  maxWidth: 520,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fileName}
              </span>
              <div
                onClick={onClearFile}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <XIcon size={14} color={colors.fileRemoveText} strokeWidth={1.8} />
                <span style={{ fontSize: 14, color: colors.fileRemoveText }}>Remove</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        onClick={handleEnviar}
        onMouseEnter={(e) => (e.currentTarget.style.background = colors.secondarySendHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = colors.secondarySend)}
        style={{
          position: "absolute",
          left: 606,
          top: 626,
          width: 200,
          height: 56,
          borderRadius: 12,
          background: colors.secondarySend,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          transition: "background .15s",
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 18, color: colors.secondarySendText }}>Submit</span>
      </div>
    </div>
  );
}
