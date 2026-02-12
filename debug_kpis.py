#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de debug para verificar cálculo de KPIs
"""
import pandas as pd
import json
from datetime import datetime

print("=" * 80)
print("🔍 DEBUG: Carregando e calculando KPIs")
print("=" * 80)

try:
    # Carregar dados
    print("\n📂 Carregando CSVs...")
    df_erp = pd.read_csv("ERP_Pedidos.csv", encoding='utf-8')
    df_wms = pd.read_csv("WMS_Estoque.csv", encoding='utf-8')
    df_tms = pd.read_csv("TMS_Transporte.csv", encoding='utf-8')
    
    print(f"✅ ERP: {len(df_erp)} pedidos")
    print(f"✅ WMS: {len(df_wms)} produtos")
    print(f"✅ TMS: {len(df_tms)} entregas")
    
    # Converter datas
    print("\n📅 Convertendo datas...")
    df_erp['data_pedido'] = pd.to_datetime(df_erp['data_pedido'], errors='coerce')
    df_wms['data_separacao'] = pd.to_datetime(df_wms['data_separacao'], errors='coerce')
    df_tms['data_envio'] = pd.to_datetime(df_tms['data_envio'], errors='coerce')
    df_tms['data_entrega'] = pd.to_datetime(df_tms['data_entrega'], errors='coerce')
    
    print("✅ Datas convertidas")
    
    # CÁLCULOS
    print("\n" + "=" * 80)
    print("📊 CÁLCULO DE KPIs")
    print("=" * 80)
    
    # 1. Lead Time
    print("\n1️⃣ LEAD TIME MÉDIO")
    df_merged = pd.merge(df_erp[['order_id', 'data_pedido']], 
                        df_tms[['order_id', 'data_entrega']], 
                        on='order_id', how='inner')
    df_merged['lead_time'] = (df_merged['data_entrega'] - df_merged['data_pedido']).dt.days
    lead_time_medio = float(df_merged['lead_time'].mean())
    print(f"   Lead Time: {lead_time_medio:.2f} dias")
    
    # 2. Fill Rate
    print("\n2️⃣ FILL RATE")
    qtd_pedida = float(df_erp['quantidade_pedida'].sum())
    qtd_separada = float(df_wms['quantidade_separada'].sum())
    fill_rate = (qtd_separada / qtd_pedida) * 100 if qtd_pedida > 0 else 0
    print(f"   Pedido: {qtd_pedida:.0f}")
    print(f"   Separado: {qtd_separada:.0f}")
    print(f"   Fill Rate: {fill_rate:.2f}%")
    
    # 3. Receita Total
    print("\n3️⃣ RECEITA TOTAL")
    if 'valor_pedido' in df_erp.columns and 'quantidade_pedida' in df_erp.columns:
        df_erp['receita'] = df_erp['valor_pedido'] * df_erp['quantidade_pedida']
        receita_total = float(df_erp['receita'].sum())
        print(f"   Receita: R$ {receita_total:,.2f}")
    else:
        print("   ❌ Colunas de receita não encontradas")
        receita_total = 0
    
    # 4. Entregas Prazo
    print("\n4️⃣ ENTREGAS NO PRAZO")
    cumpridas = len(df_tms[df_tms['prazo_real'] <= df_tms['prazo_estimado']])
    total = len(df_tms)
    taxa = (cumpridas / total) * 100 if total > 0 else 0
    print(f"   Cumpridas: {cumpridas}/{total}")
    print(f"   Taxa: {taxa:.2f}%")
    
    # 5. Rotatividade
    print("\n5️⃣ ROTATIVIDADE")
    saidas_total = float(df_wms['saidas'].sum())
    estoque_medio = float(df_wms['estoque_final'].mean())
    rotatividade = saidas_total / estoque_medio if estoque_medio > 0 else 0
    print(f"   Saídas: {saidas_total:.0f}")
    print(f"   Estoque Médio: {estoque_medio:.2f}")
    print(f"   Rotatividade: {rotatividade:.2f}x")
    
    # 6. Acuracidade
    print("\n6️⃣ ACURACIDADE")
    df_wms_copy = df_wms.copy()
    df_wms_copy['diferenca'] = abs(df_wms_copy['inventario_real'] - df_wms_copy['estoque_final'])
    estoque_total = float(df_wms_copy['estoque_final'].sum())
    acuracia = 100 - (df_wms_copy['diferenca'].sum() / estoque_total) * 100 if estoque_total > 0 else 100
    acuracia = min(100, max(0, acuracia))
    print(f"   Diferenças: {df_wms_copy['diferenca'].sum():.0f}")
    print(f"   Acuracidade: {acuracia:.2f}%")
    
    # 7. Inconsistências
    print("\n7️⃣ INCONSISTÊNCIAS")
    inconsistencias = int(len(df_wms_copy[df_wms_copy['diferenca'] > 0]))
    print(f"   Itens com diferença: {inconsistencias}")
    
    # JSON Final
    print("\n" + "=" * 80)
    print("📋 JSON FINAL PARA FRONTEND")
    print("=" * 80)
    
    kpis = {
        'lead_time_medio': round(lead_time_medio, 2),
        'lead_time_variacao': -5.0,
        'fill_rate': round(fill_rate, 2),
        'fill_rate_variacao': 2.0,
        'receita_total': round(receita_total, 2),
        'receita_variacao': 12.0,
        'entregas_prazo': round(taxa, 2),
        'entregas_prazo_variacao': 3.0,
        'rotatividade': round(rotatividade, 2),
        'rotatividade_variacao': 8.0,
        'acuracia': round(acuracia, 2),
        'acuracia_variacao': 1.0,
        'inconsistencias': int(inconsistencias),
        'inconsistencias_variacao': -15.0,
        'total_pedidos': len(df_erp),
        'total_produtos': len(df_wms),
        'total_entregas': len(df_tms)
    }
    
    print(json.dumps(kpis, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 80)
    print("✅ Debug completo!")
    print("=" * 80)
    
except Exception as e:
    print(f"❌ ERRO: {str(e)}")
    import traceback
    traceback.print_exc()
