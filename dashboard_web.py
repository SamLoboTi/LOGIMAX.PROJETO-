import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import numpy as np

# ==================== CONFIGURAÇÃO DA PÁGINA ====================
st.set_page_config(
    page_title="Dashboard LOGIMAX",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==================== CARREGAMENTO DE DADOS ====================
@st.cache_data
def carregar_dados():
    try:
        df_erp = pd.read_csv("ERP_Pedidos.csv")
        df_wms = pd.read_csv("WMS_Estoque.csv")
        df_tms = pd.read_csv("TMS_Transporte.csv")
        
        # Converter datas
        df_erp['data_pedido'] = pd.to_datetime(df_erp['data_pedido'], errors='coerce')
        df_wms['data_separacao'] = pd.to_datetime(df_wms['data_separacao'], errors='coerce')
        df_tms['data_envio'] = pd.to_datetime(df_tms['data_envio'], errors='coerce')
        df_tms['data_entrega'] = pd.to_datetime(df_tms['data_entrega'], errors='coerce')
        
        return df_erp, df_wms, df_tms
    except Exception as e:
        st.error(f"Erro ao carregar dados: {e}")
        return None, None, None

# ==================== FUNÇÕES DE CÁLCULO ====================
def calcular_kpis(df_erp, df_wms, df_tms):
    """Calcula KPIs principais do projeto logístico"""
    
    # 1. LEAD TIME (Dias entre pedido e entrega)
    df_merged = df_erp.merge(df_tms, on='order_id', how='left')
    df_merged['lead_time'] = (df_merged['data_entrega'] - df_merged['data_pedido']).dt.days
    lead_time_medio = df_merged['lead_time'].mean()
    
    # 2. FILL RATE (Quantidade separada vs. quantidade pedida)
    df_fill = df_erp.merge(df_wms, on='product_id', how='left')
    fill_rate = (df_fill['quantidade_separada'].sum() / df_fill['quantidade_pedida'].sum()) * 100 if df_fill['quantidade_pedida'].sum() > 0 else 0
    
    # 3. CUSTO LOGÍSTICO TOTAL
    custo_total = df_tms['custo_transporte'].sum()
    custo_medio_pedido = df_tms['custo_transporte'].mean()
    
    # 4. ROTATIVIDADE DE ESTOQUE
    saidas_total = df_wms['saidas'].sum()
    estoque_medio = df_wms['estoque_final'].mean()
    rotatividade = saidas_total / estoque_medio if estoque_medio > 0 else 0
    
    # 5. ACURÁCIA DE INVENTÁRIO
    df_wms['diferenca_inventario'] = abs(df_wms['inventario_real'] - df_wms['estoque_final'])
    acuracia = 100 - (df_wms['diferenca_inventario'].sum() / df_wms['estoque_final'].sum() * 100) if df_wms['estoque_final'].sum() > 0 else 0
    
    # 6. STATUS DE PEDIDOS
    pedidos_aprovados = len(df_erp[df_erp['status_pedido'] == 'aprovado'])
    pedidos_emitidos = len(df_erp[df_erp['status_pedido'] == 'emitido'])
    pedidos_cancelados = len(df_erp[df_erp['status_pedido'] == 'cancelado'])
    
    # 7. CONFORMIDADE DE PRAZOS
    prazo_cumprido = len(df_tms[df_tms['prazo_real'] <= df_tms['prazo_estimado']])
    taxa_conformidade = (prazo_cumprido / len(df_tms)) * 100 if len(df_tms) > 0 else 0
    
    return {
        'lead_time_medio': lead_time_medio,
        'fill_rate': fill_rate,
        'custo_total': custo_total,
        'custo_medio': custo_medio_pedido,
        'rotatividade': rotatividade,
        'acuracia': acuracia,
        'pedidos_aprovados': pedidos_aprovados,
        'pedidos_emitidos': pedidos_emitidos,
        'pedidos_cancelados': pedidos_cancelados,
        'taxa_conformidade': taxa_conformidade,
        'df_merged': df_merged
    }

# ==================== CARREGAMENTO INICIAL ====================
df_erp, df_wms, df_tms = carregar_dados()

if df_erp is not None and df_wms is not None and df_tms is not None:
    kpis = calcular_kpis(df_erp, df_wms, df_tms)
    
    # ==================== LAYOUT ====================
    st.markdown("# 📊 Dashboard LOGIMAX")
    st.markdown("---")
    
    # ==================== KPIs PRINCIPAIS ====================
    st.markdown("## 📈 KPIs Principais")
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric(
            label="⏱️ Lead Time (dias)",
            value=f"{kpis['lead_time_medio']:.1f}",
            delta="dias entre pedido e entrega"
        )
    
    with col2:
        st.metric(
            label="📦 Fill Rate",
            value=f"{kpis['fill_rate']:.1f}%",
            delta="quantidade separada"
        )
    
    with col3:
        st.metric(
            label="💰 Custo Total",
            value=f"R$ {kpis['custo_total']:,.2f}",
            delta=f"Médio: R$ {kpis['custo_medio']:.2f}"
        )
    
    with col4:
        st.metric(
            label="🔄 Rotatividade",
            value=f"{kpis['rotatividade']:.2f}x",
            delta="vezes ao período"
        )
    
    with col5:
        st.metric(
            label="✅ Acurácia Inventário",
            value=f"{kpis['acuracia']:.1f}%",
            delta="alinhamento real vs. sistema"
        )
    
    st.markdown("---")
    
    # ==================== GRÁFICOS PRINCIPAIS ====================
    st.markdown("## 📊 Análises Detalhadas")
    
    col1, col2 = st.columns(2)
    
    # Gráfico 1: Status de Pedidos
    with col1:
        status_data = {
            'Status': ['Aprovado', 'Emitido', 'Cancelado'],
            'Quantidade': [kpis['pedidos_aprovados'], kpis['pedidos_emitidos'], kpis['pedidos_cancelados']]
        }
        df_status = pd.DataFrame(status_data)
        fig_status = px.pie(
            df_status,
            values='Quantidade',
            names='Status',
            title='Distribuição de Status de Pedidos',
            color_discrete_map={'Aprovado': '#2ecc71', 'Emitido': '#3498db', 'Cancelado': '#e74c3c'}
        )
        st.plotly_chart(fig_status, use_container_width=True)
    
    # Gráfico 2: Conformidade de Prazos
    with col2:
        st.metric(
            label="🎯 Taxa de Conformidade de Prazos",
            value=f"{kpis['taxa_conformidade']:.1f}%",
            delta="prazos cumpridos"
        )
        
        conformidade_data = {
            'Status': ['Cumprido', 'Atrasado'],
            'Quantidade': [
                len(df_tms[df_tms['prazo_real'] <= df_tms['prazo_estimado']]),
                len(df_tms[df_tms['prazo_real'] > df_tms['prazo_estimado']])
            ]
        }
        df_conformidade = pd.DataFrame(conformidade_data)
        fig_conformidade = px.bar(
            df_conformidade,
            x='Status',
            y='Quantidade',
            title='Conformidade vs. Atrasos',
            color='Status',
            color_discrete_map={'Cumprido': '#2ecc71', 'Atrasado': '#e74c3c'}
        )
        st.plotly_chart(fig_conformidade, use_container_width=True)
    
    st.markdown("---")
    
    # ==================== GRÁFICOS DE SÉRIE TEMPORAL ====================
    col1, col2 = st.columns(2)
    
    # Pedidos por dia
    with col1:
        pedidos_dia = df_erp.groupby(df_erp['data_pedido'].dt.date).size().reset_index()
        pedidos_dia.columns = ['Data', 'Quantidade']
        fig_pedidos = px.line(
            pedidos_dia,
            x='Data',
            y='Quantidade',
            title='Pedidos por Dia',
            markers=True
        )
        st.plotly_chart(fig_pedidos, use_container_width=True)
    
    # Custos de transporte por modal
    with col2:
        custo_modal = df_tms.groupby('modal')['custo_transporte'].sum().reset_index()
        fig_modal = px.bar(
            custo_modal,
            x='modal',
            y='custo_transporte',
            title='Custo de Transporte por Modal',
            labels={'modal': 'Modal', 'custo_transporte': 'Custo (R$)'},
            color='modal'
        )
        st.plotly_chart(fig_modal, use_container_width=True)
    
    st.markdown("---")
    
    # ==================== ANÁLISE DE ESTOQUE ====================
    st.markdown("## 📦 Análise de Estoque")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Top 10 produtos por saídas
        top_produtos = df_wms.nlargest(10, 'saidas')[['product_id', 'saidas', 'estoque_final']]
        top_produtos['product_id'] = top_produtos['product_id'].astype(str)
        fig_top = px.bar(
            top_produtos,
            x='product_id',
            y='saidas',
            title='Top 10 Produtos com Maior Saída',
            labels={'product_id': 'Produto ID', 'saidas': 'Saídas'},
            color='estoque_final'
        )
        st.plotly_chart(fig_top, use_container_width=True)
    
    with col2:
        # Distribuição de estoque
        fig_estoque = px.histogram(
            df_wms,
            x='estoque_final',
            nbins=30,
            title='Distribuição de Níveis de Estoque',
            labels={'estoque_final': 'Quantidade em Estoque'},
            color_discrete_sequence=['#3498db']
        )
        st.plotly_chart(fig_estoque, use_container_width=True)
    
    st.markdown("---")
    
    # ==================== SIDEBAR - FILTROS ====================
    st.sidebar.markdown("## 🔍 Filtros")
    
    # Filtro de período
    data_inicio = st.sidebar.date_input(
        "Data Inicial",
        value=df_erp['data_pedido'].min()
    )
    data_fim = st.sidebar.date_input(
        "Data Final",
        value=df_erp['data_pedido'].max()
    )
    
    # Filtro de status
    status_filter = st.sidebar.multiselect(
        "Status de Pedidos",
        options=df_erp['status_pedido'].unique(),
        default=df_erp['status_pedido'].unique()
    )
    
    # Filtro de modal
    modal_filter = st.sidebar.multiselect(
        "Modal de Transporte",
        options=df_tms['modal'].unique(),
        default=df_tms['modal'].unique()
    )
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("### ℹ️ Informações do Projeto")
    st.sidebar.info(
        "**LOGIMAX Dashboard**\n\n"
        "Dashboard interativo para análise de indicadores logísticos.\n\n"
        f"📊 Total de Pedidos: {len(df_erp)}\n"
        f"📦 Total de Produtos: {len(df_wms)}\n"
        f"🚚 Total de Entregas: {len(df_tms)}"
    )
    
    # ==================== TABELAS DE DADOS ====================
    st.markdown("## 📋 Detalhes dos Dados")
    
    tab1, tab2, tab3 = st.tabs(["Pedidos (ERP)", "Estoque (WMS)", "Transportes (TMS)"])
    
    with tab1:
        st.dataframe(
            df_erp[
                (df_erp['data_pedido'].dt.date >= data_inicio) &
                (df_erp['data_pedido'].dt.date <= data_fim) &
                (df_erp['status_pedido'].isin(status_filter))
            ].head(50),
            use_container_width=True
        )
    
    with tab2:
        st.dataframe(df_wms.head(50), use_container_width=True)
    
    with tab3:
        st.dataframe(
            df_tms[df_tms['modal'].isin(modal_filter)].head(50),
            use_container_width=True
        )

else:
    st.error("Erro ao carregar dados. Verifique se os arquivos CSV estão no diretório correto.")
