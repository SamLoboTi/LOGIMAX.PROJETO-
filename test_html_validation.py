"""Teste de validação do HTML do dashboard"""
import re

# Ler o arquivo HTML
with open('templates/index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Verificar se há canvas elements
canvas_elements = re.findall(r'<canvas\s+id=["\']([^"\']+)["\'][^>]*>', html_content)
print(f"✅ Canvas elementos encontrados: {canvas_elements}")

# Verificar se há referências aos canvas elementos no JavaScript
for canvas_id in canvas_elements:
    pattern = rf"document\.getElementById\(['\"]({re.escape(canvas_id)})['\"]"
    matches = re.findall(pattern, html_content)
    print(f"   - {canvas_id}: {len(matches)} referências encontradas")

# Verificar se funções estão definidas
functions = ['createLineChart', 'createStatusChart', 'createBarChart', 'createScatterChart', 'loadCharts', 'loadDashboard']
for func in functions:
    pattern = rf"function {func}\s*\("
    matches = re.findall(pattern, html_content)
    print(f"✅ Função '{func}': {'DEFINIDA' if matches else '❌ NÃO ENCONTRADA'}")

# Verificar se há erros de sintaxe JavaScript comum
issues = []

# Verificar colchetes/parênteses desbalanceados
open_braces = html_content.count('{')
close_braces = html_content.count('}')
if open_braces != close_braces:
    issues.append(f"⚠️ Desbalanceamento de chaves: {open_braces} open vs {close_braces} close")

# Verificar parênteses
open_parens = html_content.count('(')
close_parens = html_content.count(')')
if open_parens != close_parens:
    issues.append(f"⚠️ Desbalanceamento de parênteses: {open_parens} open vs {close_parens} close")

if issues:
    print("\n⚠️ Potenciais problemas:")
    for issue in issues:
        print(f"   {issue}")
else:
    print("\n✅ Sem problemas óbvios de sintaxe")

# Verificar referências às APIs
api_calls = re.findall(r"fetch\(['\"]([^'\"]+)['\"]", html_content)
print(f"\n✅ Chamadas de API encontradas: {set(api_calls)}")

print("\n✅ Validação concluída!")
