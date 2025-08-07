/**
 * 设置模块 - 管理应用设置和数据
 */
const SettingsModule = (() => {
    const initialize = () => {
        // 设置按钮点击事件
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            // 移除可能的旧事件监听器
            const newSettingsBtn = settingsBtn.cloneNode(true);
            settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
            
            // 重新绑定事件，添加错误处理
            newSettingsBtn.addEventListener('click', function() {
                try {
                    console.log('设置按钮被点击');
                    openSettingsModal();
                } catch (error) {
                    console.error('打开设置失败:', error);
                    NotificationsModule.showNotification('设置打开失败', '请刷新页面后重试');
                }
            });
        }
        
        // 保存设置按钮
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            const newSaveBtn = saveSettingsBtn.cloneNode(true);
            saveSettingsBtn.parentNode.replaceChild(newSaveBtn, saveSettingsBtn);
            
            newSaveBtn.addEventListener('click', function() {
                try {
                    saveSettings();
                } catch (error) {
                    console.error('保存设置失败:', error);
                    NotificationsModule.showNotification('保存失败', error.message);
                }
            });
        }
        
        // 导出所有数据按钮
        const exportDataBtn = document.getElementById('export-all-data');
        if (exportDataBtn) {
            const newExportBtn = exportDataBtn.cloneNode(true);
            exportDataBtn.parentNode.replaceChild(newExportBtn, exportDataBtn);
            
            newExportBtn.addEventListener('click', function() {
                try {
                    exportAllData();
                } catch (error) {
                    console.error('导出数据失败:', error);
                    NotificationsModule.showNotification('导出失败', error.message);
                }
            });
        }
        
        // 清除数据按钮
        const clearDataBtn = document.getElementById('clear-data');
        if (clearDataBtn) {
            const newClearBtn = clearDataBtn.cloneNode(true);
            clearDataBtn.parentNode.replaceChild(newClearBtn, clearDataBtn);
            
            newClearBtn.addEventListener('click', function() {
                try {
                    confirmClearData();
                } catch (error) {
                    console.error('清除数据失败:', error);
                    NotificationsModule.showNotification('操作失败', error.message);
                }
            });
        }
        
        // 开发者模式切换
        const devModeToggle = document.getElementById('dev-mode-toggle');
        if (devModeToggle) {
            const newToggle = devModeToggle.cloneNode(true);
            devModeToggle.parentNode.replaceChild(newToggle, devModeToggle);
            
            newToggle.addEventListener('change', function(e) {
                try {
                    toggleDevMode(e.target.checked);
                } catch (error) {
                    console.error('切换开发者模式失败:', error);
                }
            });
        }
        
        // 开发者选项按钮
        document.getElementById('add-test-data')?.addEventListener('click', function() {
            try {
                addTestData();
            } catch (error) {
                console.error('添加测试数据失败:', error);
                NotificationsModule.showNotification('操作失败', error.message);
            }
        });
        
        document.getElementById('reset-today')?.addEventListener('click', function() {
            try {
                resetTodayData();
            } catch (error) {
                console.error('重置今日数据失败:', error);
                NotificationsModule.showNotification('操作失败', error.message);
            }
        });
        
        // 加载当前设置
        try {
            loadCurrentSettings();
        } catch (error) {
            console.error('加载设置失败:', error);
        }
        
        // 修复关闭模态框按钮
        document.querySelectorAll('#settings-modal .close-modal').forEach(function(btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                document.getElementById('modal-overlay').classList.add('hidden');
                document.getElementById('settings-modal').classList.add('hidden');
            });
        });
    };
    

    
    // 打开设置模态框
    const openSettingsModal = () => {
        try {
            console.log('打开设置模态框');
            
            // 检查模态框元素是否存在
            const modalOverlay = document.getElementById('modal-overlay');
            const settingsModal = document.getElementById('settings-modal');
            
            if (!modalOverlay || !settingsModal) {
                throw new Error('找不到必要的模态框元素');
            }
            
            // 显示模态框
            modalOverlay.classList.remove('hidden');
            settingsModal.classList.remove('hidden');
            
            // 隐藏其他模态框
            document.querySelectorAll('.modal:not(#settings-modal)').forEach(function(modal) {
                modal.classList.add('hidden');
            });
            
            // 计算数据大小
            calculateDataSize();
            
            // 加载当前设置
            loadCurrentSettings();
        } catch (error) {
            console.error('打开设置模态框失败:', error);
            throw error; // 重新抛出异常以便调用者处理
        }
    };
    
    
    // 加载当前设置
    const loadCurrentSettings = () => {
        // 获取全局设置
        const settings = StorageService.getSettings();
        
        // 获取今天的数据（用于打卡设置）
        const todayData = StorageService.getTodayData();
        
        // 设置早起打卡时间
        if (todayData.earlyWakeSettings) {
            document.getElementById('early-wake-start-time').value = todayData.earlyWakeSettings.startTime;
            document.getElementById('early-wake-end-time').value = todayData.earlyWakeSettings.endTime;
        }
        
        // 设置早睡打卡时间
        if (todayData.earlySleepSettings) {
            document.getElementById('early-sleep-start-time').value = todayData.earlySleepSettings.startTime;
            document.getElementById('early-sleep-end-time').value = todayData.earlySleepSettings.endTime;
        }
        
        // 开发者模式设置
        document.getElementById('dev-mode-toggle').checked = settings.devMode || false;
        toggleDevMode(settings.devMode || false);
    };
    
    // 保存设置
    const saveSettings = () => {
        try {
            // 获取打卡时间设置
            const earlyWakeStartTime = document.getElementById('early-wake-start-time').value;
            const earlyWakeEndTime = document.getElementById('early-wake-end-time').value;
            const earlySleepStartTime = document.getElementById('early-sleep-start-time').value;
            const earlySleepEndTime = document.getElementById('early-sleep-end-time').value;
            
            // 验证时间设置
            if (!earlyWakeStartTime || !earlyWakeEndTime || earlyWakeStartTime >= earlyWakeEndTime) {
                throw new Error('请设置有效的早起打卡时间范围');
            }
            
            if (!earlySleepStartTime || !earlySleepEndTime || earlySleepStartTime >= earlySleepEndTime) {
                throw new Error('请设置有效的早睡打卡时间范围');
            }
            
            // 更新今日数据
            const todayData = StorageService.getTodayData();
            todayData.earlyWakeSettings = {
                startTime: earlyWakeStartTime,
                endTime: earlyWakeEndTime
            };
            todayData.earlySleepSettings = {
                startTime: earlySleepStartTime,
                endTime: earlySleepEndTime
            };
            StorageService.updateTodayData(todayData);
            
            // 更新全局设置
            const devMode = document.getElementById('dev-mode-toggle').checked;
            StorageService.updateSettings({
                devMode: devMode
            });
            
            // 关闭模态框
            document.getElementById('modal-overlay').classList.add('hidden');
            document.getElementById('settings-modal').classList.add('hidden');
            
            // 显示通知
            NotificationsModule.showNotification('设置已保存', '应用设置已成功更新');
            
        } catch (error) {
            console.error('保存设置失败:', error);
            NotificationsModule.showNotification('保存失败', error.message);
        }
    };
    
    // 导出所有数据
    const exportAllData = () => {
        try {
            // 获取所有数据
            const allData = {
                dailyData: StorageService.getAllData(),
                tasks: StorageService.getTaskTemplates(),
                customCategories: StorageService.getCustomCategories(),
                settings: StorageService.getSettings()
            };
            
            // 转换为JSON
            const jsonData = JSON.stringify(allData, null, 2);
            
            // 创建Blob
            const blob = new Blob([jsonData], {type: 'application/json'});
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // 设置下载属性
            const fileName = `bloom_diary_full_export_${StorageService.getTodayString()}.json`;
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
            
            NotificationsModule.showNotification('导出成功', `所有数据已成功导出为 ${fileName}`);
            
        } catch (error) {
            console.error('导出所有数据失败:', error);
            NotificationsModule.showNotification('导出失败', `导出数据时出错: ${error.message}`);
        }
    };
    
    // 确认清除数据
    const confirmClearData = () => {
        // 创建确认对话框
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'modal';
        confirmDialog.innerHTML = `
            <div class="modal-header">
                <h3>确认清除数据</h3>
                <button class="close-modal">×</button>
            </div>
            <div class="modal-body">
                <p>此操作将永久删除所有应用数据，包括任务记录、统计数据和设置。</p>
                <p>此操作无法撤销，请确认是否继续？</p>
                <div class="form-actions">
                    <button id="confirm-clear-data" class="danger-btn">确认清除</button>
                    <button id="cancel-clear-data" class="secondary-btn">取消</button>
                </div>
            </div>
        `;
        
        // 隐藏设置模态框
        document.getElementById('settings-modal').classList.add('hidden');
        
        // 显示确认对话框
        document.getElementById('modal-overlay').appendChild(confirmDialog);
        
        // 设置确认按钮事件
        document.getElementById('confirm-clear-data').addEventListener('click', () => {
            clearAllData();
            document.getElementById('modal-overlay').removeChild(confirmDialog);
            document.getElementById('modal-overlay').classList.add('hidden');
        });
        
        // 设置取消按钮事件
        document.getElementById('cancel-clear-data').addEventListener('click', () => {
            document.getElementById('modal-overlay').removeChild(confirmDialog);
            document.getElementById('settings-modal').classList.remove('hidden');
        });
        
        // 设置关闭按钮事件
        confirmDialog.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('modal-overlay').removeChild(confirmDialog);
            document.getElementById('settings-modal').classList.remove('hidden');
        });
    };
    
    // 清除所有数据
    const clearAllData = () => {
        try {
            // 清除所有相关的localStorage条目
            for(let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('bloom_')) {
                    localStorage.removeItem(key);
                }
            }
            
            // 重新初始化存储
            StorageService.initialize();
            
            // 刷新页面
            NotificationsModule.showNotification('数据已清除', '应用数据已成功清除，即将刷新页面');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('清除数据失败:', error);
            NotificationsModule.showNotification('清除失败', `清除数据时出错: ${error.message}`);
        }
    };
    
    // 切换开发者模式
    const toggleDevMode = (enabled) => {
        const devOptions = document.getElementById('dev-options');
        if (enabled) {
            devOptions.classList.remove('hidden');
        } else {
            devOptions.classList.add('hidden');
        }
    };
    
    // 添加测试数据
    const addTestData = () => {
        try {
            // 生成测试数据
            const now = new Date();
            const todayString = StorageService.getTodayString();
            
            // 获取所有现有数据
            const allData = StorageService.getAllData();
            
            // 生成过去7天的测试数据
            for (let i = 1; i <= 7; i++) {
                const testDate = new Date(now);
                testDate.setDate(now.getDate() - i);
                
                const testDateString = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;
                
                // 检查该日期是否已有数据
                if (!allData.some(data => data.date === testDateString)) {
                    // 生成随机起床时间（5:00-8:00之间）
                    const wakeHour = 5 + Math.floor(Math.random() * 3);
                    const wakeMinute = Math.floor(Math.random() * 60);
                    const wakeupTime = new Date(testDate);
                    wakeupTime.setHours(wakeHour, wakeMinute, 0);
                    
                    // 生成随机睡眠时间（21:00-23:00之间）
                    const sleepHour = 21 + Math.floor(Math.random() * 2);
                    const sleepMinute = Math.floor(Math.random() * 60);
                    const sleepStartTime = new Date(testDate);
                    sleepStartTime.setHours(sleepHour, sleepMinute, 0);
                    
                    // 生成第二天的起床时间
                    const nextDay = new Date(testDate);
                    nextDay.setDate(testDate.getDate() + 1);
                    const sleepEndTime = new Date(nextDay);
                    sleepEndTime.setHours(wakeHour, wakeMinute, 0);
                    
                    // 计算睡眠时长
                    const sleepDuration = (sleepEndTime - sleepStartTime) / (1000 * 60);
                    
                    // 生成随机学习时长（0-3小时）
                    const studyHours = Math.random() * 3;
                    const studyMinutes = Math.round(studyHours * 60);
                    
                    // 构建测试数据对象
                    const testData = {
                        date: testDateString,
                        wakeupTime: wakeupTime.toISOString(),
                        sleepStartTime: sleepStartTime.toISOString(),
                        sleepEndTime: sleepEndTime.toISOString(),
                        sleepDuration: sleepDuration,
                        earlyWakeSettings: {
                            startTime: "05:00",
                            endTime: "06:00"
                        },
                        earlyWakeCheckedIn: wakeHour < 6,
                        earlySleepSettings: {
                            startTime: "22:00",
                            endTime: "23:00"
                        },
                        earlySleepCheckedIn: sleepHour < 23,
                        studySessions: [
                            {
                                id: `test-${Date.now()}-${i}`,
                                startTime: new Date(testDate).toISOString(),
                                endTime: new Date(testDate).toISOString(),
                                duration: studyMinutes,
                                completed: true,
                                earnings: (studyMinutes / 60) * 10
                            }
                        ],
                        completedTasks: [
                            {
                                id: `test-task-1-${i}`,
                                category: '身体健康',
                                name: '散步30分钟',
                                completed: true,
                                date: new Date(testDate).toISOString(),
                                earnings: 2
                            },
                            {
                                id: `test-task-2-${i}`,
                                category: '心理健康',
                                name: '冥想10分钟',
                                completed: true,
                                date: new Date(testDate).toISOString(),
                                earnings: 2
                            }
                        ],
                        totalEarnings: {
                            bodyHealth: (wakeHour < 6 ? 3 : 0) + (sleepHour < 23 ? 3 : 0) + 2,
                            mentalHealth: 2,
                            soulNourishment: 0,
                            selfImprovement: (studyMinutes / 60) * 10,
                            socialBonds: 0,
                            total: (wakeHour < 6 ? 3 : 0) + (sleepHour < 23 ? 3 : 0) + 4 + (studyMinutes / 60) * 10
                        }
                    };
                    
                    // 添加到所有数据中
                    allData.push(testData);
                }
            }
            
            // 保存更新后的数据
            localStorage.setItem(StorageService.KEYS.DAILY_DATA, JSON.stringify(allData));
            
            // 显示通知
            NotificationsModule.showNotification('测试数据已添加', '成功生成了过去7天的测试数据');
            
        } catch (error) {
            console.error('添加测试数据失败:', error);
            NotificationsModule.showNotification('添加测试数据失败', error.message);
        }
    };
    
    // 重置今日数据
    const resetTodayData = () => {
        try {
            // 获取所有数据
            const allData = StorageService.getAllData();
            const todayString = StorageService.getTodayString();
            
            // 找到并移除今日数据
            const index = allData.findIndex(data => data.date === todayString);
            if (index !== -1) {
                allData.splice(index, 1);
            }
            
            // 保存更新后的数据
            localStorage.setItem(StorageService.KEYS.DAILY_DATA, JSON.stringify(allData));
            
            // 重新初始化今日数据
            StorageService.getTodayData();
            
            // 显示通知
            NotificationsModule.showNotification('今日数据已重置', '所有今日数据已被清除，页面即将刷新');
            
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('重置今日数据失败:', error);
            NotificationsModule.showNotification('重置失败', `重置今日数据时出错: ${error.message}`);
        }
    };
    
    // 计算数据大小
    const calculateDataSize = () => {
        try {
            let totalSize = 0;
            
            // 计算localStorage中所有与应用相关的数据大小
            for(let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('bloom_')) {
                    const value = localStorage.getItem(key);
                    totalSize += key.length + value.length;
                }
            }
            
            // 转换为合适的单位
            let sizeDisplay;
            if (totalSize < 1024) {
                sizeDisplay = `${totalSize} 字节`;
            } else if (totalSize < 1024 * 1024) {
                sizeDisplay = `${(totalSize / 1024).toFixed(2)} KB`;
            } else {
                sizeDisplay = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
            }
            
            const dataSize = document.getElementById('data-size');
            if (dataSize) {
                dataSize.textContent = sizeDisplay;
            }
        } catch (error) {
            console.error('计算数据大小出错:', error);
            const dataSize = document.getElementById('data-size');
            if (dataSize) {
                dataSize.textContent = '计算失败';
            }
        }
    };
    
    // 公开API
    return {
        initialize,
        calculateDataSize,
        loadCurrentSettings,
        openSettingsModal  // 添加此方法到公开API
    };
})();