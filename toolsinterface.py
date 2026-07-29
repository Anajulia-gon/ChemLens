import json
import warnings

# Bibliotecas de Dados
import pandas as pd
import numpy as np
import joblib
from joblib import Parallel, delayed
from sklearn.ensemble import RandomForestRegressor

# Bibliotecas RDKit (Atualizadas)
from rdkit import Chem
from rdkit.Chem import Descriptors
from rdkit.Chem import Lipinski          
from rdkit.Chem import rdMolDescriptors  
from rdkit.ML.Descriptors import MoleculeDescriptors


# =====================================================================
# Calculating descriptors  
# =====================================================================

def calculate_missing_descriptors(smi):
    """
    Calcula nHA, fChar, MaxRing e nRig. 
    Retorna None em caso de falha para manter o alinhamento das linhas (axis=0).
    """
    try:
        mol = Chem.MolFromSmiles(smi)
        if mol is None:
            return {"nHA": None, "fChar": None, "MaxRing": None, "nRig": None}

        # nHA (Aceitadores de Ligação de H)
        nHA = Lipinski.NumHAcceptors(mol)

        # fChar (Carga Formal)
        fChar = Chem.GetFormalCharge(mol)

        # MaxRing (Tamanho máximo de anel)
        informacoes_aneis = mol.GetRingInfo().AtomRings()
        MaxRing = max(len(anel) for anel in informacoes_aneis) if informacoes_aneis else 0

        # nRig (Número de Ligações Rígidas)
        total_ligacoes = mol.GetNumBonds()
        ligacoes_rotacionaveis = rdMolDescriptors.CalcNumRotatableBonds(mol)
        nRig = total_ligacoes - ligacoes_rotacionaveis

        return {"nHA": nHA, "fChar": fChar, "MaxRing": MaxRing, "nRig": nRig}
        
    except Exception:
        # Evita que o Parallel quebre caso ocorra um erro interno no RDKit
        return {"nHA": None, "fChar": None, "MaxRing": None, "nRig": None}

with open('descritores_finais_159.json', 'r') as file:
    descriptor_names = json.load(file)
calculator = MoleculeDescriptors.MolecularDescriptorCalculator(descriptor_names)
def calculate_descritors(smiles):
    mol = Chem.MolFromSmiles(str(smiles))
    
    if mol is None:
        return [np.nan] * len(descriptor_names)
    
    try:
        Chem.SanitizeMol(mol)
        AllChem.ComputeGasteigerCharges(mol)
    except Exception:
        pass 
    
    try:
        # Agora o calculator vai gerar e retornar exatamente 159 valores
        return list(calculator.CalcDescriptors(mol))
    except Exception:
        return [np.nan] * len(descriptor_names)

# =====================================================================
# Conformal predictor  
# =====================================================================
class ConformalPredictorESD:
    def __init__(self, confidence=0.90):
        """
        Inicializa o preditor conformal.
        
        Parâmetros:
        confidence (float): Nível de confiança desejado (padrão é 0.90).
        """
        self.confidence = confidence
        self.q = None # Aqui guardaremos o valor do quantil calibrado
        self.is_calibrated = False

    def calibrate(self, y_cal_true, y_cal_pred, q_e_cal):
        """
        Calcula e armazena o escore de não-conformidade (quantil q) usando 
        o conjunto de calibração. Só precisa ser rodado uma vez.
        """
        # 1. Calcular os escores de não-conformidade (alpha) para o conjunto de calibração
        alpha_cal = np.abs(y_cal_true - y_cal_pred) / np.exp(np.sqrt(q_e_cal))
        
        # 2. Encontrar o quantil empírico (q)
        n = len(alpha_cal)
        q_level = min((n + 1.0) / n * self.confidence, 1.0) 
        self.q = np.quantile(alpha_cal, q_level)
        self.is_calibrated = True
        
        print(f"Modelo calibrado com sucesso! Quantil (q) armazenado: {self.q:.4f}")

    def predict_interval(self, y_test_pred, q_e_test):
        """
        Calcula os limites inferior e superior para novos dados.
        Pode ser usado para uma única molécula ou um array de moléculas.
        """
        if not self.is_calibrated:
            raise ValueError("O modelo precisa ser calibrado antes de fazer predições. Chame o método .calibrate() primeiro.")
            
        # 3. Calcular a margem de incerteza usando o 'q' já armazenado
        margem = self.q * np.exp(np.sqrt(q_e_test))
        
        lower_bound = y_test_pred - margem
        upper_bound = y_test_pred + margem
        
        return lower_bound, upper_bound


# =====================================================================
# FLAGS  
# =====================================================================
def map_logs_class(logs_value, limits_dictionary):
    for limit in sorted(limits_dictionary.keys(), reverse=True):
        if logs_value >= limit:
            return limits_dictionary[limit]
    return None

def classify_solubility_dataset(df, limits_dictionary):
    
    # Using your original input column names to prevent DataFrame mapping errors
    df['Predicted_Class'] = df['LogS_pred'].apply(lambda x: map_logs_class(x, limits_dictionary))
    df['Lower_Limit_Class'] = df['Limite_Inferior_CP'].apply(lambda x: map_logs_class(x, limits_dictionary))
    df['Upper_Limit_Class'] = df['Limite_Superior_CP'].apply(lambda x: map_logs_class(x, limits_dictionary))
    
    # 4. Practical Diagnosis for Bench and Assays
    def generate_status(row):
        pred_class = row['Predicted_Class']
        lower_limit = row['Lower_Limit_Class']
        
 # Scenario 1: Error margin contained within the same zone
        if lower_limit == row['Upper_Class_Temp']:
            alert_name = "HIGH PREDICTIVE RELIABILITY"
            description = (
                f"The AI predicts {row['LogS_pred']:.2f}. The error margin is contained within the same "
                f"solubility class ({pred_class}). The molecule should behave as expected in biological assays."
            )
            # Tag atualizada: Como não muda de classe, exibe apenas a classe com confiança
            class_tag = f"{pred_class}" 
            return alert_name, description, class_tag
            
        # Scenario 2: Error crosses class boundaries
        elif pred_class != lower_limit:
            
           # 2A. Worst-case scenario falls into severe insolubility (Classes 5-6)
            if "Low Solubility" in lower_limit or "Insoluble" in lower_limit:
                alert_name = "INSOLUBILITY RISK"
                description = (
                    f"The AI predicts {row['LogS_pred']:.2f} ({row['Predicted_Class']}), but the error margin "
                    f"reaches the Critical Insolubility zone. Experimental validation is recommended."
                )
                # Tag atualizada: Usa o "to" para o pior cenário
                class_tag = f"{row['Predicted_Class']} to Insoluble"
                return alert_name, description, class_tag
                
            # 2B. Error fluctuates but does not invalidate assays (Classes 0-4)
            else:
                alert_name = "FORMULATION IMPACT"
                description = (
                    f"The AI predicts {row['LogS_pred']:.2f} ({row['Predicted_Class']}) and has an error margin that extends "
                    f"to the '{lower_limit}' class."
                )
                # Tag atualizada: Troca o "-" por "to" para leitura mais fluida
                class_tag = f"{row['Predicted_Class']} to {row['Lower_Limit_Class']}"
                return alert_name, description, class_tag
                
        # Scenario 3: Safety fallback
        else:
            alert_name = "MODERATE PREDICTIVE RELIABILITY"
            description = "The error margin suggests caution in the initial interpretation for biological assays."
            # Tag atualizada: Substitui o "Group B" por uma instrução clara para a UI
            class_tag = f"{row['Predicted_Class']}"
            return alert_name, description, class_tag

    # Temporary column to allow row-wise comparison
    df['Upper_Class_Temp'] = df['Upper_Limit_Class'] 
    
    # Unpacks the return directly into the final columns (now with the 3 variables)
    df['Nome_Alerta'], df['Descricao_Alerta'], df['Tag_Confiabilidade'] = zip(*df.apply(generate_status, axis=1))
    
    df = df.drop(columns=['Upper_Class_Temp'])
    
    return df

def generate_chemical_properties_and_warnings(smiles):
    from rdkit.Chem.FilterCatalog import FilterCatalog, FilterCatalogParams
    params = FilterCatalogParams()
    params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS)
    params.AddCatalog(FilterCatalogParams.FilterCatalogs.BRENK)
    catalog = FilterCatalog(params)
    # Dicionário padrão para garantir que todas as colunas sejam criadas,
    # mesmo se o SMILES for inválido.
    TOXIC_ATOMS = {'Pb', 'Hg', 'Cd', 'As', 'Tl', 'Sb'}
    result = {
        'Valid_SMILES': False,
        'Toxic_Atoms': None,
        'PAINS_Alert': False,
        'Brenk_Alert': False,
        'MW': None,
        'LogP': None,
        'HBD': None,
        'HBA': None,
        'RotBonds': None,
        'Lead_Violations_Count': None,
        'Lead_Violations_List': None
    }
    
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return pd.Series(result)

    result['Valid_SMILES'] = True

    # A. Toxic Atom Verification
    toxic_atoms_found = set()
    for atom in mol.GetAtoms():
        if atom.GetSymbol() in TOXIC_ATOMS:
            toxic_atoms_found.add(atom.GetSymbol())
            
    if toxic_atoms_found:
        result['Toxic_Atoms'] = ", ".join(list(toxic_atoms_found))

    # B. PAINS and Brenk Verification
    if catalog.HasMatch(mol):
        matches = catalog.GetMatches(mol)
        result['PAINS_Alert'] = any('PAINS' in m.GetDescription().upper() for m in matches)
        result['Brenk_Alert'] = any('BRENK' in m.GetDescription().upper() for m in matches)

    # C. Leadlikeness Parameter Calculation
    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = Descriptors.NumHDonors(mol)
    hba = Descriptors.NumHAcceptors(mol)
    rot_bonds = Descriptors.NumRotatableBonds(mol)

    # Armazenando os valores exatos nas colunas
    result['MW'] = round(mw, 2)
    result['LogP'] = round(logp, 2)
    result['HBD'] = hbd
    result['HBA'] = hba
    result['RotBonds'] = rot_bonds

    # D. Leadlikeness Rules Verification 
    lead_violations = []
    
    if mw < 150:
        lead_violations.append("MW < 150")
    elif mw > 500:
        lead_violations.append("MW > 500")
        
    if logp > 5.0:
        lead_violations.append("LogP > 5.0")
        
    if hbd > 5:
        lead_violations.append("HBD > 5")
        
    if hba > 10:
        lead_violations.append("HBA > 10")
        
    if rot_bonds > 7:
        lead_violations.append("RotBonds > 7")

    result['Lead_Violations_Count'] = len(lead_violations)
    if lead_violations:
        result['Lead_Violations_List'] = "; ".join(lead_violations)
    else:
        result['Lead_Violations_List'] = "None"

    return pd.Series(result)