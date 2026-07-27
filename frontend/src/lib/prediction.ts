import { requestPrediction } from "@/lib/api";
import type { Molecule } from "@/types/molecule";
import type { PredictionResponse } from "@/types/prediction";

export interface PredictionRequest {
  molecules: Molecule[];
}

export async function submitMoleculesForPrediction(
  request: PredictionRequest
): Promise<PredictionResponse> {
  return requestPrediction(request.molecules);
}
