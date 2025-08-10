/**
 * 主应用程序 - 整合所有模块并初始化应用
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化本地存储
    StorageService.initialize();
    
    // 初始化所有模块
    initializeModules();
    
    // 设置主题切换
    setupThemeSwitching();
    
    // 设置导航
    setupNavigation();
    
    // 更新每日总览数据
    updateDailyOverview();
    
    // 显示当前日期
    displayCurrentDate();
    
    // 添加额外的修复和确保功能正常
    ensureAllFunctionsWork();
});

window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('Delayed navigation setup...');
        setupNavigation();
        // 再次确保所有功能正常
        ensureAllFunctionsWork();
    }, 500);
});

// 初始化所有功能模块
function initializeModules() {
    // 初始化通知模块
    NotificationsModule.initialize();
    
    // 初始化任务模块
    TasksModule.initialize();
    
    // 初始化计时器模块
    TimerModule.initialize();
    
    // 初始化统计模块
    StatisticsModule.initialize();

    // 初始化设置模块
    SettingsModule.initialize();    
}

// 设置主题切换
function setupThemeSwitching() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const settings = StorageService.getSettings();
    
    // 应用保存的主题设置
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // 移除可能的旧事件监听器
    const newThemeToggleBtn = themeToggleBtn.cloneNode(true);
    themeToggleBtn.parentNode.replaceChild(newThemeToggleBtn, themeToggleBtn);
    
    // 切换主题
    newThemeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // 更新按钮图标
        if (document.body.classList.contains('dark-mode')) {
            newThemeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            newThemeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // 保存设置
        StorageService.updateSettings({
            darkMode: document.body.classList.contains('dark-mode')
        });
    });
}

// 设置导航
function setupNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const sections = document.querySelectorAll('main > section');
    
    // 移除可能的旧事件监听器
    navItems.forEach(item => {
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
    });
    
    // 重新获取替换后的导航项
    const refreshedNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    
    // 重新绑定事件
    refreshedNavItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Navigation item clicked:', this.dataset.target);
            
            // 移除所有导航项的active类
            refreshedNavItems.forEach(navItem => navItem.classList.remove('active'));
            
            // 为当前导航项添加active类
            this.classList.add('active');
            
            // 隐藏所有内容区域
            sections.forEach(section => section.style.display = 'none');
            
            // 显示对应的内容区域
            const targetId = this.dataset.target;
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // 如果是统计页面，更新图表
                if (targetId === 'statistics-section') {
                    if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateDailyChart) {
                        StatisticsModule.updateDailyChart();
                    }
                }
            } else {
                console.error('Target section not found:', targetId);
            }
        });
    });
    
    console.log('Navigation setup complete. Items:', refreshedNavItems.length);
    
    // 默认显示总览页面，隐藏其他页面
    sections.forEach(section => {
        if (section.id !== 'daily-overview') {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }
    });
}

// 更新每日总览数据
function updateDailyOverview() {
    const todayData = StorageService.getTodayData();
    
    // 更新收入显示
    document.getElementById('today-earnings').textContent = todayData.totalEarnings.total.toFixed(2);
    
    // 更新任务完成情况
    const completedTasksCount = todayData.completedTasks.length;
    const totalTasksCount = document.querySelectorAll('.task-item').length;
    document.getElementById('today-tasks').textContent = `${completedTasksCount}/${totalTasksCount}`;
    
    // 更新学习时间
    const studyMinutes = todayData.studySessions.reduce((total, session) => {
        return total + session.duration;
    }, 0);
    document.getElementById('today-study').textContent = studyMinutes;
    
    // 更新已完成任务列表
    const tasksContainer = document.getElementById('overview-tasks-container');
    if (tasksContainer) {
        tasksContainer.innerHTML = '';
        
        // 按类别分组任务
        const tasksByCategory = {};
        todayData.completedTasks.forEach(task => {
            if (!tasksByCategory[task.category]) {
                tasksByCategory[task.category] = [];
            }
            tasksByCategory[task.category].push(task);
        });
        
        // 生成类别图标映射
        const categoryIcons = {
            '身体健康': 'fas fa-heartbeat',
            '心理健康': 'fas fa-brain',
            '灵魂滋养': 'fas fa-feather-alt',
            '自我提升': 'fas fa-arrow-up',
            '广结善缘': 'fas fa-hands-helping',
        };
        
        // 显示每个类别的任务
        Object.keys(tasksByCategory).forEach(category => {
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'task-category-group';
            
            const icon = categoryIcons[category] || 'fas fa-tasks';
            
            categoryGroup.innerHTML = `
                <h4><i class="${icon}"></i> ${category}</h4>
                <div class="category-tasks"></div>
            `;
            
            const categoryTasksContainer = categoryGroup.querySelector('.category-tasks');
            
            tasksByCategory[category].forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'overview-task-item';
                taskItem.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>${task.name}</span>
                `;
                categoryTasksContainer.appendChild(taskItem);
            });
            
            tasksContainer.appendChild(categoryGroup);
        });
        
        // 如果没有任务，显示提示
        if (Object.keys(tasksByCategory).length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks">今天还没有完成任何任务哦！</p>';
        }
    }
}

// 显示当前日期
function displayCurrentDate() {
    const dateElem = document.getElementById('current-date');
    const now = new Date();
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElem.textContent = now.toLocaleDateString('zh-CN', options);
}

// 确保所有功能正常工作
// 在 ensureAllFunctionsWork 函数中添加起床打卡设置
function ensureAllFunctionsWork() {
    console.log('确保所有关键功能正常工作...');
    
    // 使用setTimeout确保DOM完全加载
    setTimeout(() => {
        // 1. 修复设置按钮
        fixSettingsButton();
        
        // 2. 修复任务模块事件
        fixTasksModule();
        
        // 3. 修复统计模块事件
        fixStatisticsModule();
        
        // 4. 修复计时器模块事件
        fixTimerModule();
        
        // 5. 确保关闭模态框功能正常
        fixModalCloseButtons();
        
        // 6. 设置起床打卡功能
        setupWakeupCheckIn();
        
        // 7. 确保任务模块事件绑定（新增）
        if (typeof TasksModule !== 'undefined' && TasksModule.ensureEventBindings) {
            setTimeout(() => {
                TasksModule.ensureEventBindings();
            }, 200);
        }
        
        console.log('所有功能修复完成');
    }, 100);
}







// 新增：专门绑定设置按钮事件的函数
function bindSettingsButtonEvents() {
    console.log('绑定设置按钮事件...');
    

    

    

    

    
    console.log('设置按钮事件绑定完成');
}



// 添加开发者模式切换函数（在app.js中）
function toggleDevModeForApp(enabled) {
    const devOptions = document.getElementById('dev-options');
    if (devOptions) {
        if (enabled) {
            devOptions.classList.remove('hidden');
        } else {
            devOptions.classList.add('hidden');
        }
    }
}


// 添加修复模态框关闭按钮的函数
function fixModalCloseButtons() {
    console.log('修复模态框关闭按钮...');
    
    // 修复所有关闭模态框按钮 - 不替换元素，直接绑定
    document.querySelectorAll('.close-modal').forEach(function(btn) {
        // 移除现有事件监听器
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
            
            // 重新绑定事件
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('关闭模态框按钮被点击');
                closeAllModals();
            });
        }
    });
    
    // 修复点击遮罩层关闭模态框 - 确保只绑定一次
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && !modalOverlay.hasAttribute('data-overlay-bound')) {
        modalOverlay.setAttribute('data-overlay-bound', 'true');
        
        modalOverlay.addEventListener('click', function(e) {
            // 只有点击遮罩层本身（不是模态框内容）时才关闭
            if (e.target === this) {
                console.log('点击遮罩层关闭模态框');
                closeAllModals();
            }
        });
    }
}

// 新增：关闭所有模态框的统一函数
function closeAllModals() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
    
    // 隐藏所有模态框
    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.classList.add('hidden');
    });
}



// 在 fixSettingsButton 函数中调用关闭按钮修复
function fixSettingsButton() {
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        // 移除旧事件监听器
        const newSettingsBtn = settingsBtn.cloneNode(true);
        settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
        
        // 重新绑定事件 - 委托给SettingsModule
        newSettingsBtn.addEventListener('click', function() {
            console.log('设置按钮被点击');
            
            try {
                // 使用SettingsModule打开设置
                if (typeof SettingsModule !== 'undefined' && SettingsModule.openSettingsModal) {
                    SettingsModule.openSettingsModal();
                } else {
                    console.error('SettingsModule未定义或方法不存在');
                    if (typeof NotificationsModule !== 'undefined') {
                        NotificationsModule.showNotification('设置打开失败', '请刷新页面后重试');
                    }
                }
                
            } catch (error) {
                console.error('打开设置失败:', error);
                
                if (typeof NotificationsModule !== 'undefined') {
                    NotificationsModule.showNotification('设置打开失败', '请刷新页面后重试: ' + error.message);
                }
            }
        });
    }
}














// 修改 fixTasksModule 函数
function fixTasksModule() {
    console.log('修复任务模块...');
    
    // 确保TasksModule的事件绑定正常
    if (typeof TasksModule !== 'undefined' && TasksModule.ensureEventBindings) {
        TasksModule.ensureEventBindings();
    }
    
    // 修复添加任务按钮 - 避免重复绑定
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn && !addTaskBtn.hasAttribute('data-task-bound')) {
        addTaskBtn.setAttribute('data-task-bound', 'true');
        
        addTaskBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('添加任务按钮被点击');
            
            // 加载任务模板
            if (typeof TasksModule !== 'undefined' && TasksModule.loadTaskTemplates) {
                TasksModule.loadTaskTemplates();
            }
            
            // 显示添加任务模态框
            document.getElementById('modal-overlay').classList.remove('hidden');
            document.getElementById('add-task-modal').classList.remove('hidden');
            document.getElementById('settings-modal').classList.add('hidden');
            document.getElementById('add-category-modal').classList.add('hidden');
            
            // 确保表单事件正常
            setTimeout(() => {
                if (typeof TasksModule !== 'undefined' && TasksModule.ensureEventBindings) {
                    TasksModule.ensureEventBindings();
                }
            }, 100);
        });
    }
}




// 修复统计模块事件
function fixStatisticsModule() {
    // 修复图表标签切换
    document.querySelectorAll('.chart-tab').forEach(function(tab) {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        newTab.addEventListener('click', function() {
            console.log('切换到图表类型:', this.dataset.chart);
            
            // 移除所有active类
            document.querySelectorAll('.chart-tab').forEach(function(t) {
                t.classList.remove('active');
            });
            
            // 添加active类到当前标签
            this.classList.add('active');
            
            // 获取当前周期
            const activePeriod = document.querySelector('.stat-period.active');
            const period = activePeriod ? activePeriod.dataset.period : 'day';
            
            // 根据类型显示不同图表
            const chartType = this.dataset.chart;
            
            // 隐藏所有图表
            document.getElementById('daily-chart').style.display = 'none';
            document.getElementById('period-chart').style.display = 'none';
            document.getElementById('sleep-chart').style.display = 'none';
            if (document.getElementById('wakeup-chart')) {
                document.getElementById('wakeup-chart').style.display = 'none';
            }
            
            // 显示选定的图表
            if (chartType === 'income') {
                if (period === 'day') {
                    document.getElementById('daily-chart').style.display = 'block';
                    
                    // 更新每日图表
                    if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateDailyChart) {
                        StatisticsModule.updateDailyChart();
                    }
                } else {
                    document.getElementById('period-chart').style.display = 'block';
                    
                    // 更新周期图表
                    if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updatePeriodChart) {
                        StatisticsModule.updatePeriodChart(period);
                    }
                }
            } else if (chartType === 'sleep') {
                document.getElementById('sleep-chart').style.display = 'block';
                
                // 更新睡眠图表
                if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateSleepChart) {
                    StatisticsModule.updateSleepChart(period);
                }
            } else if (chartType === 'wakeup' && document.getElementById('wakeup-chart')) {
                document.getElementById('wakeup-chart').style.display = 'block';
                
                // 更新起床图表
                if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateWakeupChart) {
                    StatisticsModule.updateWakeupChart(period);
                }
            }
        });
    });
    
    // 修复时间周期按钮
    document.querySelectorAll('.stat-period').forEach(function(btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            console.log('切换到统计周期:', this.dataset.period);
            
            // 移除所有active类
            document.querySelectorAll('.stat-period').forEach(function(b) {
                b.classList.remove('active');
            });
            
            // 添加active类到当前按钮
            this.classList.add('active');
            
            // 获取当前图表类型
            const activeChartType = document.querySelector('.chart-tab.active');
            const chartType = activeChartType ? activeChartType.dataset.chart : 'income';
            
            // 获取周期
            const period = this.dataset.period;
            
            // 根据图表类型和周期更新图表
            if (chartType === 'income') {
                if (period === 'day') {
                    document.getElementById('daily-chart').style.display = 'block';
                    document.getElementById('period-chart').style.display = 'none';
                    
                    // 更新每日图表
                    if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateDailyChart) {
                        StatisticsModule.updateDailyChart();
                    }
                } else {
                    document.getElementById('daily-chart').style.display = 'none';
                    document.getElementById('period-chart').style.display = 'block';
                    
                    // 更新周期图表
                    if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updatePeriodChart) {
                        StatisticsModule.updatePeriodChart(period);
                    }
                }
            } else if (chartType === 'sleep') {
                // 更新睡眠图表
                if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateSleepChart) {
                    StatisticsModule.updateSleepChart(period);
                }
            } else if (chartType === 'wakeup') {
                // 更新起床图表
                if (typeof StatisticsModule !== 'undefined' && StatisticsModule.updateWakeupChart) {
                    StatisticsModule.updateWakeupChart(period);
                }
            }
        });
    });
    
    // 修复导出数据按钮
    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        const newExportDataBtn = exportDataBtn.cloneNode(true);
        exportDataBtn.parentNode.replaceChild(newExportDataBtn, exportDataBtn);
        
        newExportDataBtn.addEventListener('click', function() {
            console.log('导出数据按钮被点击');
            
            if (typeof StorageService !== 'undefined' && StorageService.exportDataToCSV) {
                try {
                    // 生成CSV数据
                    const csvData = StorageService.exportDataToCSV();
                    
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
                    setTimeout(function() {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    // 显示通知
                    if (typeof NotificationsModule !== 'undefined') {
                        NotificationsModule.showNotification('导出成功', `数据已成功导出为 ${fileName}`);
                    }
                } catch (error) {
                    console.error('导出CSV失败:', error);
                    if (typeof NotificationsModule !== 'undefined') {
                        NotificationsModule.showNotification('导出失败', `导出CSV时出错: ${error.message}`);
                    }
                }
            }
        });
    }
}

// 修复计时器模块事件
function fixTimerModule() {
    // 重新初始化计时器模块
    if (typeof TimerModule !== 'undefined' && TimerModule.initialize) {
        TimerModule.initialize();
    } else {
        console.log('手动绑定计时器按钮事件');
        
        // 手动绑定计时器按钮事件
        const startButton = document.getElementById('start-timer');
        const pauseButton = document.getElementById('pause-timer');
        const stopButton = document.getElementById('stop-timer');
        
        if (startButton) {
            const newStartButton = startButton.cloneNode(true);
            startButton.parentNode.replaceChild(newStartButton, startButton);
            
            newStartButton.addEventListener('click', function() {
                console.log('开始计时按钮被点击');
                if (typeof TimerModule !== 'undefined' && TimerModule.startTimer) {
                    TimerModule.startTimer();
                }
            });
        }
        
        if (pauseButton) {
            const newPauseButton = pauseButton.cloneNode(true);
            pauseButton.parentNode.replaceChild(newPauseButton, pauseButton);
            
            newPauseButton.addEventListener('click', function() {
                console.log('暂停计时按钮被点击');
                if (typeof TimerModule !== 'undefined' && TimerModule.pauseTimer) {
                    TimerModule.pauseTimer();
                }
            });
        }
        
        if (stopButton) {
            const newStopButton = stopButton.cloneNode(true);
            stopButton.parentNode.replaceChild(newStopButton, stopButton);
            
            newStopButton.addEventListener('click', function() {
                console.log('结束计时按钮被点击');
                if (typeof TimerModule !== 'undefined' && TimerModule.stopTimer) {
                    TimerModule.stopTimer();
                }
            });
        }
    }
}


// 在 app.js 中添加起床打卡相关函数
function setupWakeupCheckIn() {
    console.log('设置起床打卡功能...');
    
    // 获取起床打卡按钮
    const wakeupBtn = document.getElementById('wakeup-btn');
    
    if (!wakeupBtn) {
        console.error('找不到起床打卡按钮');
        return;
    }
    
    // 检查今日是否已打卡
    checkTodayWakeupStatus();
    
    // 移除旧事件监听器
    const newWakeupBtn = wakeupBtn.cloneNode(true);
    wakeupBtn.parentNode.replaceChild(newWakeupBtn, wakeupBtn);
    
    // 绑定新的事件监听器
    newWakeupBtn.addEventListener('click', function() {
        console.log('起床打卡按钮被点击');
        performWakeupCheckIn();
    });
}

// 检查今日起床打卡状态 - 修正函数名
function checkTodayWakeupStatus() {
    try {
        const todayString = new Date().toISOString().split('T')[0];
        const allData = JSON.parse(localStorage.getItem('bloom_daily_data')) || [];
        const todayData = allData.find(data => data.date === todayString);
        
        const wakeupBtn = document.getElementById('wakeup-btn');
        const wakeupStatus = document.getElementById('wakeup-status');
        const wakeupTimeDisplay = document.getElementById('wakeup-time-display');
        
        if (todayData && todayData.wakeupTime) {
            // 已经打卡
            const wakeupTime = new Date(todayData.wakeupTime);
            const timeString = wakeupTime.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            if (wakeupBtn) {
                wakeupBtn.textContent = '已打卡';
                wakeupBtn.disabled = true;
                wakeupBtn.classList.add('secondary-btn');
                wakeupBtn.classList.remove('primary-btn');
            }
            
            if (wakeupStatus) {
                wakeupStatus.textContent = '已完成';
                wakeupStatus.classList.add('completed');
            }
            
            if (wakeupTimeDisplay) {
                wakeupTimeDisplay.textContent = `打卡时间：${timeString}`;
                wakeupTimeDisplay.classList.remove('hidden');
            }
        } else {
            // 未打卡
            if (wakeupBtn) {
                wakeupBtn.textContent = '打卡';
                wakeupBtn.disabled = false;
                wakeupBtn.classList.add('primary-btn');
                wakeupBtn.classList.remove('secondary-btn');
            }
            
            if (wakeupStatus) {
                wakeupStatus.textContent = '未打卡';
                wakeupStatus.classList.remove('completed');
            }
            
            if (wakeupTimeDisplay) {
                wakeupTimeDisplay.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('检查起床打卡状态失败:', error);
    }
}

// 执行起床打卡
function performWakeupCheckIn() {
    try {
        const now = new Date();
        const todayString = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // 获取今日数据
        const allData = JSON.parse(localStorage.getItem('bloom_daily_data')) || [];
        let todayDataIndex = allData.findIndex(data => data.date === todayString);
        
        // 检查是否已经打卡
        if (todayDataIndex !== -1 && allData[todayDataIndex].wakeupTime) {
            if (typeof NotificationsModule !== 'undefined') {
                NotificationsModule.showNotification('重复打卡', '今天已经完成起床打卡了！');
            }
            return;
        }
        
        // 创建或更新今日数据
        if (todayDataIndex === -1) {
            allData.push({
                date: todayString,
                wakeupTime: now.toISOString(),
                completedTasks: [],
                studySessions: [],
                totalEarnings: {
                    bodyHealth: 0,
                    mentalHealth: 0,
                    soulNourishment: 0,
                    selfImprovement: 0,
                    socialBonds: 0,
                    total: 0
                }
            });
            todayDataIndex = allData.length - 1;
        } else {
            allData[todayDataIndex].wakeupTime = now.toISOString();
        }
        
        // 获取早起设置
        const earlyWakeSettings = allData[todayDataIndex].earlyWakeSettings;
        let earnings = 0;
        let message = '';
        let encouragement = '';
        
        if (earlyWakeSettings && earlyWakeSettings.startTime && earlyWakeSettings.endTime) {
            // 检查是否在规定时间内
            if (currentTime >= earlyWakeSettings.startTime && currentTime <= earlyWakeSettings.endTime) {
                earnings = 2;
                message = '起床打卡成功！你在规定时间内起床，真棒！';
                encouragement = '早起的鸟儿有虫吃，继续保持这个好习惯！';
                
                // 更新收入
                allData[todayDataIndex].totalEarnings.bodyHealth += earnings;
                allData[todayDataIndex].totalEarnings.total += earnings;
            } else {
                message = '起床打卡成功！';
                encouragement = `建议在${earlyWakeSettings.startTime}-${earlyWakeSettings.endTime}之间起床可获得奖励哦，明天加油！`;
            }
        } else {
            message = '起床打卡成功！';
            encouragement = '记得在设置中配置早起时间段，可以获得额外奖励！';
        }
        
        // 添加打卡任务记录
        const wakeupTask = {
            id: `wakeup-${now.getTime()}`,
            category: '身体健康',
            name: earnings > 0 ? '起床打卡（奖励）' : '起床打卡',
            completed: true,
            date: now.toISOString(),
            earnings: earnings
        };
        
        allData[todayDataIndex].completedTasks.push(wakeupTask);
        
        // 保存数据
        localStorage.setItem('bloom_daily_data', JSON.stringify(allData));
        
        // 更新UI
        updateWakeupUI(now, earnings > 0);
        
        // 显示通知
        if (typeof NotificationsModule !== 'undefined') {
            NotificationsModule.showNotification(message, encouragement + (earnings > 0 ? ` 获得${earnings}元奖励！` : ''));
        }
        
        // 更新总览
        if (typeof updateDailyOverview === 'function') {
            updateDailyOverview();
        }
        
        console.log('起床打卡完成');
        
    } catch (error) {
        console.error('起床打卡失败:', error);
        
        if (typeof NotificationsModule !== 'undefined') {
            NotificationsModule.showNotification('打卡失败', '起床打卡时出错，请重试');
        }
    }
}

// 更新起床打卡UI
function updateWakeupUI(checkInTime, hasReward) {
    const wakeupBtn = document.getElementById('wakeup-btn');
    const wakeupStatus = document.getElementById('wakeup-status');
    const wakeupTimeDisplay = document.getElementById('wakeup-time-display');
    
    const timeString = checkInTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (wakeupBtn) {
        wakeupBtn.textContent = '已打卡';
        wakeupBtn.disabled = true;
        wakeupBtn.classList.add('secondary-btn');
        wakeupBtn.classList.remove('primary-btn');
    }
    
    if (wakeupStatus) {
        wakeupStatus.textContent = hasReward ? '已完成（有奖励）' : '已完成';
        wakeupStatus.classList.add('completed');
    }
    
    if (wakeupTimeDisplay) {
        wakeupTimeDisplay.textContent = `打卡时间：${timeString}`;
        wakeupTimeDisplay.classList.remove('hidden');
    }
}


// 全局可访问的更新函数（供其他模块调用）
window.updateDailyOverview = updateDailyOverview;