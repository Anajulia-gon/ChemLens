# 🔬 ChemLens

A web-based platform for ADMET property screening, currently specialized in aqueous solubility (LogS), powered by advanced Uncertainty Quantification (UQ)[cite: 4, 5]. Designed to help medicinal chemists and researchers confidently prioritize drug candidates 💊[cite: 4].

## 🧪 What the project does

The pipeline of pre-clinical drug discovery is notoriously expensive and time-consuming, driving the industry to rely on Artificial Intelligence to accelerate chemical screening[cite: 5]. However, a major bottleneck remains: researchers struggle to trust these algorithms[cite: 5]. Because the chemical space is vast and highly complex, standard machine learning models often act as "black boxes"[cite: 1, 5]. When they encounter a novel compound completely outside their training data, they might still output a highly confident (but entirely wrong) prediction, leading to wasted laboratory resources[cite: 5].

ChemLens was built to solve this exact trust barrier[cite: 5]. Rather than simply estimating an ADMET property, our platform runs on a unique **Dual-AI architecture**[cite: 4, 5]. A primary model performs the target prediction, while a completely independent secondary model calculates how reliable that specific prediction actually is[cite: 4, 5].

By providing explicit prediction intervals and flagging high-risk outliers, ChemLens allows scientists to filter out false positives and make data-driven decisions without second-guessing the algorithm[cite: 4, 5]. Looking forward, this robust approach to uncertainty quantification is a foundational stepping stone toward fully automated chemistry labs and autonomous design–make–test–analyze (DMTA) cycles[cite: 5].

## 🧠 Model Architecture & Performance

ChemLens is driven by a highly optimized backend, validated against industry-standard benchmarks to ensure state-of-the-art accuracy and reliability[cite: 5]:

*   **Primary Predictor (Solubility Inference):** The core engine utilizes a Stacking-Lasso regression model trained on 159 continuous RDKit descriptors[cite: 5]. It achieves an outstanding RMSE of **0.909** on the external DrugBank dataset, comfortably outperforming standard literature models that typically score between 1.029 and 1.579[cite: 5]. It also maintains strong generalization with an RMSE of **0.801** on the SC2-1 and **1.029** on the SC2-2 datasets[cite: 5].
*   **Auxiliary Error Model (UQ Engine):** To map out generalization limits, a dedicated Error Model is trained to predict the residual errors of the primary network[cite: 4, 5]. It achieves a mean Spearman's rank correlation coefficient (SRCC) of **0.48**, massively outperforming traditional metrics like Euclidean distance to the training set (0.08) or ensemble variance (0.14)[cite: 5]. When evaluating severe distribution shifts, such as salts and zwitterions, its SRCC reaches up to **0.9**, proving its capacity to flag structural outliers effectively[cite: 5].

📂 **[Click here to access the detailed Training, Cross-Validation, and Performance Results folder](./training_results)**

## 🚀 User flow

Engineered for high-throughput screening, the ChemLens backend processes up to **30 molecules per second**[cite: 5], turning complex dual-inference calculations into a seamless user experience:

1. **📥 Submit Molecules** — Users can input data by pasting SMILES strings, uploading bulk `.csv`/`.sdf` files, or sketching molecules directly via the interactive drawing tool[cite: 4].
2. **⚙️ Dual-AI Inner Workings** — Once submitted, the system instantly executes the following pipeline[cite: 4]:
   * *Continuous Descriptor Calculation* (extracting 159 physicochemical features via RDKit)[cite: 4].
   * *Primary Model Inference* (generating the baseline LogS prediction)[cite: 4].
   * *Error Model Inference* (calculating the expected residual error)[cite: 4].
   * *Prediction Intervals & Error Classification* (defining the confidence boundaries)[cite: 4].
3. **📋 Molecular Screening Results** — The interface generates a comprehensive, filterable table displaying key metrics for all submitted molecules, including Molecular Weight, LogP, and the predicted LogS coupled with its explicit $\pm$ error margin (color-coded for quick triage).
4. **🔍 Deep-Dive Molecule Details** — Selecting a specific candidate reveals a detailed profile containing:
   * **2D Structure & Physicochemical Properties:** A visual rendering of the molecule alongside an extensive table of calculated descriptors (e.g., MW, TPSA, nRot, nRing, FCharge).
   * **Property Radar Chart:** A visual comparison mapping the compound's specific properties against established pharmacological upper and lower limits.
   * **Reliability Assessment Module:** A dedicated LogS card displaying the predicted value and its Class Range (e.g., High Solubility). It features a dynamic gradient bar that maps the explicit prediction bounds (e.g., -0.17 to 1.61) across solubility classes, providing an automated textual verdict (e.g., "HIGH PREDICTIVE RELIABILITY") that explains exactly how the error margin impacts biological assay expectations.


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
