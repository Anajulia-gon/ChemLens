import type { Molecule } from "@/types/molecule";

export interface PredictionRequest {
  molecules: Pick<Molecule, "smiles" | "name">[];
}

// Ainda não há contrato definido com o pipeline de ML (ver pipeline.py na raiz do
// projeto). Quando a API estiver pronta, troque o corpo desta função pela chamada
// real — os componentes já importam e podem chamar `submitMoleculesForPrediction`,
// só não fazem isso ainda.
export async function submitMoleculesForPrediction(
  request: PredictionRequest
): Promise<never> {
  throw new Error(
    `Envio para predição ainda não implementado (${request.molecules.length} molécula(s) prontas para envio).`
  );
}
