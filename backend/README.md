# Backend de predição (SolvUQ)

API Python (FastAPI) que roda o pipeline real de predição de solubilidade
aquosa + quantificação de incerteza, chamada pelo frontend ao clicar em
"Enviar para predição".

## Importante: sobre o modelo

A API roda `pipeline.py`/`toolsinterface.py` (na raiz do repo) **diretamente**
via `reference_model.py` — mesmas funções (`calculate_descritors`,
`calculate_missing_descriptors`, `generate_chemical_properties_and_warnings`,
`ConformalPredictorESD`) e mesmos artefatos treinados externamente
(`model_external_run_1.joblib`, `scaler_external_run_1.joblib`,
`modelo_rf_159rdkit.joblib`), que devem estar na raiz do repo, na mesma pasta
que `pipeline.py`/`toolsinterface.py`. `toolsinterface.py`/`pipeline.py`
**não são modificados** — `reference_model.py` contorna, por fora, dois
problemas do ambiente original:

- `descritores_finais_159.json` (lista ordenada dos 159 descritores RDKit
  usados no treino) não existe no repositório — foi reconstruída a partir de
  `scaler_159rdkiy.joblib.feature_names_in_` (o scaler do modelo de erro foi
  o único artefato que preservou os nomes das colunas de treino).
- `colunas_para_calibração.csv` (dataset de calibração do preditor conformal)
  também não existe — é gerado a partir do dataset público **ESOL/Delaney**
  (1128 moléculas com solubilidade medida experimentalmente) na primeira
  execução e cacheado na raiz do repo para as próximas.

`train_models.py`/`descriptors.py`/`chemistry.py`/`conformal.py` continuam no
repositório como caminho alternativo (treina artefatos próprios do zero) mas
não são mais usados pela API enquanto os artefatos externos acima existirem.

**Importante sobre a versão do scikit-learn**: os joblib externos foram
serializados com `scikit-learn==1.7.1`. Rodar com uma versão diferente (ex.:
1.6.1, a mais recente disponível para Python 3.9) muda o valor de LogS
previsto — testado e confirmado: a mesma molécula deu -1.94 com sklearn 1.6.1
e -2.70 (correto) com 1.7.1. **scikit-learn 1.7.1 exige Python 3.10+** — por
isso o venv do projeto usa **Python 3.11**. O RDKit não influencia o
resultado (testado com 2023.3.3/2025.9.2/2026.3.4, descritores idênticos),
mas fixamos `rdkit==2023.3.3` por ser a versão usada no treino original.
`numpy==1.26.4` também é fixado por ser a versão usada pelo autor original
(além de ser exigência do próprio `rdkit==2023.3.3`, cujo wheel não é
compatível com numpy 2.x).

## Setup

```bash
python3.11 -m venv ../.venv        # precisa ser Python 3.11 (ver acima)
source ../.venv/bin/activate
pip install -r requirements.txt
```

`model_external_run_1.joblib` depende de `xgboost`/`lightgbm` (no
`requirements.txt`). No macOS, o xgboost também precisa do OpenMP do sistema:

```bash
brew install libomp
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

- `reference_model.py` — carrega e chama `pipeline.py`/`toolsinterface.py` (raiz do repo) diretamente: descritores, modelo primário, modelo de erro, calibração conformal.
- `domain.py` — constantes (classes de solubilidade, faixas de referência do radar).
- `classification.py` — classificação de solubilidade + alerta de confiabilidade (porte per-molécula de `toolsinterface.py::classify_solubility_dataset`).
- `novelty.py` — detecta se o SMILES é "inédito" (fora do dataset de treino/`models/known_smiles.json`).
- `storage.py` — salva/lista/carrega/apaga estudos em `studies/*.json`.
- `app.py` — API FastAPI.
- `descriptors.py` / `chemistry.py` / `conformal.py` / `train_models.py` — caminho alternativo (treina artefatos próprios do zero com o dataset ESOL/Delaney); não usados enquanto os artefatos externos em `../` existirem.
