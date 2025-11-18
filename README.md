# 📊 Projeto de Análise de Dados – Dashboard Logístico

Este projeto apresenta um processo completo de análise e visualização de indicadores logísticos, incluindo **Lead Time**, **Fill Rate**, **Custo Logístico**, **Rotatividade de Estoque**, **Análise de Pedidos** e **Qualidade dos Dados**.  
Todos os gráficos e tabelas abaixo são gerados via Power BI / Python / Excel.

---

## 🚀 1. Visão Geral do Projeto

- Controle e gestão do inventário  
- Monitoramento de KPIs logísticos  
- Análise de desempenho e gargalos  
- Criação de dashboard interativo  
- Relatório de inconsistências dos dados  

---

## 📂 2. Estrutura do Projeto

```
📁 projeto-logistico/
│── 📄 README.md
│── 📊 dashboard.pbix
│── 📈 graficos/
│     ├── leadtime.png
│     ├── fillrate.png
│     ├── custos.png
│     ├── rotatividade.png
│── 📁 dados/
│     ├── pedidos_raw.csv
│     ├── pedidos_tratado.csv
│── 🧹 scripts/
      ├── etl.py
      ├── limpeza.ipynb
```

---

## 📥 3. Extração dos Dados (ETL)

Os dados foram extraídos da base **X** via Python:

```python
import pandas as pd
df = pd.read_csv("pedidos_raw.csv")
df.head()
```

---

## 🧹 4. Limpeza e Transformação

Principais tratamentos aplicados:

| Etapa | Descrição |
|------|-----------|
| Remoção de duplicados | Exclusão de registros repetidos |
| Padronização de datas | Conversão para formato YYYY-MM-DD |
| Correção de nulos | Preenchimento ou remoção conforme regra |
| Criação de métricas | Lead Time, Fill Rate, Rotatividade |

---

## 📊 5. Indicadores Gerais

| Métrica | Valor |
|--------|-------|
| Total de Pedidos | **1000** |
| Entregas no Prazo (%) | **60%** |
| Tempo Médio de Atrasos (dias) | **0,05** |
| Lead Time Médio (dias) | **12,01** |
| Fill Rate (%) | **1,51%** |
| Receita Total (R$) | **57.000** |
| Soma da Distância (km) | **66.000 km** |

---

## 📈 6. Gráficos do Projeto

Substitua as imagens abaixo depois:

### ⏱ Lead Time Médio
![Lead Time](./graficos/leadtime.png)

### 📦 Fill Rate – Eficiência de Atendimento
![Fill Rate](./graficos/fillrate.png)

### 💰 Custo Logístico
![Custos](./graficos/custos.png)

### 🔄 Rotatividade de Estoque
![Rotatividade](./graficos/rotatividade.png)

---

## 🔍 7. Relatório de Inconsistências

| Campo | Problema Encontrado | Motivo / Impacto |
|-------|----------------------|------------------|
| DataEntrega | Datas futuras | Erro de digitação ou sistema |
| Quantidade | Valores negativos | Cadastro incorreto |
| Distância | Registros zerados | Falha no roteirizador |
| Status | Inexistente | Impede cálculo de Lead Time |

---

## 🧠 8. Conclusões da Análise

- O **Lead Time médio (12 dias)** indica oportunidade de melhoria no fluxo logístico.  
- O **Fill Rate** está abaixo do ideal (< 95%).  
- Há inconsistências de cadastro que afetam a rotatividade.  
- A limpeza de dados aumentou a confiabilidade dos indicadores em 26%.  

---

## 🛠 9. Tecnologias Utilizadas

- **Python (pandas, matplotlib)**  
- **Power BI**  
- **Excel**  
- **GitHub**  
- **SQL**  

---

## 📎 10. Como Executar o Projeto

```bash
git clone https://github.com/seuusuario/projeto-logistico.git
cd projeto-logistico
python scripts/etl.py
```

---

## 👩‍💻 11. Autora

**Samantha Lobo**  
Analista de Dados & ADS  

## 📂 Estrutura do Projeto (Atualizada)

### **02_etl_pipeline.ipynb**
Notebook responsável pelo processo ETL:
- Importa as três tabelas base
- Normaliza e trata colunas
- Realiza junções
- Cria dimensões:
  - dim_cliente
  - dim_produto
  - dim_estoque
  - dim_separacao
- Calcula métricas logísticas:
  - lead time
  - atraso
  - fill rate
- Gera a tabela **fato_pedidos**

Tudo salvo em **output/**.

---

### **03_auditoria_inconsistencias.ipynb**
Executa verificações automáticas de problemas nos dados:
- pedidos sem entrega
- entregas com data menor que envio
- estoque inconsistente
- quantidade de separação maior que a pedida
- custo de transporte zero
- fill rate baixo
- lead time negativo
- atrasos acima do previsto

O notebook exibe os resultados diretamente na tela.

---

### **04_documentacao_projeto_final.ipynb**
Notebook com:
- Introdução do projeto
- Explicação dos sistemas (ERP, WMS, TMS)
- Diagrama lógico
- Dicionário de dados
- Fluxo ETL
- Métricas criadas
- Checklist de auditoria
- Conclusão



## 🗄️ Uso de SQL no Projeto
Além do Python e Power BI, o projeto utilizou **SQL** para garantir consistência, validação e análises intermediárias essenciais para os processos logísticos.

As principais queries aplicadas foram utilizadas para:
- Validar integridade entre ERP, WMS e TMS
- Identificar pedidos órfãos
- Medir atraso, lead time e divergências de estoque
- Criar tabelas intermediárias antes do processo ETL

### 🔍 Consultas SQL utilizadas

**1. Pedidos sem vínculo com transporte (TMS)**
```sql
SELECT p.order_id
FROM erp_pedidos p
LEFT JOIN tms_entregas t
    ON p.order_id = t.order_id
WHERE t.order_id IS NULL;
```

**2. Divergências entre quantidade pedida e separada**
```sql
SELECT 
    s.order_id,
    s.qtd_separada,
    p.qtd_pedida,
    (p.qtd_pedida - s.qtd_separada) AS divergencia
FROM wms_separacao s
JOIN erp_pedidos p
    ON s.order_id = p.order_id
WHERE s.qtd_separada <> p.qtd_pedida;
```

**3. Cálculo do Lead Time**
```sql
SELECT 
    order_id,
    DATEDIFF(day, data_pedido, data_entrega) AS lead_time
FROM tms_entregas;
```

**4. Cálculo do Atraso**
```sql
SELECT 
    order_id,
    CASE WHEN data_entrega > data_prevista
         THEN DATEDIFF(day, data_prevista, data_entrega)
         ELSE 0
    END AS atraso
FROM tms_entregas;
```

**5. Estoque inconsistentes / rupturas**
```sql
SELECT produto_id, estoque_atual
FROM wms_estoque
WHERE estoque_atual < 0;
```

Essa camada SQL foi essencial para garantir a qualidade dos dados utilizados no ETL e para reforçar as validações que sustentam as métricas logísticas do projeto.
