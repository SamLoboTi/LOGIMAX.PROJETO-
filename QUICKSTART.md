# 🚀 QUICKSTART - Dashboard LOGIMAX (5 Minutos)

## ⚡ Começar Agora

### 1️⃣ Rodar Localmente (Windows)

```bash
# Duplo clique em:
INICIAR.bat
```

Pronto! Seu dashboard abrirá em `http://localhost:5000`

---

### 2️⃣ Rodar com Linha de Comando

```bash
# Instalar dependências
pip install -r requirements.txt

# Executar
python app.py

# Abrir: http://localhost:5000
```

---

### 3️⃣ Deploy Online (GRÁTIS em 3 minutos)

#### Opção A: Render (Mais Fácil)

```bash
# 1. Inicializar Git
git init
git add .
git commit -m "Dashboard LOGIMAX"

# 2. Criar repositório no GitHub
# 3. Push
git push origin main

# 4. Acessar https://render.com
# 5. Clicar: "New+" → "Web Service"
# 6. Conectar GitHub
# 7. Deploy automático!
```

**Sua URL**: `https://seu-dashboard.onrender.com` ✅

#### Opção B: Railway (Ainda Mais Fácil)

1. Acesse: https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Selecione seu repositório
4. Deploy em 2 minutos! 🎉

**Sua URL**: `https://seu-app.up.railway.app` ✅

---

## 📊 O que você vai ver

### Dashboard Completo com:

- 📈 **6 KPIs Principais** em cartões
  - Lead Time, Fill Rate, Custos, Rotatividade, Acurácia, Conformidade

- 📉 **6 Gráficos Interativos**
  - Pizza (Status), Barras (Prazos, Custos, Top 10), Linha (Pedidos), Histograma (Estoque)

- 📋 **3 Abas com Tabelas**
  - Pedidos (ERP), Estoque (WMS), Transportes (TMS)

- 🔄 **Auto-refresh** a cada 60 segundos

- 📱 **100% Responsivo** (Desktop, Tablet, Celular)

---

## 📁 Arquivos Necessários

✅ Todos já estão na pasta:

```
✓ app.py                    (Backend)
✓ templates/index.html      (Frontend)
✓ requirements.txt          (Dependências)
✓ ERP_Pedidos.csv          (Dados)
✓ WMS_Estoque.csv          (Dados)
✓ TMS_Transporte.csv       (Dados)
```

---

## 🎯 Próximas Ações

### Imediato (Hoje)
- [ ] Rodar localmente com `INICIAR.bat`
- [ ] Testar gráficos e KPIs
- [ ] Compartilhar com equipe

### Curto Prazo (Semana)
- [ ] Deploy em Render/Railway
- [ ] Copiar URL final
- [ ] Adicionar à documentação

### Médio Prazo (Mês)
- [ ] Atualizar dados regularmente
- [ ] Adicionar filtros avançados
- [ ] Conectar banco de dados

---

## ❓ FAQ Rápido

### P: Como mudar a porta?
**R**: Edite `app.py` linha final para `port=8080`

### P: Posso acessar de qualquer lugar?
**R**: Sim! Deploy online e compartilhe URL

### P: Dados são confidenciais?
**R**: Coloque o dashboard em servidor privado ou adicione senha

### P: Quanto custa?
**R**: $0! Render e Railway têm tiers grátis

### P: Preciso fechar o terminal?
**R**: Sim (localmente). Deploy online roda 24/7

---

## 🔗 Links Úteis

- 📖 [Render Docs](https://docs.render.com/) - Deploy
- 📖 [Railway Docs](https://docs.railway.app/) - Deploy alternativo
- 📖 [Chart.js](https://www.chartjs.org/) - Gráficos

---

## 💡 Dicas

1. **Testar localmente primeiro** com `INICIAR.bat`
2. **Compartilhar URL** após deploy
3. **Atualizar CSVs** regularmente via GitHub
4. **Monitorar** performance em produção

---

## ✅ Checklist Final

- [ ] Dependências instaladas
- [ ] App roda em localhost:5000
- [ ] Gráficos aparecem corretamente
- [ ] CSVs carregam sem erro
- [ ] Repositório GitHub criado
- [ ] Deploy feito (Render ou Railway)
- [ ] URL testada e funciona
- [ ] Equipe informada

---

**Você está a 5 minutos de um dashboard em produção!** 🚀

Qualquer dúvida, consulte `DEPLOY.md` para guia completo.

