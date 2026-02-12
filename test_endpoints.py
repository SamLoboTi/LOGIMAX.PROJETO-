#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de teste dos endpoints do Dashboard LogiMAX
"""
import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5000'

def test_endpoints():
    print("=" * 70)
    print("🧪 TESTANDO ENDPOINTS - LogiMAX Dashboard")
    print("=" * 70)
    time.sleep(2)  # Aguardar inicialização
    
    endpoints = [
        '/api/kpis',
        '/api/pedidos-por-dia',
        '/api/custo-por-modal',
        '/api/status-pedidos',
        '/api/health'
    ]
    
    for endpoint in endpoints:
        print(f"\n📡 Testando: {endpoint}")
        print("-" * 70)
        try:
            response = requests.get(BASE_URL + endpoint, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Status: {response.status_code} OK")
                print(f"📊 Dados retornados:")
                print(json.dumps(data, indent=2, ensure_ascii=False)[:500] + "...")
            else:
                print(f"❌ Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Erro: {str(e)}")
    
    print("\n" + "=" * 70)
    print("✅ Teste completo!")
    print("=" * 70)

if __name__ == '__main__':
    test_endpoints()
