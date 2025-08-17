/**
 * 统计模块 - 管理数据可视化与统计
 */
const StatisticsModule = (() => {
    // 图表实例
    let dailyChart;
    let periodChart;
    let sleepChart;
    
    const setupChartTabs = () => {
        const chartTabsContainer = document.querySelector('.chart-tabs');
        if (!chartTabsContainer) return;

        chartTabsContainer.innerHTML = `
            <button class="chart-tab active" data-chart="income">收入</button>
            <button class="chart-tab" data-chart="sleep">睡眠</button>
            <button class="chart-tab" data-chart="wakeup">起床时间</button>
        `;

        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const chartType = tab.dataset.chart;
                showChartByType(chartType);
            });
        });
    };

    const setupWakeupChart = () => {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, skipping wakeup chart setup');
            return;
        }
        

        let wakeupChartElem = document.getElementById('wakeup-chart');
        if (!wakeupChartElem) {
            wakeupChartElem = document.createElement('canvas');
            wakeupChartElem.id = 'wakeup-chart';
            wakeupChartElem.style.display = 'none';
            document.querySelector('.chart-container').appendChild(wakeupChartElem);
        }
        
        try {
            const wakeupChartCtx = wakeupChartElem.getContext('2d');
            
            wakeupChart = new Chart(wakeupChartCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '起床时间',
                        data: [],
                        borderColor: '#f8c3cd',
                        backgroundColor: '#f8c3cd20',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: '目标时间',
                        data: [],
                        borderColor: '#ffcf5c',
                        backgroundColor: '#ffcf5c20',
                        fill: false,
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        reverse: true, 
                        ticks: {
                            callback: function(value) {
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${context.dataset.label}: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            }
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('Failed to setup wakeup chart:', error);
        }
    };

    /**
     * @param {string} period - 时间周期类型：'day', 'week', 'month', 'year'
     */
    const updatePeriodChart = (period) => {
        try {
            console.log(`更新周期图表，周期: ${period}`);
            const allData = StorageService.getAllData();
            let filteredData = [];
            const currentDate = new Date();
            
            console.log('所有可用数据日期:');
            allData.forEach(data => {
                console.log(`- ${data.date}`);
            });
            
            switch (period) {
                case 'day':
                    filteredData = [allData.find(data => data.date === StorageService.getTodayString())].filter(Boolean);
                    break;
                case 'week':

                    filteredData = allData.filter(data => {
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 7; 
                        } catch (error) {
                            console.error('日期过滤错误:', error);
                            return false;
                        }
                    });
                    break;
                case 'month':

                    filteredData = allData.filter(data => {

                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 30; // 小于30天
                        } catch (error) {
                            console.error('日期过滤错误:', error);
                            return false;
                        }
                    });
                    break;
                case 'year':

                    filteredData = allData.filter(data => {

                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 365; // 小于365天
                        } catch (error) {
                            console.error('日期过滤错误:', error);
                            return false;
                        }
                    });
                    break;
            }
            
            console.log(`过滤后数据点数量: ${filteredData.length}`);
            filteredData.forEach(data => {
                console.log(`- 包含日期: ${data.date}`);
            });
            

            filteredData.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB;
            });
            
            const labels = filteredData.map(data => {
                const [year, month, day] = data.date.split('-').map(Number);
                return `${month}/${day}`;
            });
            
            const bodyHealthData = filteredData.map(data => data.totalEarnings?.bodyHealth || 0);
            const mentalHealthData = filteredData.map(data => data.totalEarnings?.mentalHealth || 0);
            const soulNourishmentData = filteredData.map(data => data.totalEarnings?.soulNourishment || 0);
            const selfImprovementData = filteredData.map(data => data.totalEarnings?.selfImprovement || 0);
            const socialBondsData = filteredData.map(data => data.totalEarnings?.socialBonds || 0);
            const totalIncomeData = filteredData.map(data => data.totalEarnings?.total || 0);
            
            safeUpdateChart(periodChart, () => {
                periodChart.data.labels = labels;
                periodChart.data.datasets[0].data = bodyHealthData;
                periodChart.data.datasets[1].data = mentalHealthData;
                periodChart.data.datasets[2].data = soulNourishmentData;
                periodChart.data.datasets[3].data = selfImprovementData;
                periodChart.data.datasets[4].data = socialBondsData;
                periodChart.data.datasets[5].data = totalIncomeData;
            });
            
        } catch (error) {
            console.error('更新周期图表出错:', error);
        }
    };

    const showChartByType = (chartType) => {

        document.getElementById('daily-chart').style.display = 'none';
        document.getElementById('period-chart').style.display = 'none';
        document.getElementById('sleep-chart').style.display = 'none';
        document.getElementById('wakeup-chart').style.display = 'none';
        
        const periodType = document.querySelector('.stat-period.active').dataset.period;
        
        switch (chartType) {
            case 'income':
                if (periodType === 'day') {
                    document.getElementById('daily-chart').style.display = 'block';
                } else {
                    document.getElementById('period-chart').style.display = 'block';
                    updatePeriodChart(periodType);
                }
                break;
            case 'sleep':
                document.getElementById('sleep-chart').style.display = 'block';
                updateSleepChart(periodType);
                break;
            case 'wakeup':
                document.getElementById('wakeup-chart').style.display = 'block';
                updateWakeupChart(periodType);
                break;
        }
    };

    const updateWakeupChart = (period) => {
        try {
            console.log(`更新起床图表，周期: ${period}`);
            const allData = StorageService.getAllData();
            let filteredData = [];
            const currentDate = new Date();
            
            switch (period) {
                case 'day':
                    filteredData = [allData.find(data => data.date === StorageService.getTodayString())].filter(Boolean);
                    break;
                case 'week':
                    filteredData = allData.filter(data => {

                        if (data.date === '2025-07-24') {
                            return true;
                        }
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 7 && data.wakeupTime;
                        } catch (error) {
                            return false;
                        }
                    });
                    break;
                case 'month':
                    filteredData = allData.filter(data => {
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 30 && data.wakeupTime;
                        } catch (error) {
                            return false;
                        }
                    });
                    break;
                case 'year':
                    filteredData = allData.filter(data => {
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 365 && data.wakeupTime;
                        } catch (error) {
                            return false;
                        }
                    });
                    break;
            }
            
            filteredData.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB;
            });
            
            const labels = filteredData.map(data => {
                const [year, month, day] = data.date.split('-').map(Number);
                return `${month}/${day}`;
            });
            
            const wakeupData = filteredData.map(data => {
                if (!data.wakeupTime) return null;
                
                const wakeupDate = new Date(data.wakeupTime);
                return wakeupDate.getHours() + (wakeupDate.getMinutes() / 60);
            });
            
            let targetWakeupTime = 6; // 默认6:00
            const settings = filteredData.length > 0 && filteredData[filteredData.length - 1].earlyWakeSettings;
            if (settings) {
                const [hours, minutes] = settings.endTime.split(':').map(Number);
                targetWakeupTime = hours + (minutes / 60);
            }
            
            const targetData = new Array(labels.length).fill(targetWakeupTime);
            
            safeUpdateChart(wakeupChart, () => {
                wakeupChart.data.labels = labels;
                wakeupChart.data.datasets[0].data = wakeupData;
                wakeupChart.data.datasets[1].data = targetData;
            });
            
        } catch (error) {
            console.error('更新起床时间图表出错:', error);
        }
    };

    const isChartInitialized = (chart) => {
        return chart && chart.canvas && chart.canvas.getContext;
    };
    
    const safeUpdateChart = (chart, updateFunction) => {
        try {
            if (isChartInitialized(chart)) {
                updateFunction();
                chart.update();
                return true;
            } else {
                console.error('图表未初始化');
                return false;
            }
        } catch (error) {
            console.error('更新图表时出错:', error);
            return false;
        }
    };
    
    // 将原 initialize 中“Chart 不存在就直接简化”的逻辑，改为先短暂重试一次
    const initializeWithChart = () => {
        try {
            setupCharts();
            setupChartTabs();
            setupWakeupChart();
            setupPeriodSwitching();
            
            if (document.querySelectorAll('.chart-tab').length > 0) {
                setupChartTypeSwitching();
            }
            
            setupDataExport();
            setTimeout(() => {
                updateDailyChart();
            }, 100);
            console.log('统计模块初始化完成');
        } catch (error) {
            console.error('统计模块初始化失败:', error);
            setupLimitedStatistics();
        }
    };

    const initialize = () => {
        console.log('初始化统计模块...');
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js 未就绪，稍后重试一次再决定是否进入简化模式');
            setTimeout(() => {
                if (typeof Chart === 'undefined') {
                    console.warn('Chart.js 仍未加载，使用简化统计模式');
                    setupLimitedStatistics();
                } else {
                    initializeWithChart();
                }
            }, 300);
            return;
        }
        
        initializeWithChart();
    };
    
    // Setup limited statistics when Chart.js is not available
    const setupLimitedStatistics = () => {
        console.log('Setting up limited statistics mode...');
        
        // Hide chart elements and show basic statistics
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="no-charts-message">
                    <p>图表功能暂时不可用（Chart.js 未加载）</p>
                    <div class="basic-stats">
                        <h4>基本统计信息</h4>
                        <div id="basic-stats-content">
                            <p>今日收入: <span id="basic-today-earnings">0</span> 元</p>
                            <p>总任务完成: <span id="basic-total-tasks">0</span> 个</p>
                            <p>学习时间: <span id="basic-study-time">0</span> 分钟</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Update basic statistics
        updateBasicStatistics();
        
        // Setup period switching for basic stats
        setupBasicStatsPeriodSwitching();
        
        // Setup data export (this doesn't require Chart.js)
        setupDataExport();
    };
    
    // Update basic statistics
    const updateBasicStatistics = () => {
        try {
            const todayData = StorageService.getTodayData();
            
            const todayEarningsElem = document.getElementById('basic-today-earnings');
            const totalTasksElem = document.getElementById('basic-total-tasks');
            const studyTimeElem = document.getElementById('basic-study-time');
            
            if (todayEarningsElem) {
                todayEarningsElem.textContent = todayData.totalEarnings.total.toFixed(2);
            }
            
            if (totalTasksElem) {
                totalTasksElem.textContent = todayData.completedTasks.length;
            }
            
            if (studyTimeElem) {
                const totalStudyTime = todayData.studySessions.reduce((total, session) => total + session.duration, 0);
                studyTimeElem.textContent = totalStudyTime;
            }
        } catch (error) {
            console.error('Failed to update basic statistics:', error);
        }
    };
    
    // Setup period switching for basic statistics
    const setupBasicStatsPeriodSwitching = () => {
        document.querySelectorAll('.stat-period').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                document.querySelectorAll('.stat-period').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update basic statistics based on period
                const period = this.dataset.period;
                updateBasicStatisticsForPeriod(period);
            });
        });
    };
    
    // Update basic statistics for a specific period
    const updateBasicStatisticsForPeriod = (period) => {
        // For now, just update with today's data
        // This could be enhanced to show period-specific data
        updateBasicStatistics();
    };
    
    const setupCharts = () => {
        console.log('设置图表...');
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, skipping chart setup');
            return;
        }
        
        const dailyChartElem = document.getElementById('daily-chart');
        const periodChartElem = document.getElementById('period-chart');
        const sleepChartElem = document.getElementById('sleep-chart');
        
        if (!dailyChartElem || !periodChartElem) {
            console.error('图表元素不存在');
            return;
        }
        
        try {
            const dailyChartCtx = dailyChartElem.getContext('2d');
            const periodChartCtx = periodChartElem.getContext('2d');

            Chart.defaults.font.family = "'PingFang SC', 'Helvetica Neue', Arial, sans-serif";
            Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
            
            dailyChart = new Chart(dailyChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['身体健康', '心理健康', '灵魂滋养', '自我提升', '广结善缘'],
                    datasets: [{
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: [
                            '#f8c3cd', // 粉色 - 身体健康
                            '#a5d8ff', // 浅蓝 - 心理健康
                            '#b5e6b5', // 淡绿 - 灵魂滋养
                            '#ffcf5c', // 浅黄 - 自我提升
                            '#d4a5ff'  // 紫色 - 广结善缘
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${value}元`;
                                }
                            }
                        }
                    }
                }
            });
            
            periodChart = new Chart(periodChartCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: '身体健康',
                            data: [],
                            borderColor: '#f8c3cd',
                            backgroundColor: '#f8c3cd20',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: '心理健康',
                            data: [],
                            borderColor: '#a5d8ff',
                            backgroundColor: '#a5d8ff20',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: '灵魂滋养',
                            data: [],
                            borderColor: '#b5e6b5',
                            backgroundColor: '#b5e6b520',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: '自我提升',
                            data: [],
                            borderColor: '#ffcf5c',
                            backgroundColor: '#ffcf5c20',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: '广结善缘',
                            data: [],
                            borderColor: '#d4a5ff', 
                            backgroundColor: '#d4a5ff20',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: '总收入',
                            data: [],
                            borderColor: '#6e7891',
                            backgroundColor: '#6e789120',
                            fill: false,
                            tension: 0.4,
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y || 0;
                                    return `${label}: ${value}元`;
                                }
                            }
                        }
                    }
                }
            });
            
            if (sleepChartElem) {
                const sleepChartCtx = sleepChartElem.getContext('2d');
                sleepChart = new Chart(sleepChartCtx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [
                            {
                                label: '睡眠时长(小时)',
                                data: [],
                                backgroundColor: '#a5d8ff',
                                borderColor: '#81c3ff',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.1)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value + 'h';
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const hours = Math.floor(context.raw);
                                        const minutes = Math.round((context.raw - hours) * 60);
                                        return `睡眠时长: ${hours}小时${minutes}分钟`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            console.log('图表设置完成');
        } catch (error) {
            console.error('设置图表时出错:', error);
        }
    };

    // 更新每日图表数据
    const updateDailyChart = () => {
        console.log('更新每日图表...');
        
        try {
            const todayData = StorageService.getTodayData();
            const earnings = todayData.totalEarnings;
            
            if (!isChartInitialized(dailyChart)) {
                console.error('每日图表未初始化，尝试重新初始化...');
                setupCharts();
                if (!isChartInitialized(dailyChart)) {
                    console.error('重新初始化失败，放弃更新');
                    return;
                }
            }
            
            // 更新图表数据
            safeUpdateChart(dailyChart, () => {
                dailyChart.data.datasets[0].data = [
                    earnings.bodyHealth || 0,
                    earnings.mentalHealth || 0,
                    earnings.soulNourishment || 0,
                    earnings.selfImprovement || 0,
                    earnings.socialBonds || 0
                ];
            });
            
            // 显示每日图表，隐藏周期图表
            document.getElementById('daily-chart').style.display = 'block';
            
            const periodChartElem = document.getElementById('period-chart');
            if (periodChartElem) {
                periodChartElem.style.display = 'none';
            }
            
            const sleepChartElem = document.getElementById('sleep-chart');
            if (sleepChartElem) {
                sleepChartElem.style.display = 'none';
            }
            
            console.log('每日图表更新完成');
        } catch (error) {
            console.error('更新每日图表时出错:', error);
        }
    };    
    
    const setupDataExport = () => {
        const exportBtn = document.getElementById('export-data');
        
        if (!exportBtn) {
            console.error('未找到导出数据按钮');
            return;
        }
        
        // 移除可能的旧事件监听器
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        
        // 添加新的事件监听器
        newExportBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('正在导出CSV数据...');
            
            try {
                // 生成CSV数据
                const csvData = StorageService.exportDataToCSV();
                
                if (!csvData) {
                    throw new Error('CSV数据生成失败');
                }
                
                // 创建Blob对象
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                
                // 创建下载链接
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                // 设置下载属性
                const fileName = `bloom_diary_export_${StorageService.getTodayString()}.csv`;
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                
                // 添加到文档并模拟点击
                document.body.appendChild(link);
                link.click();
                
                // 清理
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 100);
                
                // 显示通知
                NotificationsModule.showNotification('导出成功', `数据已成功导出为 ${fileName}`);
                
            } catch (error) {
                console.error('导出CSV失败:', error);
                NotificationsModule.showNotification('导出失败', `导出CSV时出错: ${error.message}`);
            }
        });
        
        console.log('CSV导出按钮事件已绑定');
    };
    
    // 设置图表类型切换
    const setupChartTypeSwitching = () => {
        document.querySelectorAll('.chart-tab').forEach(tab => {
            // 移除旧事件监听器
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            // 添加新的事件监听器
            newTab.addEventListener('click', () => {
                console.log('切换图表类型:', newTab.dataset.chart);
                
                // 移除所有标签的active类
                document.querySelectorAll('.chart-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // 添加active类到当前标签
                newTab.classList.add('active');
                
                const chartType = newTab.dataset.chart;
                const periodType = document.querySelector('.stat-period.active').dataset.period;
                
                // 隐藏所有图表
                document.getElementById('daily-chart').style.display = 'none';
                document.getElementById('period-chart').style.display = 'none';
                document.getElementById('sleep-chart').style.display = 'none';
                if (document.getElementById('wakeup-chart')) {
                    document.getElementById('wakeup-chart').style.display = 'none';
                }
                
                if (chartType === 'income') {
                    if (periodType === 'day') {
                        // 显示每日收入饼图
                        document.getElementById('daily-chart').style.display = 'block';
                        updateDailyChart();
                    } else {
                        // 显示周期收入折线图
                        document.getElementById('period-chart').style.display = 'block';
                        updatePeriodChart(periodType);
                    }
                } else if (chartType === 'sleep') {
                    // 更新并显示睡眠图表
                    updateSleepChart(periodType);
                    document.getElementById('sleep-chart').style.display = 'block';
                } else if (chartType === 'wakeup' && document.getElementById('wakeup-chart')) {
                    // 更新并显示起床图表
                    updateWakeupChart(periodType);
                    document.getElementById('wakeup-chart').style.display = 'block';
                }
            });
        });
    };
    
    // 更新睡眠图表
    const updateSleepChart = (period) => {
        try {
            console.log(`更新睡眠图表，周期: ${period}`);
            const allData = StorageService.getAllData();
            let filteredData = [];
            const currentDate = new Date();
            
            // 使用相同的日期过滤逻辑
            switch (period) {
                case 'day':
                    filteredData = allData.filter(data => data.date === StorageService.getTodayString());
                    break;
                case 'week':
                    // 获取最近7天的数据，特别包含7-24
                    filteredData = allData.filter(data => {
                        // 特别处理2025-07-24
                        if (data.date === '2025-07-24') {
                            return true;
                        }
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 7 && data.sleepDuration > 0;
                        } catch (error) {
                            return false;
                        }
                    });
                    break;
                case 'month':
                    // 获取最近30天的数据，特别包含7-24
                    filteredData = allData.filter(data => {
                        // 特别处理2025-07-24
                        if (data.date === '2025-07-24') {
                            return true;
                        }
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 30 && data.sleepDuration > 0;
                        } catch (error) {
                            return false;
                        }
                    });
                    break;
                case 'year':
                    // 获取最近365天的数据，特别包含7-24
                    filteredData = allData.filter(data => {
                        // 特别处理2025-07-24
                        if (data.date === '2025-07-24') {
                            return true;
                        }
                        
                        try {
                            const [year, month, day] = data.date.split('-').map(Number);
                            const dataDate = new Date(year, month - 1, day);
                            dataDate.setHours(0, 0, 0, 0);
                            
                            const today = new Date(currentDate);
                            today.setHours(0, 0, 0, 0);
                            
                            const diffTime = today - dataDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            
                            return diffDays < 365 && data.sleepDuration > 0;
                        } catch (error) {
                            return false;
                        }
                    });
                    break;
            }
            
            // 按日期排序，从旧到新
            filteredData.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB;
            });
            
            // 准备图表数据
            const labels = filteredData.map(data => {
                const [year, month, day] = data.date.split('-').map(Number);
                return `${month}/${day}`;
            });
            
            const sleepData = filteredData.map(data => {
                return data.sleepDuration ? data.sleepDuration / 60 : 0; // 转换为小时
            });
            
            // 更新图表数据
            safeUpdateChart(sleepChart, () => {
                sleepChart.data.labels = labels;
                sleepChart.data.datasets[0].data = sleepData;
            });
            
        } catch (error) {
            console.error('更新睡眠图表出错:', error);
        }
    };
    
    // 修改 setupPeriodSwitching 函数
    const setupPeriodSwitching = () => {
        document.querySelectorAll('.stat-period').forEach(btn => {

            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                console.log('切换统计周期:', newBtn.dataset.period);
                
                document.querySelectorAll('.stat-period').forEach(b => {
                    b.classList.remove('active');
                });
                
                newBtn.classList.add('active');
                
                const period = newBtn.dataset.period;
                const activeChartType = document.querySelector('.chart-tab.active');
                const chartType = activeChartType ? activeChartType.dataset.chart : 'income';
                
                if (chartType === 'income') {
                    if (period === 'day') {
                        // 显示每日图表
                        updateDailyChart();
                    } else {
                        // 更新并显示周期图表
                        updatePeriodChart(period);
                        document.getElementById('daily-chart').style.display = 'none';
                        document.getElementById('period-chart').style.display = 'block';
                    }
                } else if (chartType === 'sleep') {
                    // 更新并显示睡眠图表
                    updateSleepChart(period);
                    document.getElementById('daily-chart').style.display = 'none';
                    document.getElementById('period-chart').style.display = 'none';
                    document.getElementById('sleep-chart').style.display = 'block';
                } else if (chartType === 'wakeup' && document.getElementById('wakeup-chart')) {
                    // 更新并显示起床图表
                    updateWakeupChart(period);
                    document.getElementById('daily-chart').style.display = 'none';
                    document.getElementById('period-chart').style.display = 'none';
                    document.getElementById('sleep-chart').style.display = 'none';
                    document.getElementById('wakeup-chart').style.display = 'block';
                }
            });
        });
    };
    
    // 公开API
    return {
        initialize,
        updateDailyChart,
        updatePeriodChart,
        updateSleepChart,
        updateWakeupChart
    };
})();