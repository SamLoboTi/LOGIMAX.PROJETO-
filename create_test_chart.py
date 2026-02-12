"""Teste de disponibilidade do Chart.js no navegador"""
import requests

html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>Teste Chart.js</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js"></script>
</head>
<body>
    <h1>Teste de Disponibilidade Chart.js</h1>
    <canvas id="testChart" width="400" height="100"></canvas>
    
    <script>
        console.log("Window.Chart:", typeof window.Chart);
        
        if (typeof Chart === 'undefined') {
            document.body.innerHTML += '<p style="color: red;">❌ Chart.js NÃO foi carregado!</p>';
        } else {
            document.body.innerHTML += '<p style="color: green;">✅ Chart.js foi carregado com sucesso!</p>';
            
            // Tentar criar um gráfico simples
            try {
                const ctx = document.getElementById('testChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['A', 'B', 'C'],
                        datasets: [{
                            label: 'Teste',
                            data: [10, 20, 30]
                        }]
                    }
                });
                document.body.innerHTML += '<p style="color: green;">✅ Gráfico criado com sucesso!</p>';
            } catch(e) {
                document.body.innerHTML += '<p style="color: red;">❌ Erro ao criar gráfico: ' + e.message + '</p>';
            }
        }
    </script>
</body>
</html>
"""

# Salvar template
with open('test_chartjs.html', 'w') as f:
    f.write(html_template)

print("✅ Arquivo test_chartjs.html criado!")
print("   Abra em: http://localhost:5000/test_chartjs.html")
print("   (ou copie para a pasta do Flask)")
