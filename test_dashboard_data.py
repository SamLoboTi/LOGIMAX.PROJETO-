#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de teste para validar os dados do dashboard
"""

import pandas as pd
import json
from datetime import datetime, timedelta

print("=" * 80)
print("TESTE DE DADOS DO DASHBOARD LOGIMAX")
print("=" * 80)

# Carregar dados
print("\n1. Carregando dados...")
try:
    df_erp = pd.read_csv("ERP_Pedidos.csv", encoding='utf-8')
    df_tms = pd.read_csv("TMS_Transporte.csv", encoding='utf-8')
    df_wms = pd.read_csv("WMS_Estoque.csv", encoding='utf-8')
    print("✅ Dados carregados com sucesso!")
except Exception as e:
    print(f"❌ Erro ao carregar dados: {e}")
    exit(1)

# Converter datas
df_erp['data_pedido'] = pd.to_datetime(df_erp['data_pedido'], errors='coerce')
df_tms['data_envio'] = pd.to_datetime(df_tms['data_envio'], errors='coerce')
df_tms['data_entrega'] = pd.to_datetime(df_tms['data_entrega'], errors='coerce')

# Teste 1: Status de Pedidos
print("\n2. STATUS DE PEDIDOS")
print("-" * 80)
status_count = df_erp['status_pedido'].value_counts()
print(status_count)
aprovado = len(df_erp[df_erp['status_pedido'].str.lower() == 'aprovado'])
emitido = len(df_erp[df_erp['status_pedido'].str.lower() == 'emitido'])
cancelado = len(df_erp[df_erp['status_pedido'].str.lower() == 'cancelado'])
total = aprovado + emitido + cancelado
print(f"\nResumo:")
print(f"  Aprovado:  {aprovado:>6} ({(aprovado/total)*100:.1f}%)")
print(f"  Emitido:   {emitido:>6} ({(emitido/total)*100:.1f}%)")
print(f"  Cancelado: {cancelado:>6} ({(cancelado/total)*100:.1f}%)")
print(f"  TOTAL:     {total:>6} (100.0%)")

# Teste 2: Lead Time
print("\n3. LEAD TIME")
print("-" * 80)
df_merged = pd.merge(df_erp[['order_id', 'data_pedido']], 
                      df_tms[['order_id', 'data_entrega']], 
                      on='order_id', how='inner')
df_merged['lead_time'] = (df_merged['data_entrega'] - df_merged['data_pedido']).dt.days
lead_time_medio = df_merged['lead_time'].mean()
lead_time_min = df_merged['lead_time'].min()
lead_time_max = df_merged['lead_time'].max()
print(f"  Lead Time Médio: {lead_time_medio:.2f} dias")
print(f"  Lead Time Mínimo: {lead_time_min:.0f} dias")
print(f"  Lead Time Máximo: {lead_time_max:.0f} dias")

# Teste 3: Custo por Modal
print("\n4. CUSTO LOGÍSTICO POR MODAL")
print("-" * 80)
custo_modal = df_tms.groupby('modal').agg({
    'custo_transporte': ['sum', 'mean', 'count'],
    'distancia_km': ['mean', 'min', 'max']
})
print(custo_modal)
print("\nResumo por Modal:")
for modal in df_tms['modal'].unique():
    df_modal = df_tms[df_tms['modal'] == modal]
    custo_total = df_modal['custo_transporte'].sum()
    distancia_media = df_modal['distancia_km'].mean()
    quant = len(df_modal)
    percentual = (custo_total / df_tms['custo_transporte'].sum()) * 100
    print(f"  {modal:15} | R$ {custo_total:>10,.2f} | {percentual:>5.1f}% | {distancia_media:>7.0f} km")

# Teste 4: Tendência de Lead Time
print("\n5. TENDÊNCIA DE LEAD TIME (ÚLTIMOS 15 DIAS)")
print("-" * 80)
df_merged_sorted = df_merged.sort_values('data_entrega')
lead_time_diario = df_merged_sorted.groupby(df_merged_sorted['data_entrega'].dt.date)['lead_time'].mean()
lead_time_diario_recent = lead_time_diario.tail(15)
print("Data       | Lead Time")
for data, lt in lead_time_diario_recent.items():
    print(f"  {data} | {lt:.2f} dias")

# Teste 5: Localização (Custo x Distância)
print("\n6. RELAÇÃO CUSTO x DISTÂNCIA")
print("-" * 80)
print("Modal           | Custo Médio | Distância Média | Custo/KM")
for modal in sorted(df_tms['modal'].unique()):
    df_modal = df_tms[df_tms['modal'] == modal]
    custo_medio = df_modal['custo_transporte'].mean()
    dist_media = df_modal['distancia_km'].mean()
    custo_por_km = custo_medio / dist_media if dist_media > 0 else 0
    print(f"  {modal:15} | R$ {custo_medio:>8,.2f} | {dist_media:>10.0f} km | R$ {custo_por_km:.2f}/km")

print("\n" + "=" * 80)
print("✅ TESTE CONCLUÍDO COM SUCESSO!")
print("=" * 80)
