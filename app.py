from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pandas as pd
import json
from datetime import datetime, timedelta
import os
import traceback

app = Flask(__name__, template_folder='templates')
CORS(app)

# ==================== CARREGAMENTO DE DADOS ====================
def carregar_dados():
    """Carrega dados dos CSVs com tratamento robusto"""
    try:
        df_erp = pd.read_csv("ERP_Pedidos.csv", encoding='utf-8')
        df_wms = pd.read_csv("WMS_Estoque.csv", encoding='utf-8')
        df_tms = pd.read_csv("TMS_Transporte.csv", encoding='utf-8')
        
        # Converter datas
        df_erp['data_pedido'] = pd.to_datetime(df_erp['data_pedido'], errors='coerce')
        df_wms['data_separacao'] = pd.to_datetime(df_wms['data_separacao'], errors='coerce')
        df_tms['data_envio'] = pd.to_datetime(df_tms['data_envio'], errors='coerce')
        df_tms['data_entrega'] = pd.to_datetime(df_tms['data_entrega'], errors='coerce')
        
        return df_erp, df_wms, df_tms
    except Exception as e:
        print(f"Erro ao carregar dados: {e}")
        traceback.print_exc()
        return None, None, None

# ==================== FUNÇÕES DE CÁLCULO ====================
def calcular_kpis(df_erp, df_wms, df_tms):
    """Calcula KPIs principais com tratamento robusto"""
    try:
        # 1. LEAD TIME
        if len(df_erp) > 0 and len(df_tms) > 0:
            try:
                df_merged = pd.merge(df_erp[['order_id', 'data_pedido']], 
                                    df_tms[['order_id', 'data_entrega']], 
                                    on='order_id', how='inner')
                df_merged['lead_time'] = (df_merged['data_entrega'] - df_merged['data_pedido']).dt.days
                lead_time_medio = float(df_merged['lead_time'].mean()) if len(df_merged) > 0 else 0
            except:
                lead_time_medio = 0
        else:
            lead_time_medio = 0
        
        # 2. FILL RATE
        if len(df_erp) > 0 and len(df_wms) > 0:
            try:
                quantidade_pedida_total = float(df_erp['quantidade_pedida'].sum())
                quantidade_separada_total = float(df_wms['quantidade_separada'].sum())
                fill_rate = (quantidade_separada_total / quantidade_pedida_total) * 100 if quantidade_pedida_total > 0 else 0
            except:
                fill_rate = 0
        else:
            fill_rate = 0
        
        # 3. CUSTO LOGÍSTICO
        if len(df_tms) > 0:
            try:
                custo_total = float(df_tms['custo_transporte'].sum())
                custo_medio = float(df_tms['custo_transporte'].mean())
            except:
                custo_total = 0
                custo_medio = 0
        else:
            custo_total = 0
            custo_medio = 0
        
        # 4. ROTATIVIDADE
        if len(df_wms) > 0:
            try:
                saidas_total = float(df_wms['saidas'].sum())
                estoque_medio = float(df_wms['estoque_final'].mean())
                rotatividade = saidas_total / estoque_medio if estoque_medio > 0 else 0
            except:
                rotatividade = 0
        else:
            rotatividade = 0
        
        # 5. ACURÁCIA
        if len(df_wms) > 0:
            try:
                df_wms_copy = df_wms.copy()
                df_wms_copy['diferenca'] = abs(df_wms_copy['inventario_real'] - df_wms_copy['estoque_final'])
                estoque_total = float(df_wms_copy['estoque_final'].sum())
                acuracia = 100 - (df_wms_copy['diferenca'].sum() / estoque_total) * 100 if estoque_total > 0 else 100
                acuracia = min(100, max(0, acuracia))
            except:
                acuracia = 100
        else:
            acuracia = 100
        
        # 6. STATUS PEDIDOS
        if len(df_erp) > 0:
            try:
                status_lower = df_erp['status_pedido'].str.lower()
                pedidos_aprovados = int(len(df_erp[status_lower == 'aprovado']))
                pedidos_emitidos = int(len(df_erp[status_lower == 'emitido']))
                pedidos_cancelados = int(len(df_erp[status_lower == 'cancelado']))
            except:
                pedidos_aprovados = 0
                pedidos_emitidos = 0
                pedidos_cancelados = 0
        else:
            pedidos_aprovados = 0
            pedidos_emitidos = 0
            pedidos_cancelados = 0
        
        # 7. CONFORMIDADE
        if len(df_tms) > 0:
            try:
                prazo_cumprido = int(len(df_tms[df_tms['prazo_real'] <= df_tms['prazo_estimado']]))
                taxa_conformidade = (prazo_cumprido / len(df_tms)) * 100 if len(df_tms) > 0 else 0
            except:
                taxa_conformidade = 0
        else:
            taxa_conformidade = 0
        
        return {
            'lead_time_medio': round(lead_time_medio, 2),
            'fill_rate': round(fill_rate, 2),
            'custo_total': round(custo_total, 2),
            'custo_medio': round(custo_medio, 2),
            'rotatividade': round(rotatividade, 2),
            'acuracia': round(acuracia, 2),
            'pedidos_aprovados': pedidos_aprovados,
            'pedidos_emitidos': pedidos_emitidos,
            'pedidos_cancelados': pedidos_cancelados,
            'taxa_conformidade': round(taxa_conformidade, 2),
            'total_pedidos': len(df_erp),
            'total_produtos': len(df_wms),
            'total_entregas': len(df_tms)
        }
    except Exception as e:
        print(f"Erro ao calcular KPIs: {e}")
        traceback.print_exc()
        return {}

# ==================== ROTAS ====================

@app.route('/')
def home():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/kpis')
def get_kpis():
    """API - Retorna KPIs principais"""
    df_erp, df_wms, df_tms = carregar_dados()
    if df_erp is None:
        return jsonify({'error': 'Erro ao carregar dados'}), 500
    
    kpis = calcular_kpis(df_erp, df_wms, df_tms)
    return jsonify(kpis)

@app.route('/api/status-pedidos')
def get_status_pedidos():
    """API - Status de pedidos"""
    try:
        df_erp, _, _ = carregar_dados()
        if df_erp is None or len(df_erp) == 0:
            return jsonify({'labels': [], 'data': []})
        
        status_counts = df_erp['status_pedido'].value_counts().to_dict()
        return jsonify({
            'labels': list(status_counts.keys()),
            'data': list(status_counts.values())
        })
    except Exception as e:
        print(f"Erro em /api/status-pedidos: {e}")
        return jsonify({'labels': [], 'data': []})

@app.route('/api/conformidade-prazos')
def get_conformidade_prazos():
    """API - Conformidade de prazos"""
    try:
        _, _, df_tms = carregar_dados()
        if df_tms is None or len(df_tms) == 0:
            return jsonify({'labels': ['Cumprido', 'Atrasado'], 'data': [0, 0]})
        
        cumprido = len(df_tms[df_tms['prazo_real'] <= df_tms['prazo_estimado']])
        atrasado = len(df_tms[df_tms['prazo_real'] > df_tms['prazo_estimado']])
        
        return jsonify({
            'labels': ['Cumprido', 'Atrasado'],
            'data': [cumprido, atrasado]
        })
    except Exception as e:
        print(f"Erro em /api/conformidade-prazos: {e}")
        return jsonify({'labels': ['Cumprido', 'Atrasado'], 'data': [0, 0]})

@app.route('/api/pedidos-por-dia')
def get_pedidos_por_dia():
    """API - Pedidos por dia"""
    try:
        df_erp, _, _ = carregar_dados()
        if df_erp is None or len(df_erp) == 0:
            return jsonify({'labels': [], 'data': []})
        
        pedidos_dia = df_erp.groupby(df_erp['data_pedido'].dt.date).size()
        return jsonify({
            'labels': [str(d) for d in pedidos_dia.index.tolist()],
            'data': pedidos_dia.values.tolist()
        })
    except Exception as e:
        print(f"Erro em /api/pedidos-por-dia: {e}")
        return jsonify({'labels': [], 'data': []})

@app.route('/api/custo-por-modal')
def get_custo_modal():
    """API - Custo por modal de transporte"""
    try:
        _, _, df_tms = carregar_dados()
        if df_tms is None or len(df_tms) == 0:
            return jsonify({'labels': [], 'data': []})
        
        custo_modal = df_tms.groupby('modal')['custo_transporte'].sum().to_dict()
        return jsonify({
            'labels': list(custo_modal.keys()),
            'data': [round(v, 2) for v in custo_modal.values()]
        })
    except Exception as e:
        print(f"Erro em /api/custo-por-modal: {e}")
        return jsonify({'labels': [], 'data': []})

@app.route('/api/top-produtos')
def get_top_produtos():
    """API - Top 10 produtos com maior saída"""
    try:
        _, df_wms, _ = carregar_dados()
        if df_wms is None or len(df_wms) == 0:
            return jsonify({'labels': [], 'saidas': [], 'estoque': []})
        
        top = df_wms.nlargest(10, 'saidas')[['product_id', 'saidas', 'estoque_final']]
        return jsonify({
            'labels': [f'P{int(pid)}' for pid in top['product_id'].tolist()],
            'saidas': top['saidas'].tolist(),
            'estoque': top['estoque_final'].tolist()
        })
    except Exception as e:
        print(f"Erro em /api/top-produtos: {e}")
        return jsonify({'labels': [], 'saidas': [], 'estoque': []})

@app.route('/api/distribuicao-estoque')
def get_distribuicao_estoque():
    """API - Distribuição de estoque"""
    try:
        _, df_wms, _ = carregar_dados()
        if df_wms is None or len(df_wms) == 0:
            return jsonify({'labels': [], 'data': []})
        
        hist, _ = pd.cut(df_wms['estoque_final'], bins=6, retbins=True)
        counts = hist.value_counts().sort_index()
        
        return jsonify({
            'labels': [str(interval) for interval in counts.index],
            'data': counts.values.tolist()
        })
    except Exception as e:
        print(f"Erro em /api/distribuicao-estoque: {e}")
        return jsonify({'labels': [], 'data': []})

@app.route('/api/pedidos-tabela')
def get_pedidos_tabela():
    """API - Tabela de pedidos"""
    df_erp, _, _ = carregar_dados()
    if df_erp is None:
        return jsonify({'error': 'Erro ao carregar dados'}), 500
    
    # Limitar a 100 linhas
    df_display = df_erp.head(100).copy()
    df_display['data_pedido'] = df_display['data_pedido'].astype(str)
    
    return jsonify(df_display.to_dict('records'))

@app.route('/api/estoque-tabela')
def get_estoque_tabela():
    """API - Tabela de estoque"""
    _, df_wms, _ = carregar_dados()
    if df_wms is None:
        return jsonify({'error': 'Erro ao carregar dados'}), 500
    
    df_display = df_wms.head(100).copy()
    df_display['data_separacao'] = df_display['data_separacao'].astype(str)
    
    return jsonify(df_display.to_dict('records'))

@app.route('/api/transporte-tabela')
def get_transporte_tabela():
    """API - Tabela de transporte"""
    _, _, df_tms = carregar_dados()
    if df_tms is None:
        return jsonify({'error': 'Erro ao carregar dados'}), 500
    
    df_display = df_tms.head(100).copy()
    df_display['data_envio'] = df_display['data_envio'].astype(str)
    df_display['data_entrega'] = df_display['data_entrega'].astype(str)
    
    return jsonify(df_display.to_dict('records'))

@app.route('/api/health')
def health():
    """Health check"""
    try:
        df_erp, df_wms, df_tms = carregar_dados()
        status = "ok" if df_erp is not None else "error"
        return jsonify({
            'status': status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# ==================== TRATAMENTO DE ERROS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Rota não encontrada'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

# ==================== EXECUTAR APLICAÇÃO ====================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port, threaded=True)
