#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de validação do Dashboard LOGIMAX
Verifica se tudo está pronto para rodar
"""

import os
import sys
from pathlib import Path

print("=" * 60)
print("🔍 VALIDAÇÃO DO DASHBOARD LOGIMAX")
print("=" * 60)
print()

# Cores para terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

errors = []
warnings = []
success_count = 0

# ============= VERIFICAR ARQUIVOS =============
print("📁 Verificando arquivos...")
print("-" * 60)

required_files = {
    'app.py': 'Backend Flask',
    'templates/index.html': 'Frontend HTML',
    'requirements.txt': 'Dependências',
    'ERP_Pedidos.csv': 'Dados ERP',
    'WMS_Estoque.csv': 'Dados WMS',
    'TMS_Transporte.csv': 'Dados TMS',
}

for file_path, description in required_files.items():
    if os.path.exists(file_path):
        size = os.path.getsize(file_path)
        print(f"{GREEN}✓{RESET} {file_path:<35} ({size:,} bytes) - {description}")
        success_count += 1
    else:
        print(f"{RED}✗{RESET} {file_path:<35} FALTANDO")
        errors.append(f"Arquivo não encontrado: {file_path}")

print()

# ============= VERIFICAR PYTHON =============
print("🐍 Verificando Python...")
print("-" * 60)

required_packages = ['flask', 'pandas', 'numpy']
try:
    import flask
    print(f"{GREEN}✓{RESET} Flask {flask.__version__} instalado")
    success_count += 1
except ImportError:
    print(f"{YELLOW}⚠{RESET} Flask não instalado")
    warnings.append("Execute: pip install Flask")

try:
    import pandas
    print(f"{GREEN}✓{RESET} Pandas {pandas.__version__} instalado")
    success_count += 1
except ImportError:
    print(f"{YELLOW}⚠{RESET} Pandas não instalado")
    warnings.append("Execute: pip install pandas")

try:
    import numpy
    print(f"{GREEN}✓{RESET} Numpy {numpy.__version__} instalado")
    success_count += 1
except ImportError:
    print(f"{YELLOW}⚠{RESET} Numpy não instalado")
    warnings.append("Execute: pip install numpy")

print()

# ============= VERIFICAR DADOS =============
print("📊 Verificando dados...")
print("-" * 60)

try:
    import pandas as pd
    
    if os.path.exists('ERP_Pedidos.csv'):
        df_erp = pd.read_csv('ERP_Pedidos.csv')
        print(f"{GREEN}✓{RESET} ERP: {len(df_erp)} pedidos")
        print(f"  Colunas: {', '.join(df_erp.columns.tolist()[:3])}...")
        success_count += 1
    
    if os.path.exists('WMS_Estoque.csv'):
        df_wms = pd.read_csv('WMS_Estoque.csv')
        print(f"{GREEN}✓{RESET} WMS: {len(df_wms)} produtos")
        print(f"  Colunas: {', '.join(df_wms.columns.tolist()[:3])}...")
        success_count += 1
    
    if os.path.exists('TMS_Transporte.csv'):
        df_tms = pd.read_csv('TMS_Transporte.csv')
        print(f"{GREEN}✓{RESET} TMS: {len(df_tms)} entregas")
        print(f"  Colunas: {', '.join(df_tms.columns.tolist()[:3])}...")
        success_count += 1
        
except Exception as e:
    errors.append(f"Erro ao ler CSVs: {str(e)}")

print()

# ============= RESUMO =============
print("=" * 60)
print("📋 RESUMO DA VALIDAÇÃO")
print("=" * 60)
print(f"{GREEN}✓ Sucesso:{RESET} {success_count}")
print(f"{YELLOW}⚠ Avisos:{RESET} {len(warnings)}")
print(f"{RED}✗ Erros:{RESET} {len(errors)}")
print()

if warnings:
    print(f"{YELLOW}Avisos:{RESET}")
    for warning in warnings:
        print(f"  • {warning}")
    print()

if errors:
    print(f"{RED}Erros encontrados:{RESET}")
    for error in errors:
        print(f"  • {error}")
    print()
    print(f"{RED}❌ Dashboard não está pronto!{RESET}")
    sys.exit(1)
else:
    print(f"{GREEN}✅ Dashboard está pronto para rodar!{RESET}")
    print()
    print("Próximos passos:")
    print("  1. Execute: python app.py")
    print("  2. Abra: http://localhost:5000")
    print("  3. Veja seu dashboard em ação!")
    print()
    print("Para deploy online:")
    print("  • Consulte: DEPLOY.md")
    print("  • Ou veja: QUICKSTART.md")
    sys.exit(0)
