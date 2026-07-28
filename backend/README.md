# Backend de predição (SolvUQ)

API Python (FastAPI) que roda o pipeline real de predição de solubilidade
aquosa + quantificação de incerteza, chamada pelo frontend ao clicar em
"Enviar para predição".

## Importante: sobre o modelo

`pipeline.py`/`toolsinterface.py` (na raiz do repo) descrevem o pipeline de
referência, mas carregam artefatos treinados (`model_external_run_1.joblib`,
`modelo_rf_159rdkit.joblib`, `descritores_finais_159.json`, um CSV de
calibração e o dataset DrugBank) que **não existem neste repositório** — o
treino original foi feito em outro ambiente.

Para termos uma predição real (não uma simulação com números inventados),
`train_models.py` treina, do zero, artefatos com a mesma arquitetura usando o
dataset público **ESOL/Delaney** (1128 moléculas com solubilidade medida
experimentalmente — benchmark padrão da literatura). Métricas do último
treino ficam em `models/training_report.json`.

Quando os artefatos originais estiverem disponíveis, basta trocá-los pelos
seus em `models/` (mesmos nomes de arquivo) — o resto do pipeline não muda.

## Setup

```bash
source ../.venv/bin/activate   # ambiente virtual já existe na raiz do repo
pip install -r requirements.txt
```

## Treinar (gera os artefatos em models/)

```bash
python train_models.py
```

## Rodar a API

```bash
uvicorn app:app --port 8000
```

Endpoints: `GET /health`, `POST /predict`, `GET /studies`, `GET /studies/{id}`,
`DELETE /studies/{id}` (ver `app.py`). CORS liberado para `http://localhost:3000`
(o frontend Next.js).

## Persistência dos estudos

Cada `POST /predict` já salva o resultado em `studies/<id>.json` (um arquivo
por estudo — ver `storage.py`). O frontend carrega a lista automaticamente ao
abrir (`GET /studies`), busca o estudo completo só quando reaberto
(`GET /studies/{id}`), e apaga de verdade com `DELETE /studies/{id}`. Não é
mais preciso reprocessar nada ao reabrir o app — os dados sobrevivem a
recarregar a página. `studies/` não é versionado (é dado do usuário, não
código).

## Estrutura

- `domain.py` — constantes (classes de solubilidade, faixas de referência do radar).
- `descriptors.py` — cálculo de descritores RDKit.
- `chemistry.py` — alertas PAINS/Brenk, átomos tóxicos, regras de leadlikeness.
- `conformal.py` — `ConformalPredictorESD` (portado de toolsinterface.py).
- `classification.py` — classificação de solubilidade + alerta de confiabilidade.
- `novelty.py` — detecta se o SMILES é "inédito" (fora do dataset de treino/`models/known_smiles.json`).
- `storage.py` — salva/lista/carrega/apaga estudos em `studies/*.json`.
- `train_models.py` — treina e salva os artefatos em `models/`.
- `app.py` — API FastAPI.
