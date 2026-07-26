import json
import warnings

# Bibliotecas de Dados
import pandas as pd
import joblib
from joblib import Parallel, delayed
from sklearn.ensemble import RandomForestRegressor
from rdkit import Chem
from rdkit.Chem import Descriptors



# Suas ferramentas locais
from toolsinterface import (
    ConformalPredictorESD,    # Esse é uma classe se voce tiver uma ideia melhor para colocar ela
    calculate_descritors, 
    classify_solubility_dataset,
    generate_chemical_properties_and_warnings,
    calculate_missing_descriptors

)

solubility_limits = {
    -2.0: "High Solubility",
    -4.0: "Slightly Soluble",
    -float('inf'): "Low Solubility"   # Practically insoluble
}
colunas_descritores = json.load(open('descritores_finais_159.json', 'r'))


descritores_tooltips = {
    "MW": "Molecular weight of the compound. Optimal: 100~500",
    "nRig": "Number of rigid bonds in the molecule. Optimal: 0~30",
    "FCharge": "Total formal charge of the molecule. Optimal: -2~2",
    "nHet": "Number of heteroatoms (non-carbon, non-hydrogen atoms). Optimal: 1~15",
    "MaxRing": "Number of atoms in the biggest ring. Optimal: 0~18",
    "nRing": "Total number of rings in the molecule. Optimal: 0~6",
    "nRot": "Number of rotatable bonds. Optimal: 0~10",
    "TPSA": "Topological polar surface area. Optimal: 0~140",
    "nHD": "Number of hydrogen bond donors (NH and OH groups). Optimal: 0~5",
    "nHA": "Number of hydrogen bond acceptors. Optimal: 0~12",
    "LogP": "Octanol-water partition coefficient (lipophilicity). Optimal: 0~5"
}

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

modelo_erro     = joblib.load('modelo_rf_159rdkit.joblib')
scaler_carregado = joblib.load('scaler_159rdkiy.joblib')

# ==========================================
# Primer model predition 
# ==========================================
# Aqui eu queria rodar mais rapido por isso eu tentei calcular os descritores mas se voce tiver uma estratégia melhor
res_rdkit_2D_test = Parallel(n_jobs=-1, verbose=5)(
    delayed(calculate_descritors)(smi) for smi in smiles_list_test
)

df_DrugBank_rdkit_2D = pd.DataFrame(res_rdkit_2D_test, columns =colunas_descritores )
# 2. Aplicar a transformação do Scaler carregado
X_DrugBank_scaled = Scaler.transform(df_DrugBank_rdkit_2D)

# 3. Fazer as predições com o modelo carregado
previsoes = Regressionmodel.predict(X_DrugBank_scaled)


# 4. Adicionar as previsões de volta ao DataFrame original para fácil visualização e análise
DrugBank['LogS_pred'] = previsoes
df_DrugBank_rdkit_2D['Absolute_Error'] = (DrugBank['LogS_pred'] - DrugBank['LogS(mol/L)']).abs()

# =====================================================================
# Calculando incerteza
# =====================================================================
X_error = df_DrugBank_rdkit_2D.drop(columns=['Absolute_Error']).copy()
y_error = df_DrugBank_rdkit_2D['Absolute_Error']

X_error_scaled = scaler_carregado.fit_transform(X_error)

# Prever a incerteza apenas para os compostos novos (Teste)
incerteza_predita = modelo_erro.predict(X_error)
DrugBank['Incerteza'] = incerteza_predita

# =====================================================================
# Intervalos
# =====================================================================

# 1. FASE DE LABORATÓRIO (Treinamento e Calibração)
# Dados fictícios do conjunto de calibração
y_cal_true = df_calibracao['LogS(mol/L)'].values
y_cal_pred = df_calibracao['LogS_pred'].values
q_e_cal = df_calibracao['Incerteza'].values

# Instanciamos a classe com 90% de confiança
cp = ConformalPredictorESD(confidence=0.90)

# Calibramos o modelo (ele vai calcular e guardar o valor "q")
cp.calibrate(y_cal_true, y_cal_pred, q_e_cal)

y_test_pred = DrugBank['LogS_pred'].values
q_e_test = DrugBank['Incerteza'].values 

# 3. Calcule os intervalos para TODAS as moléculas de uma única vez
limite_inf_teste, limite_sup_teste = cp.predict_interval(y_test_pred, q_e_test)

# 4. (Opcional, mas recomendado) Adicione esses limites de volta no seu df_teste 
# para você conseguir ver a tabela completinha:
DrugBank['Limite_Inferior_CP'] = limite_inf_teste
DrugBank['Limite_Superior_CP'] = limite_sup_teste


# 1. Calculando a margem de incerteza (metade da distância entre os limites)
DrugBank['Margem_CP'] = (DrugBank['Limite_Superior_CP'] - DrugBank['Limite_Inferior_CP']) / 2

# =====================================================================
# FLAGS  
# =====================================================================

from joblib import Parallel, delayed
print("\n4/3 - Calculando Descritores Faltantes (nHA, fChar, MaxRing, nRig)...")
res_custom_test = Parallel(n_jobs=-1, verbose=5)(
    delayed(calculate_missing_descriptors)(smi) for smi in smiles_list_test
)   #nHA, fChar, MaxRing, nRig

# Como a função retorna uma lista de dicionários, o Pandas mapeia as chaves para colunas automaticamente
df_custom_test = pd.DataFrame(res_custom_test)

DrugBank["MW"] = df_DrugBank_rdkit_2D["MolWt"] # Molecular Weight
DrugBank["nRig"] = df_custom_test["nRig"] # Rigid Bonds (mantido)
DrugBank["FCharge"] = df_custom_test["fChar"] # Formal Charge
DrugBank["nHet"] = df_DrugBank_rdkit_2D["NumHeteroatoms"] # Heteroatoms
DrugBank["MaxRing"] = df_custom_test["MaxRing"] # Max Ring Size (mantido)
DrugBank["nRing"] = df_DrugBank_rdkit_2D["RingCount"] # Ring Count
DrugBank["nRot"] = df_DrugBank_rdkit_2D["NumRotatableBonds"] # Rotatable Bonds
DrugBank["TPSA"] = df_DrugBank_rdkit_2D["TPSA"] # TPSA (mantido, já é padrão)
DrugBank["nHD"] = df_DrugBank_rdkit_2D["NHOHCount"] # H-Bond Donors
DrugBank["nHA"] = df_custom_test["nHA"] # H-Bond Acceptors (mantido)
DrugBank["LogP"] = df_DrugBank_rdkit_2D["MolLogP"] # LogP


# tp achanndo que essa parte esta demorando um pouco demias
novas_colunas = DrugBank['SMILES'].apply(generate_chemical_properties_and_warnings)
DrugBank = classify_solubility_dataset(DrugBank, solubility_limits)


# Configurar os limties superiores e inferiores do grafioc radar
limites_descritores_farmaco = {
    "MolWt":      {"limite_inferior": 150.0, "limite_superior": 500.0}, # Peso Molecular (Lipinski/Ghose)
    "nRig":    {"limite_inferior": 0.0,   "limite_superior": 30.0},  # Número de ligações rígidas
    "fChar":   {"limite_inferior": -2.0,  "limite_superior": 2.0},   # Carga formal (geralmente neutra ou íons simples)
    "NumHeteroatoms":    {"limite_inferior": 1.0,   "limite_superior": 15.0},  # Heteroátomos (Ghose filter base)
    "MaxRing": {"limite_inferior": 0.0,   "limite_superior": 8.0},   # Tamanho máximo de anel (evitar macrociclos p/ via oral)
    "RingCount":   {"limite_inferior": 0.0,   "limite_superior": 6.0},   # Quantidade de anéis
    "NumRotatableBonds":    {"limite_inferior": 0.0,   "limite_superior": 10.0},  # Ligações rotativas (Veber)
    "TPSA":    {"limite_inferior": 0.0,   "limite_superior": 140.0}, # Área Polar de Superfície Topológica (Veber)
    "NHOHCount":     {"limite_inferior": 0.0,   "limite_superior": 5.0},   # Doadores de Ligação de H (Lipinski)
    "nHA":     {"limite_inferior": 0.0,   "limite_superior": 10.0},  # Aceitadores de Ligação de H (Lipinski)
    "logS":    {"limite_inferior": -6.0,  "limite_superior": -1.0},  # Solubilidade (log mols/L) - Evitar insolúveis (< -6)
    "MolLogP":    {"limite_inferior": -0.4,  "limite_superior": 5.0}    # Coeficiente de partição (Lipinski/Ghose)
}


