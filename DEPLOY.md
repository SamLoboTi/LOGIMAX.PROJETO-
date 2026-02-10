# 🚀 Guia de Deploy - Dashboard LOGIMAX

## 📋 Novo Dashboard Flask + Frontend Web

Dashboard agora com:
- ✅ **Backend Flask** com API REST
- ✅ **Frontend HTML/CSS/JS moderno** e responsivo
- ✅ **Gráficos em tempo real** com Chart.js
- ✅ **Acesso permanente** via URL
- ✅ **Sem necessidade de abrir terminal** após deploy

---

## 🏃 Teste Local (Antes de Deploy)

### 1. Instalar dependências:
```bash
pip install -r requirements.txt
```

### 2. Executar o app:
```bash
python app.py
```

### 3. Acessar no navegador:
```
http://localhost:5000
```

O dashboard deve abrir automaticamente com todos os gráficos, KPIs e tabelas!

---

## 🌐 Deploy Online (Acesso Permanente)

Escolha uma dessas plataformas **GRATUITAS**:

### **Opção 1: Render (RECOMENDADO - Mais Fácil)**

#### Passo 1: Preparar repositório GitHub
```bash
git init
git add .
git commit -m "Dashboard LOGIMAX v1"
git push origin main
```

#### Passo 2: Conectar ao Render
1. Acesse: https://render.com (crie conta)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `logimax-dashboard`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`
5. Deploy!

**URL gerada**: `https://logimax-dashboard-xxxx.onrender.com`

---

### **Opção 2: Railway.app (Alternativa)**

1. Acesse: https://railway.app (crie conta)
2. Clique em "New Project" → "Deploy from GitHub"
3. Selecione seu repositório
4. Railroad detecta `requirements.txt` automaticamente
5. Deploy em 2 minutos!

**URL gerada**: `https://logimax-dashboard-prod.up.railway.app`

---

### **Opção 3: Heroku (Antigo, mas funciona)**

#### Arquivo `Procfile` (criar na raiz):
```
web: gunicorn app:app
```

#### Deploy:
```bash
heroku login
heroku create logimax-dashboard
git push heroku main
heroku open
```

**URL gerada**: `https://logimax-dashboard-xxxx.herokuapp.com`

---

### **Opção 4: Azure App Service (Microsoft)**

1. Acesse: https://portal.azure.com
2. Crie um "App Service"
3. Publique com VS Code
4. Deploy automático!

---

## 🔄 Fluxo de Atualização de Dados

Os dados são carregados **automaticamente** do seu repositório:

1. **Atualizar CSVs** localmente
2. **Push para GitHub**:
   ```bash
   git add *.csv
   git commit -m "Dados atualizados"
   git push origin main
   ```
3. **Render/Railway redeploy automático** em ~2 minutos
4. **Dashboard atualizado** online!

---

## 📊 Funcionalidades do Dashboard

### ✅ KPIs em Tempo Real:
- ⏱️ Lead Time Médio
- 📦 Fill Rate
- 💰 Custo Total
- 🔄 Rotatividade
- ✅ Acurácia Inventário
- 🎯 Conformidade de Prazos

### 📈 Gráficos Interativos:
- Status de Pedidos (Pizza)
- Conformidade de Prazos (Barras)
- Pedidos por Dia (Linha)
- Custo por Modal (Barras)
- Top 10 Produtos (Barras)
- Distribuição de Estoque (Histograma)

### 📋 Tabelas Completas:
- Pedidos (ERP)
- Estoque (WMS)
- Transportes (TMS)

### 🔄 Auto-atualização:
- Dashboard atualiza a cada 60 segundos
- Botão manual "Atualizar"
- Hora da última atualização exibida

---

## 🛠️ Troubleshooting

### Erro: "Não encontra arquivos CSV"
**Solução**: Coloque os CSVs na mesma pasta do `app.py`
```
projeto/
├── app.py
├── templates/
├── ERP_Pedidos.csv
├── WMS_Estoque.csv
└── TMS_Transporte.csv
```

### Erro: "Porta já em uso"
**Solução**:
```bash
# Encontre o processo na porta 5000
netstat -ano | findstr :5000

# Mate o processo (Windows)
taskkill /PID <PID> /F
```

### Dashboard lento
**Solução**: 
- Limitar a 10 MB os CSVs
- Considerar banco de dados (PostgreSQL)

### Gráficos não aparecem
**Solução**: 
- Abrir DevTools (F12)
- Verificar Console para erros de API
- Restart do app

---

## 📝 Estrutura de Arquivos

```
LOGIMAX.PROJETO-/
├── app.py                    # Backend Flask
├── requirements.txt          # Dependências Python
├── Procfile                  # Deploy Heroku
├── .gitignore               # Ignorar arquivos
├── README.md                # Documentação
├── templates/
│   └── index.html           # Frontend
├── ERP_Pedidos.csv          # Dados
├── WMS_Estoque.csv          # Dados
└── TMS_Transporte.csv       # Dados
```

---

## 🔐 Segurança em Produção

Para melhorar segurança, adicione ao `app.py`:

```python
app = Flask(__name__)
app.config['ENV'] = 'production'
app.config['DEBUG'] = False
```

---

## 💡 Próximos Passos

1. ✅ Deploy online (escolha plataforma acima)
2. ✅ Compartilhar URL com equipe
3. ✅ Atualizar dados regularmente
4. ✅ Monitorar performance
5. ✅ Adicionar autenticação (senha)
6. ✅ Integrar com banco de dados real

---

## 📞 Suporte

- 📖 [Documentação Flask](https://flask.palletsprojects.com/)
- 📖 [Render Docs](https://docs.render.com/)
- 📖 [Railway Docs](https://docs.railway.app/)
- 📖 [Chart.js Docs](https://www.chartjs.org/)

---

## 🎉 Pronto para Deploy!

Seu dashboard está 100% pronto. Escolha uma plataforma acima e deploy em minutos!

**Exemplo de URL final**: `https://logimax-dashboard.onrender.com`

Compartilhe esse link com sua equipe e todos conseguem acessar o dashboard em tempo real! 🚀

---

**Dashboard LOGIMAX v2.0 | Frontend + Backend | 10/02/2026**
