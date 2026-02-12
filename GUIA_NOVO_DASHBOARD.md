# 📊 Dashboard LogiMAX - Guia de Uso

## 🎯 Visão Geral

O **Dashboard LogiMAX** é uma plataforma de inteligência logística completa com 4 gráficos interativos que fornecem insights em tempo real sobre sua operação.

---

## 📈 Gráficos Principais

### 1️⃣ **Tendência de Lead Time** (Gráfico de Linha)
- **O quê**: Evolução do tempo médio de entrega ao longo dos últimos 30 dias
- **Por quê**: Permite monitorar tendências e identificar problemas operacionais
- **Como ler**: 
  - Linha azul = Lead Time Real (dias)
  - Linha verde tracejada = Meta SLA (10 dias)
  - Visualize anomalias e picos
  
---

### 2️⃣ **Status de Pedidos** (Gráfico de Barras Horizontais)
- **O quê**: Distribuição de pedidos por status (Aprovado, Emitido, Cancelado)
- **Por quê**: Entender o fluxo de processamento de pedidos
- **Como ler**: 
  - Barras horizontais mostram quantidade de pedidos
  - Percentual do total exibido no tooltip
  - Verde = Aprovado | Azul = Emitido | Vermelho = Cancelado
  
---

### 3️⃣ **Custo Logístico por Modal** (Gráfico de Colunas)
- **O quê**: Custo total de transporte agrupado por modal (Rodoviário, Aéreo, Marítimo, Ferroviário)
- **Por quê**: Otimizar gastos com transporte
- **Como ler**: 
  - Colunas ordenas por maior custo
  - Cor diferente para cada modal
  - Inclui distância média em km
  - Percentual do custo total no tooltip
  
---

### 4️⃣ **Localização por Distância** (Gráfico de Pontos)
- **O quê**: Relação entre distância (km) e custo logístico
- **Por quê**: Analisar eficiência de custo vs. distância
- **Como ler**: 
  - Eixo X = Distância em km
  - Eixo Y = Custo em R$
  - Cada ponto = Um modal de transporte
  - Cores diferem por modal
  
---

## 🎨 7 Indicadores Estratégicos (KPIs)

1. **⏱️ Lead Time Médio** - Tempo médio de entrega (dias)
2. **📦 Fill Rate** - Taxa de preenchimento (%)
3. **💰 Receita Total** - Faturamento total (milhões)
4. **✅ Entregas Prazo** - Cumprimento de prazos (%)
5. **🔄 Rotatividade** - Velocidade de movimentação (x)
6. **🎯 Acuracidade** - Precisão de inventário (%)
7. **⚠️ Inconsistências** - Alertas de erro (número)

Cada KPI mostra:
- Valor atual
- Variação em relação ao período anterior
- Cor indicativa de status

---

## 🚀 Como Usar

### Iniciar o Dashboard

**Opção 1: Script Automático**
```batch
INICIAR_DASHBOARD.bat
```

**Opção 2: Terminal (PowerShell)**
```powershell
cd C:\Users\samantha\Documents\LOGIMAX.PROJETO-
python app.py
```

**Opção 3: Terminal (CMD)**
```cmd
cd C:\Users\samantha\Documents\LOGIMAX.PROJETO-
python app.py
```

### Acessar o Dashboard

Abra seu navegador e acesse:
```
http://localhost:5000
```

---

## 📊 Dados Utilizados

O dashboard utiliza dados de 3 fontes:

### 📋 ERP_Pedidos.csv
- Informações de pedidos
- Status dos pedidos (Aprovado, Emitido, Cancelado)
- Datas e valores

### 📦 TMS_Transporte.csv
- Dados de transporte
- Modais (Rodoviário, Aéreo, Marítimo, Ferroviário)
- Distâncias em km
- Custos logísticos

### 🏪 WMS_Estoque.csv
- Informações de estoque
- Saídas e movimentações
- Dados para cálculo de rotatividade

---

## 🎯 Funcionalidades

✅ **Gráficos Interativos**
- Hover para ver detalhes
- Zoom e pan disponível
- Legendas clicáveis

✅ **Atualização em Tempo Real**
- Botão "Atualizar" para refresh manual
- Auto-refresh a cada 60 segundos

✅ **Abas de Dados Operacionais**
- Tabela de Pedidos ERP
- Tabela de Estoque WMS
- Tabela de Transporte TMS

✅ **Design Responsivo**
- Funciona em desktop, tablet e mobile
- Tema escuro profissional

---

## 🔧 Personalizações Disponíveis

### Cores dos Gráficos
Edite as cores em `templates/index.html` na seção `:root`:

```css
--primary: #4a7bff;      /* Azul principal */
--success: #2dd4ac;      /* Verde sucesso */
--error: #ff6b6b;        /* Vermelho erro */
--warning: #fbbf24;      /* Amarelo aviso */
```

### Intervalo de Auto-Refresh
Em `templates/index.html` (JavaScript):

```javascript
setInterval(loadDashboard, 60000); // 60 segundos
```

### Limites de Dados
Em `app.py`, altere o número de linhas exibidas:

```python
df_display = df_erp.head(100)  # Altere 100 para outro valor
```

---

## 📱 Requisitos do Sistema

- **Python**: 3.8 ou superior
- **Navegador**: Chrome, Firefox, Safari, Edge (versões recentes)
- **Memória**: Mínimo 512 MB
- **Porta**: 5000 (padrão, pode ser alterada)

---

## 📦 Pacotes Necessários

```
Flask>=3.0.0
Flask-CORS>=4.0.0
pandas>=2.0.0
numpy>=1.24.0
Chart.js (via CDN)
```

Instale com:
```bash
pip install -r requirements.txt
```

---

## 🐛 Solução de Problemas

### Porta 5000 já em uso
```bash
# Alterar porta em app.py
app.run(debug=True, host='0.0.0.0', port=8000)  # Use 8000
```

### Erro ao carregar dados CSV
- Verifique se os arquivos CSV estão na mesma pasta que `app.py`
- Verifique a codificação (UTF-8 recomendado)
- Verifique se as colunas têm os nomes esperados

### Gráficos não aparecem
- Limpe o cache do navegador (CTRL+F5)
- Verifique o console (F12) para erros
- Confirme que Chart.js foi carregado

---

## 📞 Suporte

Para ajuda adicional:
1. Verifique logs no console (F12)
2. Execute `test_dashboard_data.py` para validar dados
3. Consulte a documentação em `GUIA_DASHBOARD.md`

---

## ✅ Checklist de Implementação

- [x] 4 gráficos principais (Linha, Barras, Colunas, Pontos)
- [x] 7 KPIs estratégicos
- [x] Dados com valores reais dos CSVs
- [x] Design responsivo
- [x] Temas e cores profissionais
- [x] Tabelas de dados operacionais
- [x] API Flask para dados
- [x] Auto-refresh
- [x] Documentação completa

---

**Última atualização:** 11 de fevereiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Produção
