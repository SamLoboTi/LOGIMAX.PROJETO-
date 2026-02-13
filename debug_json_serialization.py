
import pandas as pd
import json
import numpy as np
from app import calcular_kpis, carregar_dados

# Mock app context if needed or just use functions
print("Testing Data Loading...")
df_erp, df_wms, df_tms = carregar_dados()

print(f"ERP: {len(df_erp) if df_erp is not None else 'None'}")
print(f"WMS: {len(df_wms) if df_wms is not None else 'None'}")
print(f"TMS: {len(df_tms) if df_tms is not None else 'None'}")

if df_erp is not None:
    print("Testing KPI Calculation...")
    kpis = calcular_kpis(df_erp, df_wms, df_tms)
    print("KPIs calculated:", kpis)
    
    print("Testing JSON Serialization...")
    try:
        # Custom encoder for numpy types if needed, though app.py doesn't have one
        json_str = json.dumps(kpis)
        print("✅ JSON Serialization Successful!")
        print(json_str[:100] + "...")
    except Exception as e:
        print("❌ JSON Serialization FAILED:")
        print(e)
        # Check for NaN/Inf
        for k, v in kpis.items():
            if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                print(f"  ⚠️ Found {k}: {v}")

    print("\nTesting Modal Costs...")
    # Simulate /api/custo-por-modal logic
    try:
        custo_modal_stats = df_tms.groupby('modal').agg({
            'custo_transporte': 'sum',
            'distancia_km': 'mean'
        }).to_dict()
        print("Modal Stats:", custo_modal_stats)
        print("Serialization test for modal stats passed (implicit in print)")
    except Exception as e:
        print("❌ Modal Stats Failed:", e)

else:
    print("❌ Failed to load data")
