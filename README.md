# 🔬 ChemLens

Plataforma web para predição de solubilidade aquosa (LogS) com Quantificação
de Incerteza (UQ) 📊, voltada a farmacêuticos e químicos medicinais para
triagem e priorização de compostos candidatos a medicamentos 💊.

## 🧪 O que o projeto faz

A solubilidade aquosa é uma propriedade físico-química central na
biodisponibilidade de fármacos, mas modelos de Machine Learning para
propriedades ADMET costumam sofrer com mudanças de distribuição (*data
shifts*) quando aplicados a moléculas reais fora do seu domínio de
treinamento — o que torna arriscado ⚠️ confiar cegamente em uma predição
pontual.

O ChemLens ataca esse problema entregando, para cada molécula, não só o valor
de LogS previsto, mas também uma margem de erro estimada e um veredito de
confiabilidade (🟢 Alta Confiança / 🟡 Revisão Sugerida / 🔴 Alerta de Risco),
permitindo priorizar compostos sem descartar candidatos promissores por
excesso de cautela nem avançar com moléculas problemáticas.

### 🚀 Fluxo do usuário

1. **📥 Enviar moléculas** — via SMILES colado, upload de arquivo
   `.csv`/`.sdf` ou desenho estrutural interativo.
2. **⚙️ Processamento real** — cálculo de descritores moleculares (RDKit),
   modelo primário (stacking + Lasso), modelo de erro (Random Forest) e
   margem conformal (90% de confiança), com progresso genuíno reportado pelo
   backend em cada etapa.
3. **📋 Resultados e confiabilidade** — tabela com LogS, LogP, peso molecular
   e status de confiabilidade por molécula.
4. **🔍 Detalhes por molécula** — estrutura 2D, radar de propriedades
   físico-químicas contra faixas farmacológicas de referência
   (Lipinski/Veber/Ghose), intervalo de incerteza e alertas estruturais
   (PAINS, Brenk, átomos tóxicos, regras de leadlikeness) ⚗️.

## 🏗️ Arquitetura

- **📚 `pipeline.py` / `toolsinterface.py`** — script de referência
  standalone (fora da API) com a mesma lógica de cálculo de descritores e
  classificação, usado como base/validação do que está implementado em
  `backend/`.
- **🖥️ `frontend/`** — Next.js (App Router) + TypeScript. Interface web
  completa: input de moléculas, acompanhamento do pipeline em tempo real,
  dashboard de resultados e histórico de estudos.
- **⚡ `backend/`** — API Python (FastAPI). Roda o pipeline real de predição
  e streama o progresso via NDJSON. Veja
  [backend/README.md](backend/README.md) para detalhes de setup, endpoints e
  estrutura interna.

## ▶️ Como executar o sistema

Pré-requisitos: 🐍 Python 3.10+ e 🟩 Node.js 20+.

### 1️⃣ Backend (API de predição)

```bash
cd backend
python -m venv ../.venv          # se ainda não existir um ambiente virtual
source ../.venv/bin/activate     # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt

# Se backend/models/ ainda não tiver os artefatos treinados, gere-os:
python train_models.py

uvicorn app:app --port 8000
```

✅ A API sobe em `http://localhost:8000` (CORS já liberado para
`http://localhost:3000`). Endpoints principais: `GET /health`,
`POST /predict`, `GET /studies`, `GET /studies/{id}`, `DELETE /studies/{id}`.

### 2️⃣ Frontend (interface web)

Em um segundo terminal:

```bash
cd frontend
npm install
npm run dev
```

🌐 Acesse `http://localhost:3000` — o frontend espera o backend rodando em
`http://localhost:8000`.

### 3️⃣ Uso

🎯 Com os dois serviços no ar, abra `http://localhost:3000`, envie moléculas
por SMILES, `.csv`/`.sdf` ou desenho, e acompanhe a predição no dashboard de
resultados.
