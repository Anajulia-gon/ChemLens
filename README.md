# 🔬 ChemLens

Web platform for aqueous solubility (LogS) prediction with Uncertainty
Quantification (UQ) 📊, built for pharmacists and medicinal chemists to
screen and prioritize drug candidate compounds 💊.

## 🧪 What the project does

Aqueous solubility is a core physicochemical property for drug
bioavailability, but Machine Learning models for ADMET properties often
suffer from distribution shifts (*data shifts*) when applied to real
molecules outside their training domain — which makes it risky ⚠️ to blindly
trust a single point prediction.

ChemLens tackles this by delivering, for every molecule, not just the
predicted LogS value, but also an estimated error margin and a reliability
verdict (🟢 High Confidence / 🟡 Review Suggested / 🔴 Risk Alert), letting
you prioritize compounds without discarding promising candidates out of
excess caution, or advancing problematic molecules.

### 🚀 User flow

1. **📥 Submit molecules** — via pasted SMILES, `.csv`/`.sdf` file upload, or
   interactive structure drawing.
2. **⚙️ Real processing** — molecular descriptor computation (RDKit),
   primary model (stacking + Lasso), error model (Random Forest) and
   conformal margin (90% confidence), with genuine progress reported by the
   backend at every stage.
3. **📋 Results and reliability** — table with LogS, LogP, molecular weight
   and reliability status per molecule.
4. **🔍 Per-molecule details** — 2D structure, physicochemical property radar
   against pharmacological reference ranges (Lipinski/Veber/Ghose),
   uncertainty interval and structural alerts (PAINS, Brenk, toxic atoms,
   leadlikeness rules) ⚗️.

📄 See [Briefing.md](Briefing.md) for the full requirements gathering
document (objective, scenario, functional and non-functional requirements).

## 🏗️ Architecture

- **📚 `pipeline.py` / `toolsinterface.py`** — reference implementation, run
  **directly** by the API (via `backend/reference_model.py`) together with
  the externally-trained model artifacts (`model_external_run_1.joblib`,
  `scaler_external_run_1.joblib`, `modelo_rf_159rdkit.joblib`), which must
  live in the repo root alongside these two files.
- **🖥️ `frontend/`** — Next.js (App Router) + TypeScript. Full web
  interface: molecule input, real-time pipeline tracking, results dashboard
  and study history.
- **⚡ `backend/`** — Python API (FastAPI). Runs the actual prediction
  pipeline and streams progress via NDJSON. See
  [backend/README.md](backend/README.md) for setup details, endpoints and
  internal structure.

## ▶️ How to run the system

Prerequisites: 🐍 Python 3.11 (the trained model artifacts require
`scikit-learn==1.7.1`, only available from Python 3.10+ — see
[backend/README.md](backend/README.md)) and 🟩 Node.js 20+.

### 1️⃣ Backend (prediction API)

```bash
cd backend
python -m venv ../.venv          # if a virtual environment doesn't exist yet
source ../.venv/bin/activate     # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt

# If backend/models/ doesn't have the trained artifacts yet, generate them:
python train_models.py

uvicorn app:app --port 8000
```

✅ The API runs on `http://localhost:8000` (CORS already open for
`http://localhost:3000`). Main endpoints: `GET /health`, `POST /predict`,
`GET /studies`, `GET /studies/{id}`, `DELETE /studies/{id}`.

### 2️⃣ Frontend (web interface)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

🌐 Open `http://localhost:3000` — the frontend expects the backend running
on `http://localhost:8000`.

### 3️⃣ Usage

🎯 With both services running, open `http://localhost:3000`, submit
molecules via SMILES, `.csv`/`.sdf` or drawing, and follow the prediction in
the results dashboard.
