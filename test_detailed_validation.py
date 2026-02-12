"""Teste detalhado - Verificar chamadas de canvas no loadCharts"""
import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar a função loadCharts
loadcharts_match = re.search(r'async\s+function\s+loadCharts\s*\(\s*\)\s*\{(.*?)\n\s*\}', content, re.DOTALL)

if loadcharts_match:
    loadcharts_body = loadcharts_match.group(1)
    print("✅ Função loadCharts encontrada\n")
    
    # Procurar pelas chamadas de createChart
    chart_calls = re.findall(r"create\w+Chart\s*\(\s*['\"]([^'\"]+)['\"]", loadcharts_body)
    print(f"✅ Chamadas de gráficos encontradas: {chart_calls}")
    print()
    
    # Procurar pelos canvas elements
    canvas_defs = re.findall(r'<canvas\s+id=["\']([^"\']+)["\']', content)
    print(f"✅ Elementos canvas definidos: {canvas_defs}")
    print()
    
    # Comparar
    missing = set(canvas_defs) - set(chart_calls)
    if missing:
        print(f"⚠️ Canvas definidos mas não chamados: {missing}")
    else:
        print("✅ Todos os canvas estão sendo chamados!")
else:
    print("❌ Função loadCharts não encontrada")

# Procurar por document.getElementById nas funções de criação
print("\n" + "="*60)
print("Verificando document.getElementById nas funções:")
print("="*60)

functions = ['createLineChart', 'createStatusChart', 'createBarChart', 'createScatterChart']
for func in functions:
    # Encontrar a função
    pattern = rf"function\s+{func}\s*\([^)]*\)\s*\{{(.*?)\n\s*function\s+\w+|function\s+{func}\s*\([^)]*\)\s*\{{(.*?)$"
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        body = match.group(1) or match.group(2)
        # Procurar por document.getElementById
        getid_calls = re.findall(r"document\.getElementById\s*\(\s*['\"]([^'\"]+)['\"]", body)
        if getid_calls:
            print(f"✅ {func}: usa getElementById com ID(s): {getid_calls}")
        else:
            print(f"⚠️ {func}: NÃO encontrou document.getElementById!")
    else:
        print(f"❌ {func}: função não encontrada")

print("\n" + "="*60)
print("✅ Análise concluída!")
