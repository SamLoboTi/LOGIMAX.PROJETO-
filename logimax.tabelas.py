# Databricks notebook source
!pip install faker

# COMMAND ----------

import pandas as pd
from faker import Faker
import random
from datetime import timedelta
import numpy as np

fake = Faker("pt_BR")

# ---------- ERP ----------
num_registros = 1000
erp = []
for i in range(num_registros):
    data_pedido = fake.date_between(start_date='-180d', end_date='today')
    quantidade = random.randint(1, 50)
    valor = round(random.uniform(30, 1200), 2)
    erp.append({
        "order_id": f"ORD-{i+1:05d}",
        "customer_id": random.randint(1, 500),
        "product_id": random.randint(1, 200),
        "data_pedido": data_pedido,
        "quantidade_pedida": quantidade,
        "valor_pedido": valor,
        "status_pedido": random.choice(["aprovado", "emitido", "cancelado"])
    })
df_erp = pd.DataFrame(erp)

# ---------- WMS ----------
wms = []
for product_id in range(1, 201):
    estoque_inicial = random.randint(20, 500)
    entradas = random.randint(0, 300)
    saídas = random.randint(0, estoque_inicial + entradas)
    estoque_final = estoque_inicial + entradas - saídas
    inventario_real = estoque_final + random.randint(-5, 5)
    data_separacao = fake.date_between(start_date='-120d', end_date='today')
    quantidade_separada = max(0, saídas - random.randint(0, 5))
    wms.append({
        "product_id": product_id,
        "estoque_inicial": estoque_inicial,
        "entradas": entradas,
        "saidas": saídas,
        "estoque_final": estoque_final,
        "inventario_real": inventario_real,
        "data_separacao": data_separacao,
        "quantidade_separada": quantidade_separada
    })
df_wms = pd.DataFrame(wms)

# ---------- TMS ----------
tms = []
for i in range(num_registros):
    order_id = f"ORD-{i+1:05d}"
    data_envio = df_erp.loc[i, "data_pedido"] + timedelta(days=random.randint(1, 4))
    prazo_estimado = random.randint(2, 12)
    prazo_real = prazo_estimado + random.choice([-2, -1, 0, 1, 2])
    data_entrega = data_envio + timedelta(days=prazo_real)
    tms.append({
        "order_id": order_id,
        "data_envio": data_envio,
        "data_entrega": data_entrega,
        "prazo_estimado": prazo_estimado,
        "prazo_real": prazo_real,
        "custo_transporte": round(random.uniform(20, 350), 2),
        "distancia_km": round(random.uniform(5, 1500), 2),
        "modal": random.choice(["Rodoviário", "Aéreo", "Correios"])
    })
df_tms = pd.DataFrame(tms)

df_erp.head(), df_wms.head(), df_tms.head()

# COMMAND ----------

# MAGIC %md
# MAGIC Onde você já está gerando as tabelas fake do ERP, WMS e TMS
# MAGIC ✔ Geração de CSV/SQL
# MAGIC ✔ Pequena exploração inicial (shape, head…)