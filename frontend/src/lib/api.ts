import type { PredictionResponse, StudyMeta } from "@/types/prediction";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface MoleculeInput {
  id: number;
  smiles: string;
  name: string;
}

const BACKEND_UNREACHABLE_MESSAGE =
  `Could not connect to the backend at ${API_BASE_URL}. Make sure it's running ` +
  "(in the backend/ folder: source ../.venv/bin/activate && uvicorn app:app --port 8000).";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    // fetch rejects with a generic TypeError ("Failed to fetch") when the
    // connection is refused — swap it for a message that says what to do.
    throw new Error(BACKEND_UNREACHABLE_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(`Request failed (HTTP ${response.status})`);
  }

  return response.json();
}

export interface PredictProgressEvent {
  stage: string;
  percent: number;
}

/**
 * Calls the Python backend (FastAPI, see /backend) that runs the real
 * pipeline: RDKit descriptors -> primary model -> error model -> conformal
 * interval -> classification/alerts. See backend/train_models.py for how the
 * models were trained. The backend itself already saves the study to disk
 * (backend/studies/<id>.json) — the response already includes id/num/date.
 *
 * The endpoint streams newline-delimited JSON: one `{"type":"progress",...}`
 * line per pipeline stage as it *actually* finishes running server-side
 * (not a client-side timer), then a final `{"type":"done","result":...}`
 * line with the full study. `onProgress` is called for each progress line.
 */
export async function requestPrediction(
  molecules: MoleculeInput[],
  onProgress?: (event: PredictProgressEvent) => void
): Promise<PredictionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ molecules }),
    });
  } catch {
    throw new Error(BACKEND_UNREACHABLE_MESSAGE);
  }

  if (!response.ok || !response.body) {
    throw new Error(`Request failed (HTTP ${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: PredictionResponse | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;

      const event = JSON.parse(line);
      if (event.type === "progress") {
        onProgress?.({ stage: event.stage, percent: event.percent });
      } else if (event.type === "done") {
        result = event.result;
      }
    }
  }

  if (!result) {
    throw new Error("The backend closed the connection before finishing the prediction.");
  }
  return result;
}

/** Lists saved studies (metadata only — no full results). */
export function listStudies(): Promise<StudyMeta[]> {
  return fetchJson<StudyMeta[]>("/studies");
}

/** Loads a full study (molecules, predictions, alerts). */
export function getStudy(id: number): Promise<PredictionResponse> {
  return fetchJson<PredictionResponse>(`/studies/${id}`);
}

/** Deletes a study saved on disk. */
export function deleteStudy(id: number): Promise<void> {
  return fetchJson<void>(`/studies/${id}`, { method: "DELETE" });
}

/** Removes selected molecules from a study, persisting the change on disk. */
export function deleteMolecules(studyId: number, ids: number[]): Promise<PredictionResponse> {
  return fetchJson<PredictionResponse>(`/studies/${studyId}/delete-molecules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}
