/**
 * 存储服务 - 管理本地数据存储
 */
const StorageService = (() => {
    // 存储键名
    const KEYS = {
        DAILY_DATA: 'bloom_daily_data',
        TASKS: 'bloom_tasks',
        CUSTOM_CATEGORIES: 'bloom_custom_categories',
        SETTINGS: 'bloom_settings'
    };

    // 初始化本地存储
    const initialize = () => {
        if (!localStorage.getItem(KEYS.DAILY_DATA)) {
            localStorage.setItem(KEYS.DAILY_DATA, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(KEYS.TASKS)) {
            localStorage.setItem(KEYS.TASKS, JSON.stringify(getDefaultTasks()));
        }
        
        if (!localStorage.getItem(KEYS.CUSTOM_CATEGORIES)) {
            localStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(KEYS.SETTINGS)) {
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify({
                darkMode: false,
                notificationsEnabled: true
            }));
        }
    };

    // 获取今日日期的格式化字符串 (YYYY-MM-DD)
    const getTodayString = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // 获取今天的数据，如果不存在则创建
    const getTodayData = () => {
        const allData = JSON.parse(localStorage.getItem(KEYS.DAILY_DATA)) || [];
        const todayString = getTodayString();
        
        let todayData = allData.find(data => data.date === todayString);
        
        if (!todayData) {
            todayData = {
                date: todayString,
                wakeupTime: null,
                sleepStartTime: null, // 添加睡眠开始时间
                sleepEndTime: null,   // 添加睡眠结束时间
                sleepDuration: 0,     // 添加睡眠时长(分钟)
                studySessions: [],
                completedTasks: [],
                totalEarnings: {
                    bodyHealth: 0,
                    mentalHealth: 0,
                    soulNourishment: 0,
                    selfImprovement: 0,
                    socialBonds: 0,
                    total: 0
                }
            };
            
            allData.push(todayData);
            localStorage.setItem(KEYS.DAILY_DATA, JSON.stringify(allData));
        }
        
        return todayData;
    };

    // 更新今天的数据
    const updateTodayData = (newData) => {
        const allData = JSON.parse(localStorage.getItem(KEYS.DAILY_DATA)) || [];
        const todayString = getTodayString();
        
        const index = allData.findIndex(data => data.date === todayString);
        
        if (index !== -1) {
            allData[index] = {...allData[index], ...newData};
        } else {
            allData.push({
                date: todayString,
                ...newData
            });
        }
        
        localStorage.setItem(KEYS.DAILY_DATA, JSON.stringify(allData));
        
        return allData[index >= 0 ? index : allData.length - 1];
    };

    // 获取所有历史数据
    const getAllData = () => {
        return JSON.parse(localStorage.getItem(KEYS.DAILY_DATA)) || [];
    };

    // 获取默认任务列表
    const getDefaultTasks = () => {
        return {
            '身体健康': [
                '散步30分钟',
                '做15分钟拉伸',
                '喝8杯水',
                '保持良好坐姿1小时',
                '健身30分钟'
            ],
            '心理健康': [
                '冥想10分钟',
                '进行深呼吸练习',
                '写下3件感恩的事',
                '减少社交媒体使用时间',
                '享受独处时光'
            ],
            '灵魂滋养': [
                '阅读15分钟',
                '聆听喜爱的音乐',
                '欣赏艺术作品',
                '写诗或随笔',
                '学习新知识'
            ],
            '自我提升': [
                '学习新技能',
                '制定短期目标',
                '总结今日收获',
                '反思改进空间',
                '计划明日任务'
            ],
            '广结善缘': [
                '帮助他人',
                '与家人通话',
                '给朋友发消息问候',
                '参与志愿活动',
                '分享有价值的信息'
            ]
        };
    };

    // 获取任务模板
    const getTaskTemplates = () => {
        return JSON.parse(localStorage.getItem(KEYS.TASKS)) || getDefaultTasks();
    };

    // 添加任务模板
    const addTaskTemplate = (category, taskName) => {
        const templates = getTaskTemplates();
        
        if (!templates[category]) {
            templates[category] = [];
        }
        
        if (!templates[category].includes(taskName)) {
            templates[category].push(taskName);
            localStorage.setItem(KEYS.TASKS, JSON.stringify(templates));
        }
        
        return templates;
    };

    // 获取自定义类别
    const getCustomCategories = () => {
        return JSON.parse(localStorage.getItem(KEYS.CUSTOM_CATEGORIES)) || [];
    };

    // 添加自定义类别
    const addCustomCategory = (categoryName) => {
        const categories = getCustomCategories();
        
        if (!categories.includes(categoryName)) {
            categories.push(categoryName);
            localStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
            
            // 同时在任务模板中添加该类别
            const templates = getTaskTemplates();
            templates[categoryName] = [];
            localStorage.setItem(KEYS.TASKS, JSON.stringify(templates));
        }
        
        return categories;
    };

    // 获取应用设置
    const getSettings = () => {
        return JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || {
            darkMode: false,
            notificationsEnabled: true
        };
    };

    // 更新应用设置
    const updateSettings = (newSettings) => {
        const settings = getSettings();
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify({
            ...settings,
            ...newSettings
        }));
        return {...settings, ...newSettings};
    };

    // 导出数据为CSV
    const exportDataToCSV = () => {
        const allData = getAllData();
        
        // CSV 表头
        let csv = "日期,起床时间,学习总时间(分钟),完成任务数,身体健康收入,心理健康收入,灵魂滋养收入,自我提升收入,广结善缘收入,总收入\n";
        
        // 添加数据行
        allData.forEach(day => {
            const studyMinutes = day.studySessions.reduce((total, session) => {
                return total + session.duration;
            }, 0);
            
            const taskCount = day.completedTasks.length;
            
            csv += `${day.date},${day.wakeupTime || ''},${studyMinutes},${taskCount},${day.totalEarnings.bodyHealth},${day.totalEarnings.mentalHealth},${day.totalEarnings.soulNourishment},${day.totalEarnings.selfImprovement},${day.totalEarnings.socialBonds},${day.totalEarnings.total}\n`;
        });
        
        // 添加 UTF-8 BOM
        const BOM = "\uFEFF";
        return BOM + csv;
    };

    // 修改setupDataExport函数
    const setupDataExport = () => {
        document.getElementById('export-data').addEventListener('click', () => {
            // 生成CSV数据
            const csvData = StorageService.exportDataToCSV();
            
            // 创建下载链接
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // 设置下载属性
            link.setAttribute('href', url);
            link.setAttribute('download', `bloom_diary_export_${StorageService.getTodayString()}.csv`);
            link.style.visibility = 'hidden';
            
            // 添加到文档并模拟点击
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 显示通知
            NotificationsModule.showNotification('导出成功', '数据已成功导出为CSV文件');
        });
    };    

    // 删除自定义类别
    const deleteCustomCategory = (categoryName) => {
        try {
            const categories = getCustomCategories();
            const updatedCategories = categories.filter(cat => cat !== categoryName);
            
            // 更新自定义类别列表
            localStorage.setItem(KEYS.CUSTOM_CATEGORIES, JSON.stringify(updatedCategories));
            
            // 从任务模板中移除该类别
            const templates = getTaskTemplates();
            if (templates[categoryName]) {
                delete templates[categoryName];
                localStorage.setItem(KEYS.TASKS, JSON.stringify(templates));
            }
            
            return updatedCategories;
        } catch (error) {
            console.error('删除自定义类别失败:', error);
            throw error;
        }
    };

    // 公开API
    return {
        KEYS,
        initialize,
        getTodayString,
        getTodayData,
        updateTodayData,
        getAllData,
        getTaskTemplates,
        addTaskTemplate,
        getCustomCategories,
        addCustomCategory,
        deleteCustomCategory,
        getSettings,
        updateSettings,
        exportDataToCSV,
        setupDataExport
    };
})();