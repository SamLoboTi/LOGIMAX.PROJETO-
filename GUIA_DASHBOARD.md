# 🚀 Guia de Uso - Dashboard LOGIMAX Web

## 📋 Pré-requisitos
- Python 3.8+
- pip

## 🔧 Instalação

### 1. Instale as dependências:
```bash
pip install -r requirements.txt
```

## ▶️ Executar o Dashboard

### 2. Na pasta do projeto, execute:
```bash
streamlit run dashboard_web.py
```

A aplicação abrirá automaticamente no seu navegador (geralmente em `http://localhost:8501`)

## 📊 Funcionalidades do Dashboard

### KPIs Principais
- **⏱️ Lead Time**: Tempo médio entre pedido e entrega
- **📦 Fill Rate**: Taxa de preenchimento de pedidos
- **💰 Custo Total**: Custo logístico acumulado
- **🔄 Rotatividade**: Quantas vezes o estoque se renova
- **✅ Acurácia**: Alinhamento entre estoque real e sistema

### Gráficos e Análises
- 📊 Status de pedidos (Pizza)
- 🎯 Conformidade de prazos (Barras)
- 📈 Pedidos por dia (Linha)
- 🚚 Custo por modal de transporte (Barras)
- 📦 Top 10 produtos com maior saída (Barras)
- 📊 Distribuição de níveis de estoque (Histograma)

### Filtros Disponíveis (Sidebar)
- 📅 Período de datas
- ✅ Status de pedidos (Aprovado, Emitido, Cancelado)
- 🚚 Modal de transporte (Rodoviário, Aéreo, Correios)

### Visualizações de Dados
- **Pedidos (ERP)**: Tabela com histórico de pedidos
- **Estoque (WMS)**: Informações detalhadas de inventário
- **Transportes (TMS)**: Dados de entregas e custos

## 📁 Arquivos Necessários

O dashboard utiliza os seguintes arquivos CSV (já presentes no projeto):
```
ERP_Pedidos.csv      - Dados de pedidos
WMS_Estoque.csv      - Dados de estoque
TMS_Transporte.csv   - Dados de transporte
```

## 🎨 Personalização

### Alterar cores e temas:
Edite o arquivo `dashboard_web.py` e modifique as seções de `color_discrete_map`

### Adicionar novos gráficos:
Adicione novas colunas e gráficos seguindo o padrão de estrutura do código

### Mudar período padrão:
Localize a seção `data_inicio` e `data_fim` no sidebar

## 📞 Suporte

Para mais informações sobre Streamlit:
- 📖 [Documentação Streamlit](https://docs.streamlit.io/)
- 📖 [Plotly Documentation](https://plotly.com/python/)

## 🔄 Atualização de Dados

Os dados são carregados do diretório local. Para usar dados diferentes:

1. Coloque os arquivos CSV na mesma pasta que `dashboard_web.py`
2. Verifique se as colunas correspondem aos nomes esperados:
   - **ERP_Pedidos.csv**: order_id, customer_id, product_id, data_pedido, quantidade_pedida, valor_pedido, status_pedido
   - **WMS_Estoque.csv**: product_id, estoque_inicial, entradas, saidas, estoque_final, inventario_real, data_separacao, quantidade_separada
   - **TMS_Transporte.csv**: order_id, data_envio, data_entrega, prazo_estimado, prazo_real, custo_transporte, distancia_km, modal

3. Reinicie o dashboard (`Ctrl+C` e execute novamente o comando streamlit)

## 💡 Dicas

- Use `Ctrl+C` no terminal para parar o dashboard
- O Streamlit auto-recarrega quando você salva alterações no arquivo
- Para deploy em produção, consulte: [Streamlit Cloud](https://streamlit.io/cloud)

---

**Criado em 10/02/2026 | LOGIMAX Dashboard v1.0**
