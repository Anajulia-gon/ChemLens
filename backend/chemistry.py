"""
Alertas químicos e regras de leadlikeness.

Portado de `generate_chemical_properties_and_warnings` em toolsinterface.py.
"""
from __future__ import annotations

from rdkit import Chem
from rdkit.Chem import Descriptors
from rdkit.Chem.FilterCatalog import FilterCatalog, FilterCatalogParams

from domain import TOXIC_ATOMS

_params = FilterCatalogParams()
_params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS)
_params.AddCatalog(FilterCatalogParams.FilterCatalogs.BRENK)
_CATALOG = FilterCatalog(_params)


def generate_chemical_properties_and_warnings(smiles: str) -> dict:
    result = {
        "valid_smiles": False,
        "toxic_atoms": None,
        "pains_alert": False,
        "brenk_alert": False,
        "mw": None,
        "logp": None,
        "hbd": None,
        "hba": None,
        "rot_bonds": None,
        "lead_violations": [],
    }

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return result

    result["valid_smiles"] = True

    toxic_found = {atom.GetSymbol() for atom in mol.GetAtoms() if atom.GetSymbol() in TOXIC_ATOMS}
    if toxic_found:
        result["toxic_atoms"] = ", ".join(sorted(toxic_found))

    if _CATALOG.HasMatch(mol):
        matches = _CATALOG.GetMatches(mol)
        result["pains_alert"] = any("PAINS" in m.GetDescription().upper() for m in matches)
        result["brenk_alert"] = any("BRENK" in m.GetDescription().upper() for m in matches)

    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = Descriptors.NumHDonors(mol)
    hba = Descriptors.NumHAcceptors(mol)
    rot_bonds = Descriptors.NumRotatableBonds(mol)

    result["mw"] = round(mw, 2)
    result["logp"] = round(logp, 2)
    result["hbd"] = hbd
    result["hba"] = hba
    result["rot_bonds"] = rot_bonds

    violations = []
    if mw < 150:
        violations.append("MW < 150")
    elif mw > 500:
        violations.append("MW > 500")
    if logp > 5.0:
        violations.append("LogP > 5.0")
    if hbd > 5:
        violations.append("HBD > 5")
    if hba > 10:
        violations.append("HBA > 10")
    if rot_bonds > 7:
        violations.append("RotBonds > 7")
    result["lead_violations"] = violations

    return result
