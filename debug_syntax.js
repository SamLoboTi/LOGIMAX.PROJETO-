
        let charts = {};

        document.addEventListener('DOMContentLoaded', () => {
            loadDashboard();
            setInterval(loadDashboard, 60000);
        });

        async function loadDashboard() {
            try {
                await Promise.all([
                    loadKPIs(),
                    loadCharts(),
                    loadTabelas()
                ]);
                updateTime();
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            }
        }

        async function loadKPIs() {
            try {
                const response = await fetch('/api/kpis');
                const data = await response.json();

                const kpis = [
                    {
                        class: 'kpi-1',
                        icon: '⏱️',
                        label: 'Lead Time Médio',
                        value: data.lead_time_medio,
                        unit: 'dias',
                        change: (data.lead_time_variacao > 0 ? '+' : '') + data.lead_time_variacao + '%',
                        changeClass: data.lead_time_variacao > 0 ? 'negative' : ''
                    },
                    {
                        class: 'kpi-2',
                        icon: '📦',
                        label: 'Fill Rate',
                        value: data.fill_rate,
                        unit: '%',
                        change: '+' + data.fill_rate_variacao + '%'
                    },
                    {
                        class: 'kpi-3',
                        icon: '💰',
                        label: 'Receita Total',
                        value: (data.receita_total / 1000).toFixed(1),
                        unit: 'mil',
                        change: '+' + data.receita_variacao + '%'
                    },
                    {
                        class: 'kpi-4',
                        icon: '✅',
                        label: 'Entregas Prazo',
                        value: data.entregas_prazo,
                        unit: '%',
                        change: '+' + data.entregas_prazo_variacao + '%'
                    },
                    {
                        class: 'kpi-5',
                        icon: '🔄',
                        label: 'Rotatividade',
                        value: data.rotatividade,
                        unit: 'x',
                        change: '+' + data.rotatividade_variacao + '%'
                    },
                    {
                        class: 'kpi-6',
                        icon: '🎯',
                        label: 'Acuracidade',
                        value: data.acuracia,
                        unit: '%',
                        change: '+' + data.acuracia_variacao + '%'
                    },
                    {
                        class: 'kpi-7',
                        icon: '⚠️',
                        label: 'Inconsistências',
                        value: data.inconsistencias,
                        unit: 'alertas',
                        change: data.inconsistencias_variacao + '%',
                        changeClass: data.inconsistencias_variacao > 0 ? 'negative' : ''
                    }
                ];

                const html = kpis.map(kpi => `
                    <div class="kpi-card ${kpi.class}">
                        <div>
                            <div class="kpi-icon">${kpi.icon}</div>
                            <div class="kpi-label">${kpi.label}</div>
                        </div>
                        <div class="kpi-bottom">
                            <div class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></div>
                            <div class="kpi-change ${kpi.changeClass || ''}">${kpi.change}</div>
                        </div>
                    </div>
                `).join('');

                document.getElementById('kpis-container').innerHTML = html;
            } catch (error) {
                console.error('Erro ao carregar KPIs:', error);
                document.getElementById('kpis-container').innerHTML = `<div class="error-message" style="grid-column: 1 / -1">Erro ao carregar KPIs: ${error.message}</div>`;
            }
        }

        async function loadCharts() {
            try {
                // Dados padrão com valores realistas
                let status = { labels: ['Aprovado', 'Emitido', 'Cancelado'], data: [5980, 5590, 1430] };
                let pedidos = { labels: ['01/03', '02/03', '03/03', '04/03', '05/03', '06/03'], data: [8, 7.5, 9, 8.5, 10, 9.5] };
                let custos = { labels: ['Rodoviário', 'Aéreo', 'Marítimo', 'Ferroviário'], data: [41200, 18500, 12300, 8900], distancia: [1500, 2800, 5200, 1200] };

                try {
                    const statusRes = await fetch('/api/status-pedidos');
                    if (statusRes.ok) {
                        status = await statusRes.json();
                        console.log('✓ Status Pedidos carregado:', status);
                    }
                } catch (e) { console.error('Erro ao carregar status:', e); }

                try {
                    const pedidosRes = await fetch('/api/pedidos-por-dia');
                    if (pedidosRes.ok) {
                        pedidos = await pedidosRes.json();
                        console.log('✓ Pedidos por Dia carregado:', pedidos);
                    }
                } catch (e) { console.error('Erro ao carregar pedidos:', e); }

                try {
                    const custosRes = await fetch('/api/custo-por-modal');
                    if (custosRes.ok) {
                        custos = await custosRes.json();
                        console.log('✓ Custo por Modal carregado:', custos);
                    }
                } catch (e) { console.error('Erro ao carregar custos:', e); }

                // Gerar dados de scatter (Custo x Distância x Modal)
                const scatterData = [];
                if (custos.labels && custos.data) {
                    const cores = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
                    custos.labels.forEach((label, idx) => {
                        const distancia = Array.isArray(custos.distancia) ? custos.distancia[idx] : 0;
                        scatterData.push({
                            label: label,
                            data: [{ x: distancia || Math.random() * 5000, y: custos.data[idx] }],
                            backgroundColor: cores[idx],
                            borderColor: cores[idx],
                            borderWidth: 2,
                            pointRadius: 8,
                            pointHoverRadius: 10
                        });
                    });
                }

                // Criar gráficos IMEDIATAMENTE com os dados carregados
                console.log('Criando gráficos com dados:', { pedidos, status, custos, scatterData });

                if (pedidos.labels && pedidos.data && pedidos.data.length > 0) {
                    createLineChart('chart-pedidos', pedidos.labels, pedidos.data);
                } else {
                    console.warn('Dados de pedidos incompletos:', pedidos);
                }

                if (status.labels && status.data && status.data.length > 0) {
                    createStatusChart('chart-status', status.labels, status.data);
                } else {
                    console.warn('Dados de status incompletos:', status);
                }

                if (custos.labels && custos.data && custos.data.length > 0) {
                    createBarChart('chart-custos', custos.labels, custos.data, custos.distancia || []);
                } else {
                    console.warn('Dados de custos incompletos:', custos);
                }

                if (scatterData.length > 0) {
                    createScatterChart('chart-scatter', scatterData);
                } else {
                    console.warn('Sem dados para scatter chart');
                }

            } catch (error) {
                console.error('Erro ao carregar gráficos:', error);
                document.getElementById('charts-container').innerHTML = `<div class="error-message" style="grid-column: 1 / -1">Erro ao carregar gráficos: ${error.message}</div>`;
            }
        }

        function createLineChart(chartId, labels, data) {
            if (typeof Chart === 'undefined') {
                console.error('Chart.js não carregado');
                document.getElementById(chartId).parentNode.innerHTML = '<div class="error-message">Erro: Chart.js não carregou. Verifique sua conexão.</div>';
                return;
            }
            console.log(`Criando gráfico de linha: ${chartId}`);
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                console.error('❌ Canvas não encontrado:', chartId);
                return;
            }

            console.log(`✓ Canvas encontrado: ${chartId}`);

            if (charts[chartId]) {
                charts[chartId].destroy();
            }

            try {
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('❌ Contexto 2D não obtido:', chartId);
                    return;
                }

                // Gradient para a área sob a linha
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(74, 123, 255, 0.2)');
                gradient.addColorStop(1, 'rgba(74, 123, 255, 0)');

                charts[chartId] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Lead Time Real',
                                data: data,
                                borderColor: '#4a7bff',
                                backgroundColor: gradient,
                                borderWidth: 3,
                                fill: true,
                                tension: 0.45,
                                pointRadius: 5,
                                pointBackgroundColor: '#4a7bff',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointHoverRadius: 7,
                                pointHoverBorderWidth: 3
                            },
                            {
                                label: 'Meta SLA',
                                data: Array(labels.length).fill(10),
                                borderColor: '#2dd4ac',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                fill: false,
                                tension: 0.45,
                                pointRadius: 0,
                                pointHoverRadius: 0
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { intersect: false, mode: 'index' },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    color: '#f1f5f9',
                                    padding: 12,
                                    font: { size: 11, weight: '500' },
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                padding: 10,
                                titleFont: { size: 12, weight: 'bold' },
                                bodyFont: { size: 11 },
                                borderColor: '#4a7bff',
                                borderWidth: 1,
                                cornerRadius: 4,
                                callbacks: {
                                    label: function (context) {
                                        if (context.datasetIndex === 0) {
                                            return 'Lead Time: ' + context.parsed.y.toFixed(1) + ' dias';
                                        } else {
                                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + ' dias';
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 6,
                                max: 16,
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 10, weight: '500' },
                                    stepSize: 2,
                                },
                                grid: {
                                    color: 'rgba(58, 69, 86, 0.1)',
                                    drawBorder: false
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 10, weight: '500' },
                                },
                                grid: { display: false, drawBorder: false }
                            }
                        }
                    });
                console.log('✓ Gráfico de linha criado com sucesso:', chartId);
            } catch (error) {
                console.error('❌ Erro ao criar gráfico de linha:', error);
            }
        }

        function createStatusChart(chartId, labels, data) {
            if (typeof Chart === 'undefined') { return; }
            console.log(`Criando gráfico de status: ${chartId}`);
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                console.error('❌ Canvas não encontrado:', chartId);
                return;
            }

            if (charts[chartId]) {
                charts[chartId].destroy();
            }

            try {            // Calcular percentuais e cores
                const total = data.reduce((a, b) => a + b, 0);
                const percentuais = data.map(d => ((d / total) * 100).toFixed(1));
                const cores = ['#2dd4ac', '#3b82f6', '#ef4444'];

                const ctx = canvas.getContext('2d');

                charts[chartId] = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Quantidade de Pedidos',
                            data: data,
                            backgroundColor: cores,
                            borderColor: cores,
                            borderRadius: 6,
                            borderSkipped: false,
                            borderWidth: 0,
                            hoverBorderColor: '#fff',
                            hoverBorderWidth: 2,
                            barThickness: 'flex',
                            maxBarThickness: 60
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                padding: 12,
                                titleFont: { size: 13, weight: 'bold' },
                                bodyFont: { size: 12 },
                                borderColor: '#3b82f6',
                                borderWidth: 1.5,
                                cornerRadius: 6,
                                callbacks: {
                                    title: function (context) {
                                        return context[0].label;
                                    },
                                    label: function (context) {
                                        const idx = context.dataIndex;
                                        const value = context.parsed.x;
                                        const percentage = percentuais[idx];
                                        return [
                                            value.toLocaleString('pt-BR') + ' pedidos',
                                            percentage + '% do total'
                                        ];
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: total,
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 11, weight: '500' },
                                    callback: function (value) {
                                        return ((value / total) * 100).toFixed(0) + '%';
                                    }
                                },
                                grid: {
                                    color: 'rgba(58, 69, 86, 0.1)',
                                    drawBorder: false
                                }
                            },
                            y: {
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 12, weight: '600' }
                                },
                                grid: { display: false, drawBorder: false }
                            }
                        }
                    }
                });
                console.log('✓ Gráfico de status criado com sucesso:', chartId);
            } catch (error) {
                console.error('❌ Erro ao criar gráfico de status:', error);
            }
        }

        function createBarChart(chartId, labels, data, distancia = []) {
            if (typeof Chart === 'undefined') { return; }
            console.log(`Criando gráfico de barras: ${chartId}`);
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                console.error('❌ Canvas não encontrado:', chartId);
                return;
            }

            if (charts[chartId]) {
                charts[chartId].destroy();
            }

            try {

                // Ordenar dados do maior para o menor
                const sorted = labels.map((label, index) => ({
                    label,
                    value: data[index],
                    distancia: distancia[index] || 0
                }))
                    .sort((a, b) => b.value - a.value);

                const sortedLabels = sorted.map(d => d.label);
                const sortedValues = sorted.map(d => d.value);
                const sortedDistancia = sorted.map(d => d.distancia);

                // Criar gradientes dinâmicos para cada barra
                const ctx = canvas.getContext('2d');

                const gradients = sortedValues.map((val, idx) => {
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    if (idx === 0) {
                        // Primeira barra (maior custo) - Gradiente azul
                        gradient.addColorStop(0, '#3b82f6');
                        gradient.addColorStop(1, '#2563eb');
                    } else if (idx === 1) {
                        // Segunda barra - Gradiente laranja
                        gradient.addColorStop(0, '#f59e0b');
                        gradient.addColorStop(1, '#d97706');
                    } else if (idx === 2) {
                        // Terceira barra - Gradiente verde
                        gradient.addColorStop(0, '#2dd4ac');
                        gradient.addColorStop(1, '#1aa179');
                    } else {
                        // Demais barras - Gradiente roxo
                        gradient.addColorStop(0, '#a855f7');
                        gradient.addColorStop(1, '#7e22ce');
                    }
                    return gradient;
                });

                charts[chartId] = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: sortedLabels,
                        datasets: [{
                            label: 'Custo Logístico (R$)',
                            data: sortedValues,
                            backgroundColor: gradients,
                            borderRadius: 8,
                            borderSkipped: false,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            hoverBorderColor: '#fff',
                            hoverBorderWidth: 2
                        }]
                    },
                    options: {
                        indexAxis: 'x',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                padding: 12,
                                titleFont: { size: 13, weight: 'bold' },
                                bodyFont: { size: 12 },
                                borderColor: '#3b82f6',
                                borderWidth: 1.5,
                                cornerRadius: 6,
                                callbacks: {
                                    label: function (context) {
                                        const value = context.parsed.y;
                                        const percentage = ((value / sortedValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                        const dist = sortedDistancia[context.dataIndex];
                                        return [
                                            'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
                                            percentage + '% do custo total',
                                            'Distância: ' + dist.toFixed(0) + ' km'
                                        ];
                                    },
                                    afterLabel: function (context) {
                                        if (context.dataIndex === 0) {
                                            return '⚠️ Maior custo logístico (' + ((sortedValues[0] / sortedValues.reduce((a, b) => a + b, 0)) * 100).toFixed(0) + '%)';
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 11, weight: '500' },
                                    callback: function (value) {
                                        return 'R$ ' + value.toLocaleString('pt-BR');
                                    }
                                },
                                grid: {
                                    color: 'rgba(58, 69, 86, 0.15)',
                                    drawBorder: false,
                                    lineWidth: 1
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 11, weight: '500' }
                                },
                                grid: {
                                    display: false,
                                    drawBorder: false
                                }
                            }
                        }
                    }
                });
                console.log('✓ Gráfico de barras criado com sucesso:', chartId);
            } catch (error) {
                console.error('❌ Erro ao criar gráfico de barras:', error);
            }
        }

        function createScatterChart(chartId, datasets) {
            if (typeof Chart === 'undefined') { return; }
            console.log(`Criando scatter chart: ${chartId}`);
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                console.error('❌ Canvas não encontrado:', chartId);
                return;
            }

            if (charts[chartId]) {
                charts[chartId].destroy();
            }

            try {
                const ctx = canvas.getContext('2d');

                charts[chartId] = new Chart(ctx, {
                    type: 'scatter',
                    data: {
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    color: '#f1f5f9',
                                    padding: 16,
                                    font: { size: 11, weight: '500' },
                                    usePointStyle: true,
                                    boxWidth: 8
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                padding: 12,
                                titleFont: { size: 13, weight: 'bold' },
                                bodyFont: { size: 12 },
                                borderColor: '#3b82f6',
                                borderWidth: 1.5,
                                cornerRadius: 6,
                                callbacks: {
                                    title: function (context) {
                                        return context[0].dataset.label;
                                    },
                                    label: function (context) {
                                        return [
                                            'Distância: ' + context.parsed.x.toFixed(0) + ' km',
                                            'Custo: R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 })
                                        ];
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                type: 'linear',
                                position: 'bottom',
                                title: {
                                    display: true,
                                    text: 'Distância (km)',
                                    color: '#94a3b8',
                                    font: { size: 12, weight: '600' }
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 11 },
                                    callback: function (value) {
                                        return value.toLocaleString('pt-BR');
                                    }
                                },
                                grid: {
                                    color: 'rgba(58, 69, 86, 0.15)',
                                    drawBorder: false
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Custo Logístico (R$)',
                                    color: '#94a3b8',
                                    font: { size: 12, weight: '600' }
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 11 },
                                    callback: function (value) {
                                        return 'R$ ' + value.toLocaleString('pt-BR');
                                    }
                                },
                                grid: {
                                    color: 'rgba(58, 69, 86, 0.15)',
                                    drawBorder: false
                                }
                            }
                        }
                    }
                });
                console.log('✓ Scatter chart criado com sucesso:', chartId);
            } catch (error) {
                console.error('❌ Erro ao criar scatter chart:', error);
            }
        }

        async function loadTabelas() {
            try {
                const [pedidosRes, estoqueRes, transporteRes] = await Promise.all([
                    fetch('/api/pedidos-tabela'),
                    fetch('/api/estoque-tabela'),
                    fetch('/api/transporte-tabela')
                ]);

                const pedidos = await pedidosRes.json();
                const estoque = await estoqueRes.json();
                const transporte = await transporteRes.json();

                document.getElementById('pedidos').innerHTML = createTable(pedidos);
                document.getElementById('estoque').innerHTML = createTable(estoque);
                document.getElementById('transporte').innerHTML = createTable(transporte);
            } catch (error) {
                console.error('Erro ao carregar tabelas:', error);
            }
        }

        function createTable(data) {
            if (!data || data.length === 0) {
                return '<p style="color: var(--text-secondary);">Nenhum dado disponível</p>';
            }

            const keys = Object.keys(data[0]);
            const html = `
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                ${keys.map(k => `<th>${k.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 10).map(row => `
                                <tr>
                                    ${keys.map(k => {
                let value = row[k];
                if (k === 'status_pedido' || k === 'status') {
                    const status = String(value).toLowerCase();
                    let statusClass = 'status-emitido';
                    if (status.includes('aprovado')) statusClass = 'status-approved';
                    else if (status.includes('cancelado')) statusClass = 'status-cancelado';
                    return `<td><span class="status-badge ${statusClass}">${value}</span></td>`;
                }
                return `<td>${value}</td>`;
            }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            return html;
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        function updateTime() {
            const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('update-time').textContent = now;
        }

        function refreshDashboard() {
            const btn = event.target.closest('.refresh-btn');
            btn.classList.add('loading');
            btn.disabled = true;

            loadDashboard().then(() => {
                btn.classList.remove('loading');
                btn.disabled = false;
            }).catch(error => {
                console.error('Erro ao atualizar:', error);
                btn.classList.remove('loading');
                btn.disabled = false;
            });
        }
    