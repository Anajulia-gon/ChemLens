"""
Constantes de domínio compartilhadas entre o treino e a API de predição.

`SOLUBILITY_LIMITS` e `RADAR_REFERENCE_RANGES` vêm diretamente de pipeline.py
(o pipeline original de referência) — são os limites reais usados pelo
algoritmo, não valores inventados para a UI.
"""

# Classificação de solubilidade em 3 classes a partir do LogS previsto.
# Mesmos limiares de pipeline.py (chaves = limite inferior da faixa).
SOLUBILITY_LIMITS = {
    -2.0: "High Solubility",
    -4.0: "Slightly Soluble",
    float("-inf"): "Low Solubility",
}

SOLUBILITY_LABELS_EN = {
    "High Solubility": "Highly soluble",
    "Slightly Soluble": "Slightly soluble",
    "Low Solubility": "Poorly soluble",
}

# Faixas de referência físico-química (Lipinski/Veber/Ghose) usadas para
# normalizar o gráfico radar — vêm de `limites_descritores_farmaco` em
# pipeline.py. Note que usar essas faixas fixas (em vez de min/max do lote,
# como fazia o mock do Claude Design) é a principal correção pedida: o radar
# deve refletir limiares farmacológicos reais, não a variação arbitrária do
# lote de moléculas enviado.
RADAR_REFERENCE_RANGES = {
    "MolWt": (150.0, 500.0),
    "nRig": (0.0, 30.0),
    "fChar": (-2.0, 2.0),
    "NumHeteroatoms": (1.0, 15.0),
    "MaxRing": (0.0, 8.0),
    "RingCount": (0.0, 6.0),
    "NumRotatableBonds": (0.0, 10.0),
    "TPSA": (0.0, 140.0),
    "NHOHCount": (0.0, 5.0),
    "nHA": (0.0, 10.0),
    "logS": (-6.0, -1.0),
    "MolLogP": (-0.4, 5.0),
}

# Ordem de exibição dos eixos do radar (mesmo conjunto de pipeline.py, na
# mesma ordem declarada em `limites_descritores_farmaco`).
RADAR_AXES = list(RADAR_REFERENCE_RANGES.keys())

TOXIC_ATOMS = {"Pb", "Hg", "Cd", "As", "Tl", "Sb"}

CONFORMAL_CONFIDENCE = 0.90
