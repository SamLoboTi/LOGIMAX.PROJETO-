"""Script de diagnóstico completo do dashboard"""
import requests
import json
from datetime import datetime

print("="*70)
print("🔍 DIAGNÓSTICO COMPLETO DO DASHBOARD LOGIMAX")
print("="*70)
print(f"\n⏱️  Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
print(f"🌐 URL Base: http://localhost:5000")

# APIs para testar
apis = [
    ('/api/kpis', 'KPIs'),
    ('/api/status-pedidos', 'Status de Pedidos'),
    ('/api/pedidos-por-dia', 'Pedidos por Dia'),
    ('/api/custo-por-modal', 'Custo por Modal'),
    ('/api/top-produtos', 'Top 10 Produtos'),
    ('/api/pedidos-tabela', 'Tabela de Pedidos'),
]

results = []

print("\n" + "="*70)
print("TESTANDO ENDPOINTS")
print("="*70 + "\n")

for endpoint, name in apis:
    try:
        print(f"Testando: {name}")
        print(f"  Endpoint: {endpoint}")
        
        response = requests.get(f'http://localhost:5000{endpoint}', timeout=5)
        
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ SUCESSO")
            print(f"  Chaves: {list(data.keys())}")
            
            # Mostrar amostra dos dados
            if 'labels' in data and 'data' in data:
                print(f"  Labels (primeiros 3): {data['labels'][:3]}")
                print(f"  Dados (primeiros 3): {data['data'][:3]}")
            
            results.append((endpoint, 'SUCCESS', data))
        else:
            print(f"  ❌ ERRO - Status: {response.status_code}")
            results.append((endpoint, 'ERROR', f"HTTP {response.status_code}"))
            
    except Exception as e:
        print(f"  ❌ ERRO - {str(e)}")
        results.append((endpoint, 'ERROR', str(e)))
    
    print()

# Resumo
print("="*70)
print("RESUMO DOS TESTES")
print("="*70 + "\n")

success_count = sum(1 for _, status, _ in results if status == 'SUCCESS')
error_count = sum(1 for _, status, _ in results if status == 'ERROR')

print(f"✅ Sucessos: {success_count}/{len(apis)}")
print(f"❌ Erros: {error_count}/{len(apis)}")

if error_count == 0:
    print("\n✅ TODOS OS ENDPOINTS ESTÃO FUNCIONANDO!")
else:
    print("\n⚠️  ALGUNS ENDPOINTS FALHARAM:")
    for endpoint, status, data in results:
        if status == 'ERROR':
            print(f"  - {endpoint}: {data}")

# Verificar HTML
print("\n" + "="*70)
print("VERIFICAÇÃO DO ARQUIVO HTML")
print("="*70 + "\n")

try:
    response = requests.get('http://localhost:5000/', timeout=5)
    html_content = response.text
    
    print(f"✅ HTML carregado com sucesso ({len(html_content)} bytes)")
    
    # Verificar elementos críticos
    checks = [
        ('<canvas id="chart-pedidos"', 'Canvas: Tendência Lead Time'),
        ('<canvas id="chart-status"', 'Canvas: Status Pedidos'),
        ('<canvas id="chart-custos"', 'Canvas: Custo por Modal'),
        ('<canvas id="chart-scatter"', 'Canvas: Scatter Distância'),
        ('Chart.js', 'Biblioteca Chart.js'),
        ('async function loadCharts()', 'Função loadCharts'),
        ('function createLineChart', 'Função createLineChart'),
        ('function createStatusChart', 'Função createStatusChart'),
        ('function createBarChart', 'Função createBarChart'),
        ('function createScatterChart', 'Função createScatterChart'),
    ]
    
    print("\nVerificação de elementos HTML/JS:\n")
    for check_str, description in checks:
        if check_str in html_content:
            print(f"  ✅ {description}")
        else:
            print(f"  ❌ {description} - NÃO ENCONTRADO")
            
except Exception as e:
    print(f"❌ Erro ao verificar HTML: {e}")

print("\n" + "="*70)
print("✅ DIAGNÓSTICO CONCLUÍDO")
print("="*70)
print("\n💡 Dica: Se todos os endpoints estão OK mas os gráficos não carregam,")
print("   verifique o console do navegador (F12) para erros de JavaScript.")
