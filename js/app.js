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
});

window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('Delayed navigation setup...');
        setupNavigation();
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
// 修改 setupThemeSwitching 函数
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
    
    // 切换主题
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // 更新按钮图标
        if (document.body.classList.contains('dark-mode')) {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // 保存设置
        StorageService.updateSettings({
            darkMode: document.body.classList.contains('dark-mode')
        });
        
        // 强制重新应用样式
        const darkModeStylesheet = document.createElement('link');
        darkModeStylesheet.rel = 'stylesheet';
        darkModeStylesheet.href = 'css/dark-mode.css';
        document.head.appendChild(darkModeStylesheet);
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
    
    // 添加调试信息
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

// 全局可访问的更新函数（供其他模块调用）
window.updateDailyOverview = updateDailyOverview;