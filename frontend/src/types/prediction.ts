export interface MoleculeAlert {
  key: string;
  val: string;
}

export interface MoleculeDescriptors {
  [key: string]: number;
  MolWt: number;
  nRig: number;
  fChar: number;
  NumHeteroatoms: number;
  MaxRing: number;
  RingCount: number;
  NumRotatableBonds: number;
  TPSA: number;
  NHOHCount: number;
  nHA: number;
  MolLogP: number;
  logS: number;
}

export type ReliabilityStatus = "High Confidence" | "Review Suggested" | "Risk Alert";

export interface MoleculeResult {
  id: number;
  smiles: string;
  name: string;
  logS: number;
  margin: number;
  lowerBound: number;
  upperBound: number;
  status: ReliabilityStatus;
  predictedClass: string;
  predictedClassLabel: string;
  descriptors: MoleculeDescriptors;
  alerts: MoleculeAlert[];
}

export interface InvalidMolecule {
  id: number;
  smiles: string;
  name?: string | null;
  reason: string;
}

export interface RadarRange {
  min: number;
  max: number;
}

export interface PredictionResponse {
  results: MoleculeResult[];
  invalid: InvalidMolecule[];
  radarAxes: string[];
  radarRanges: Record<string, RadarRange>;
}
