# 📊 Projeto de Análise de Dados LOGIMAX – Dashboard Logístico


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
│ ├── leadtime.png
│ ├── fillrate.png
│ ├── custos.png
│ ├── rotatividade.png
│── 📁 dados/
│ ├── pedidos_raw.csv
│ ├── pedidos_tratado.csv
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
