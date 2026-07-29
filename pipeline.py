import json
import warnings

# Bibliotecas de Dados
import pandas as pd
import joblib
from joblib import Parallel, delayed
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from rdkit import Chem
from rdkit.Chem import Descriptors

# Suas ferramentas locais
from toolsinterface import (
    ConformalPredictorESD,    
    calculate_descritors, 
    generate_chemical_properties_and_warnings,
    classify_solubility_dataset,
    calculate_missing_descriptors
)

solubility_limits = {
    -2.0: "High Solubility",
    -4.0: "Slightly Soluble",
    -float('inf'): "Low Solubility"   # Practically insoluble
}

colunas_descritores = json.load(open('descritores_finais_159.json', 'r'))
# Ignorar avisos
warnings.filterwarnings('ignore')

# ==========================================
# Uploading data 
# ==========================================
df_calibracao = pd.read_csv('colunas_para_calibração.csv')
DrugBank = pd.read_csv('DrugBank_Solubility_Predictions_Full.csv')
smiles_list_test = DrugBank['SMILES'].tolist()

Regressionmodel = joblib.load('model_external_run_1.joblib')
Scaler = joblib.load('scaler_external_run_1.joblib')

modelo_erro     = joblib.load('modelo_rf_159rdkitNOVO.joblib')
scaler_carregado = joblib.load('scaler_159rdkiyNOVO.joblib')

# ==========================================
# Primer model predition 
# ==========================================
res_rdkit_2D_test = Parallel(n_jobs=-1, verbose=5)(
    delayed(calculate_descritors)(smi) for smi in smiles_list_test
)

df_DrugBank_rdkit_2D = pd.DataFrame(res_rdkit_2D_test, columns=colunas_descritores)

# 2. Aplicar a transformação do Scaler carregado
X_DrugBank_scaled = Scaler.transform(df_DrugBank_rdkit_2D)

# 3. Fazer as predições com o modelo carregado
previsoes = Regressionmodel.predict(X_DrugBank_scaled)

# 4. Adicionar as previsões de volta ao DataFrame original
DrugBank['LogS_pred'] = previsoes
df_DrugBank_rdkit_2D['Absolute_Error'] = (DrugBank['LogS_pred'] - DrugBank['LogS(mol/L)']).abs()

# =====================================================================
# Calculando incerteza (CORRIGIDO)
# =====================================================================
X_error = df_DrugBank_rdkit_2D.drop(columns=['Absolute_Error']).copy()
y_error = df_DrugBank_rdkit_2D['Absolute_Error']

# CORREÇÃO 1: Usar .transform() em vez de .fit_transform() no conjunto de teste
X_error_scaled = scaler_carregado.transform(X_error)

# CORREÇÃO 2: Passar os dados escalonados (X_error_scaled) para o predict, não o X_error bruto
incerteza_predita = modelo_erro.predict(X_error_scaled)
DrugBank['Incerteza'] = incerteza_predita

# =====================================================================
# Intervalos
# =====================================================================

# 1. FASE DE LABORATÓRIO (Treinamento e Calibração)
y_cal_true = df_calibracao['LogS(mol/L)'].values
y_cal_pred = df_calibracao['LogS_pred'].values
q_e_cal = df_calibracao['Incerteza'].values

# Instanciamos a classe com 90% de confiança
cp = ConformalPredictorESD(confidence=0.90)

# Calibramos o modelo
cp.calibrate(y_cal_true, y_cal_pred, q_e_cal)

y_test_pred = DrugBank['LogS_pred'].values
q_e_test = DrugBank['Incerteza'].values 

# 3. Calcule os intervalos
limite_inf_teste, limite_sup_teste = cp.predict_interval(y_test_pred, q_e_test)

# 4. Adicione esses limites
DrugBank['Limite_Inferior_CP'] = limite_inf_teste
DrugBank['Limite_Superior_CP'] = limite_sup_teste

# Calculando a margem de incerteza
DrugBank['Margem_CP'] = (DrugBank['Limite_Superior_CP'] - DrugBank['Limite_Inferior_CP']) / 2

# =====================================================================
# FLAGS e Descritores Extras
# =====================================================================

print("\nCalculando Descritores Faltantes (nHA, fChar, MaxRing, nRig)...")
res_custom_test = Parallel(n_jobs=-1, verbose=5)(
    delayed(calculate_missing_descriptors)(smi) for smi in smiles_list_test
) 

df_custom_test = pd.DataFrame(res_custom_test)

DrugBank["MW"] = df_DrugBank_rdkit_2D["MolWt"] 
DrugBank["nRig"] = df_custom_test["nRig"] 
DrugBank["FCharge"] = df_custom_test["fChar"] 
DrugBank["nHet"] = df_DrugBank_rdkit_2D["NumHeteroatoms"] 
DrugBank["MaxRing"] = df_custom_test["MaxRing"] 
DrugBank["nRing"] = df_DrugBank_rdkit_2D["RingCount"] 
DrugBank["nRot"] = df_DrugBank_rdkit_2D["NumRotatableBonds"] 
DrugBank["TPSA"] = df_DrugBank_rdkit_2D["TPSA"] 
DrugBank["nHD"] = df_DrugBank_rdkit_2D["NHOHCount"] 
DrugBank["nHA"] = df_custom_test["nHA"] 
DrugBank["LogP"] = df_DrugBank_rdkit_2D["MolLogP"] 


# CORREÇÃO 3: Paralelizar a função de propriedades e avisos para evitar a lentidão do .apply()
print("\nGerando propriedades químicas e avisos...")
res_warnings = Parallel(n_jobs=-1, verbose=5)(
    delayed(generate_chemical_properties_and_warnings)(smi) for smi in smiles_list_test
)

# Transforma a lista de resultados em DataFrame e junta com o DrugBank
df_warnings = pd.DataFrame(res_warnings)
DrugBank = pd.concat([DrugBank, df_warnings], axis=1)

DrugBank = classify_solubility_dataset(DrugBank, solubility_limits)



