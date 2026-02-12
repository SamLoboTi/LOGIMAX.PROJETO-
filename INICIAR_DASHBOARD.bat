@echo off
REM Script para iniciar o dashboard LogiMAX

title LogiMAX Dashboard - Servidor
cls

echo ====================================================================
echo LogiMAX | Logistics Intelligence Platform
echo ====================================================================
echo.

REM Verificar se o Flask está instalado
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Flask não está instalado. Instalando dependências...
    pip install -r requirements.txt
)

REM Iniciar o servidor
echo.
echo ✅ Iniciando o servidor Flask...
echo.
echo 📊 O dashboard estará disponível em: http://localhost:5000
echo 🔌 Pressione CTRL+C para parar o servidor
echo.
echo ====================================================================
echo.

python app.py
pause
