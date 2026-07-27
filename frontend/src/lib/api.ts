import type { PredictionResponse } from "@/types/prediction";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface MoleculeInput {
  id: number;
  smiles: string;
  name: string;
}

/**
 * Chama o backend Python (FastAPI, ver /backend) que roda o pipeline real:
 * descritores RDKit -> modelo primário -> modelo de erro -> intervalo
 * conformal -> classificação/alertas. Ver backend/train_models.py para como
 * os modelos foram treinados.
 */
const BACKEND_UNREACHABLE_MESSAGE =
  `Não foi possível conectar ao backend em ${API_BASE_URL}. Verifique se ele está rodando ` +
  "(na pasta backend/: source ../.venv/bin/activate && uvicorn app:app --port 8000).";

export async function requestPrediction(molecules: MoleculeInput[]): Promise<PredictionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ molecules }),
    });
  } catch {
    // fetch rejeita com um TypeError genérico ("Failed to fetch") quando a
    // conexão é recusada — trocamos por uma mensagem que diz o que fazer.
    throw new Error(BACKEND_UNREACHABLE_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(`Falha ao rodar a predição (HTTP ${response.status})`);
  }

  return response.json();
}
