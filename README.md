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
