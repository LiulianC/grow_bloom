/**
 * 任务管理模块 - 管理任务和打卡功能
 */
const TasksModule = (() => {
    // 默认类别
    const DEFAULT_CATEGORIES = ['身体健康', '心理健康', '灵魂滋养', '自我提升', '广结善缘'];
    
    // 类别与收入字段的映射
    const CATEGORY_EARNING_MAPPING = {
        '身体健康': 'bodyHealth',
        '心理健康': 'mentalHealth',
        '灵魂滋养': 'soulNourishment',
        '自我提升': 'selfImprovement',
        '广结善缘': 'socialBonds'
    };
    
    // 初始化任务系统
    const initialize = () => {
        // 加载任务类别和自定义类别
        loadCategories();
        
        // 诊断并修复类别问题
        diagnoseAndFixCategoryIssues();

        // 加载今日任务
        loadTodayTasks();
        
        // 设置起床打卡功能
        setupWakeupButton();

        // 设置睡眠打卡功能
        setupSleepTracking();        
        
        // 设置添加任务功能
        setupAddTaskForm();
        
        // 设置添加类别功能
        setupAddCategoryForm();

        // 设置定时打卡功能
        setupTimedCheckIn();        
        
        // 设置标签切换功能
        setupTabSwitching();
        
        // 添加任务按钮点击事件
        document.getElementById('add-task-btn').addEventListener('click', () => {
            // 加载任务模板
            loadTaskTemplates();
            
            // 显示添加任务模态框
            document.getElementById('modal-overlay').classList.remove('hidden');
            document.getElementById('add-task-modal').classList.remove('hidden');
        });
    };
    
    // 加载所有类别（默认+自定义）
    const loadCategories = () => {
        const customCategories = StorageService.getCustomCategories();
        console.log('加载自定义类别:', customCategories);
        
        // 处理自定义类别
        if (customCategories && customCategories.length > 0) {
            const customCategoriesContainer = document.getElementById('custom-categories');
            
            if (customCategoriesContainer) {
                customCategoriesContainer.innerHTML = '';
                
                customCategories.forEach(category => {
                    // 创建自定义类别卡片
                    const categoryCard = document.createElement('div');
                    categoryCard.className = 'category-card';
                    categoryCard.dataset.category = category;
                    
                    // 创建类别内容
                    categoryCard.innerHTML = `
                        <span class="category-name">${category}</span>
                        <button class="delete-category-btn" data-category="${category}" title="删除类别">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    // 添加点击事件（仅对类别名称）
                    const categoryName = categoryCard.querySelector('.category-name');
                    categoryName.addEventListener('click', () => {
                        // 确保存在标签和内容
                        if (!document.querySelector(`.tab-btn[data-category="${category}"]`)) {
                            addCategoryTab(category);
                        }
                        // 切换到该标签
                        switchTab(category);
                    });
                    
                    // 添加删除按钮事件
                    const deleteBtn = categoryCard.querySelector('.delete-category-btn');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // 防止触发类别点击事件
                        confirmDeleteCategory(category);
                    });
                    
                    customCategoriesContainer.appendChild(categoryCard);
                });
            }
            
            // 为每个自定义类别添加标签和内容区域
            customCategories.forEach(category => {
                if (!document.querySelector(`.tab-btn[data-category="${category}"]`)) {
                    addCategoryTab(category);
                }
            });
        }
    };
    
    // 动态添加类别标签
    const addCategoryTab = (category) => {
        console.log(`尝试添加类别标签: ${category}`);
        
        // 检查标签是否已存在
        if (document.querySelector(`.tab-btn[data-category="${category}"]`)) {
            console.log(`标签 ${category} 已存在`);
            return;
        }
        
        const tabsContainer = document.querySelector('.tabs');
        const customTabBtn = document.getElementById('custom-tab');
        
        if (!tabsContainer || !customTabBtn) {
            console.error('找不到标签容器或自定义标签按钮');
            return;
        }
        
        // 创建新标签按钮
        const newTabBtn = document.createElement('button');
        newTabBtn.className = 'tab-btn';
        newTabBtn.dataset.category = category;
        newTabBtn.textContent = category;
        newTabBtn.addEventListener('click', () => switchTab(category));
        
        // 在自定义标签按钮前插入
        tabsContainer.insertBefore(newTabBtn, customTabBtn);
        
        // 创建对应的内容区域
        const tabContentsParent = document.querySelector('.card-body');
        
        if (!tabContentsParent) {
            console.error('找不到标签内容的父容器');
            return;
        }
        
        const newTabContent = document.createElement('div');
        newTabContent.className = 'tab-content';
        newTabContent.dataset.category = category;
        
        // 创建任务列表容器
        const tasksList = document.createElement('div');
        tasksList.className = 'tasks-list';
        tasksList.id = `tasks-${category}`;
        newTabContent.appendChild(tasksList);
        
        tabContentsParent.appendChild(newTabContent);
        
        console.log(`类别标签添加成功: ${category}`);
    };
    
    // 切换标签
    const switchTab = (category) => {
        console.log(`切换到标签: ${category}`);
        
        // 获取所有标签按钮和内容
        const allTabBtns = document.querySelectorAll('.tab-btn');
        const allTabContents = document.querySelectorAll('.tab-content');
        
        // 取消激活所有标签和内容
        allTabBtns.forEach(tab => tab.classList.remove('active'));
        allTabContents.forEach(content => content.classList.remove('active'));
        
        // 找到对应标签按钮和内容
        const targetTabBtn = document.querySelector(`.tab-btn[data-category="${category}"]`);
        const targetTabContent = document.querySelector(`.tab-content[data-category="${category}"]`);
        
        if (!targetTabBtn || !targetTabContent) {
            console.error(`找不到类别为 ${category} 的标签或内容`);
            return;
        }
        
        // 激活目标标签和内容
        targetTabBtn.classList.add('active');
        targetTabContent.classList.add('active');
        
        console.log(`标签切换成功: ${category}`);
    };
    
    // 设置标签切换
    const setupTabSwitching = () => {
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                switchTab(category);
            });
        });
    };
    
    // 加载今日任务
    const loadTodayTasks = () => {
        console.log('加载今日任务...');
        
        const todayData = StorageService.getTodayData();
        const completedTasks = todayData.completedTasks || [];
        
        // 检查并显示今日起床时间
        if (todayData.wakeupTime) {
            console.log('今日已进行起床打卡');
            // 相关代码在 setupWakeupButton 中处理
        }
        
        // 清空所有任务列表
        DEFAULT_CATEGORIES.forEach(category => {
            const tasksContainer = document.getElementById(`tasks-${category}`);
            if (tasksContainer) {
                tasksContainer.innerHTML = '';
            }
        });
        
        // 清空自定义类别的任务列表
        const customCategories = StorageService.getCustomCategories();
        customCategories.forEach(category => {
            const tasksContainer = document.getElementById(`tasks-${category}`);
            if (tasksContainer) {
                tasksContainer.innerHTML = '';
            } else {
                console.log(`为自定义类别 "${category}" 创建任务容器`);
                addCategoryTab(category);
            }
        });
        
        // 显示已完成的任务
        completedTasks.forEach(task => {
            console.log(`显示已完成任务: "${task.name}" (${task.category})`);
            
            // 确保类别存在
            if (!DEFAULT_CATEGORIES.includes(task.category) && !customCategories.includes(task.category)) {
                console.log(`任务的类别 "${task.category}" 不存在，添加为自定义类别`);
                StorageService.addCustomCategory(task.category);
                addCategoryTab(task.category);
            }
            
            // 添加任务到UI
            addTaskToUI(task, true);
        });
        
        console.log(`今日任务加载完成，共 ${completedTasks.length} 个已完成任务`);
    };
    
    // 设置起床打卡功能
    const setupWakeupButton = () => {
        const wakeupBtn = document.getElementById('wakeup-btn');
        
        wakeupBtn.addEventListener('click', () => {
            const now = new Date();
            const wakeupTime = now.toISOString();
            
            // 更新今日数据
            const todayData = StorageService.getTodayData();
            todayData.wakeupTime = wakeupTime;
            
            // 添加到完成任务列表
            const wakeupTask = {
                id: `wakeup-${Date.now()}`,
                category: '身体健康',
                name: '起床打卡',
                completed: true,
                date: wakeupTime,
                earnings: 2
            };
            
            todayData.completedTasks.push(wakeupTask);
            
            // 更新身体健康收入
            todayData.totalEarnings.bodyHealth += 2;
            todayData.totalEarnings.total += 2;
            
            StorageService.updateTodayData(todayData);
            
            // 更新UI
            wakeupBtn.disabled = true;
            
            const wakeupTimeValue = document.getElementById('wakeup-time-value');
            wakeupTimeValue.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            document.getElementById('wakeup-time').style.display = 'block';
            
            // 显示通知
            NotificationsModule.showNotification('起床打卡成功', '获得2元奖励！新的一天，充满希望！');
            
            // 更新总览
            updateDailyOverview();
        });
    };

    const setupSleepTracking = () => {
        const sleepStartBtn = document.getElementById('sleep-start-btn');
        const sleepEndBtn = document.getElementById('sleep-end-btn');
        const sleepTimeDiv = document.getElementById('sleep-time');
        const sleepStartTimeSpan = document.getElementById('sleep-start-time');
        const sleepEndTimeSpan = document.getElementById('sleep-end-time');
        const sleepDurationSpan = document.getElementById('sleep-duration');
        
        // 加载当前睡眠状态
        const loadSleepStatus = () => {
            const todayData = StorageService.getTodayData();
            
            if (todayData.sleepStartTime && !todayData.sleepEndTime) {
                // 睡眠已开始但未结束
                sleepStartBtn.disabled = true;
                sleepEndBtn.disabled = false;
                sleepTimeDiv.style.display = 'block';
                sleepStartTimeSpan.textContent = new Date(todayData.sleepStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                sleepEndTimeSpan.textContent = '进行中...';
                sleepDurationSpan.textContent = '计时中...';
            } else if (todayData.sleepStartTime && todayData.sleepEndTime) {
                // 睡眠已完成
                sleepStartBtn.disabled = true;
                sleepEndBtn.disabled = true;
                sleepTimeDiv.style.display = 'block';
                sleepStartTimeSpan.textContent = new Date(todayData.sleepStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                sleepEndTimeSpan.textContent = new Date(todayData.sleepEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                const duration = Math.round(todayData.sleepDuration);
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                sleepDurationSpan.textContent = `${hours}小时${minutes}分钟`;
            }
        };
        
        // 开始睡眠
        sleepStartBtn.addEventListener('click', () => {
            const now = new Date();
            const sleepStartTime = now.toISOString();
            
            // 更新今日数据
            const todayData = StorageService.getTodayData();
            todayData.sleepStartTime = sleepStartTime;
            
            StorageService.updateTodayData(todayData);
            
            // 更新UI
            sleepStartBtn.disabled = true;
            sleepEndBtn.disabled = false;
            sleepTimeDiv.style.display = 'block';
            sleepStartTimeSpan.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            sleepEndTimeSpan.textContent = '进行中...';
            sleepDurationSpan.textContent = '计时中...';
            
            // 显示通知
            NotificationsModule.showNotification('睡眠开始', '晚安！祝你有个美好的梦！');
        });
        
        // 结束睡眠
        sleepEndBtn.addEventListener('click', () => {
            const now = new Date();
            const sleepEndTime = now.toISOString();
            
            // 更新今日数据
            const todayData = StorageService.getTodayData();
            todayData.sleepEndTime = sleepEndTime;
            
            // 计算睡眠时长（分钟）
            const startTime = new Date(todayData.sleepStartTime);
            const endTime = new Date(sleepEndTime);
            const durationMinutes = (endTime - startTime) / (1000 * 60);
            todayData.sleepDuration = durationMinutes;
            
            // 添加到完成任务列表
            const sleepTask = {
                id: `sleep-${Date.now()}`,
                category: '身体健康',
                name: `睡眠 (${Math.floor(durationMinutes/60)}小时${Math.round(durationMinutes%60)}分钟)`,
                completed: true,
                date: sleepEndTime,
                earnings: 2
            };
            
            todayData.completedTasks.push(sleepTask);
            
            // 更新身体健康收入
            todayData.totalEarnings.bodyHealth += 2;
            todayData.totalEarnings.total += 2;
            
            StorageService.updateTodayData(todayData);
            
            // 更新UI
            sleepEndBtn.disabled = true;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = Math.round(durationMinutes % 60);
            sleepEndTimeSpan.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            sleepDurationSpan.textContent = `${hours}小时${minutes}分钟`;
            
            // 显示通知
            NotificationsModule.showNotification('睡眠记录完成', `早安！你睡了 ${hours}小时${minutes}分钟，获得2元奖励！`);
            
            // 更新总览
            updateDailyOverview();
        });
        
        // 加载初始状态
        loadSleepStatus();
    };

    // 加载任务模板
    const loadTaskTemplates = () => {
        const templatesContainer = document.getElementById('task-templates');
        templatesContainer.innerHTML = '';
        
        const category = document.getElementById('task-category').value;
        const templates = StorageService.getTaskTemplates()[category] || [];
        
        templates.forEach(template => {
            const templateTag = document.createElement('span');
            templateTag.className = 'template-tag';
            templateTag.textContent = template;
            templateTag.addEventListener('click', () => {
                document.getElementById('task-name').value = template;
            });
            
            templatesContainer.appendChild(templateTag);
        });
    };
    
    // 设置添加任务表单
    const setupAddTaskForm = () => {
        const form = document.getElementById('add-task-form');
        const categorySelect = document.getElementById('task-category');
        
        // 类别变化时更新模板
        categorySelect.addEventListener('change', loadTaskTemplates);
        
        // 添加自定义类别到选择框
        const updateCategoryOptions = () => {
            console.log('更新任务类别选项');
            
            // 保存当前选中值
            const selectedValue = categorySelect.value;
            
            // 清空选项
            categorySelect.innerHTML = '';
            
            // 添加默认类别
            DEFAULT_CATEGORIES.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
            
            // 添加自定义类别
            const customCategories = StorageService.getCustomCategories();
            console.log('自定义类别:', customCategories);
            
            customCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
            
            // 恢复选中值
            if (selectedValue && Array.from(categorySelect.options).some(opt => opt.value === selectedValue)) {
                categorySelect.value = selectedValue;
            }
        };
        
        // 初始化类别选项
        updateCategoryOptions();
        
        // 显示添加类别模态框
        document.getElementById('add-category-btn').addEventListener('click', () => {
            document.getElementById('add-task-modal').classList.add('hidden');
            document.getElementById('add-category-modal').classList.remove('hidden');
        });
        
        // 提交表单处理
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const category = categorySelect.value;
            const taskName = document.getElementById('task-name').value.trim();
            
            if (!taskName) return;
            
            console.log(`创建新任务: "${taskName}" (${category})`);
            
            // 创建任务对象
            const task = {
                id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                category: category,
                name: taskName,
                completed: false,
                date: new Date().toISOString(),
                earnings: 0
            };
            
            // 添加到任务模板
            StorageService.addTaskTemplate(category, taskName);
            
            // 确保类别标签存在
            if (!document.querySelector(`.tab-btn[data-category="${category}"]`)) {
                console.log(`为 ${category} 创建新标签`);
                addCategoryTab(category);
            }
            
            // 添加到UI
            addTaskToUI(task, false);
            
            // 切换到对应标签
            switchTab(category);
            
            // 关闭模态框
            document.getElementById('modal-overlay').classList.add('hidden');
            document.getElementById('add-task-modal').classList.add('hidden');
            
            // 重置表单
            form.reset();
            
            console.log(`任务创建完成: "${taskName}" (${category})`);
        });
    };


    
    // 设置添加类别表单
    const setupAddCategoryForm = () => {
        const form = document.getElementById('add-category-form');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const categoryName = document.getElementById('category-name').value.trim();
            
            if (!categoryName) return;
            
            console.log(`添加新类别: ${categoryName}`);
            
            // 验证类别名称是否重复
            if (DEFAULT_CATEGORIES.includes(categoryName) || 
                StorageService.getCustomCategories().includes(categoryName)) {
                NotificationsModule.showNotification('添加失败', `类别"${categoryName}"已存在`);
                return;
            }
            
            // 添加到自定义类别
            StorageService.addCustomCategory(categoryName);
            
            // 更新UI
            loadCategories();
            
            // 添加新标签
            addCategoryTab(categoryName);
            
            // 更新任务表单中的类别选择
            const categorySelect = document.getElementById('task-category');
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
            categorySelect.value = categoryName;
            
            // 切换到新标签
            switchTab(categoryName);
            
            // 关闭类别模态框，打开任务模态框
            document.getElementById('add-category-modal').classList.add('hidden');
            document.getElementById('add-task-modal').classList.remove('hidden');
            
            // 清空类别输入框
            document.getElementById('category-name').value = '';
            
            console.log(`类别添加成功: ${categoryName}`);
        });
    };
    
    // 添加任务到UI
    const addTaskToUI = (task, isCompleted) => {
        // 查找或创建任务容器
        let tasksContainer = document.getElementById(`tasks-${task.category}`);
        
        // 如果容器不存在，先添加标签和容器
        if (!tasksContainer) {
            console.log(`为 ${task.category} 创建新的任务容器`);
            
            // 检查是否需要添加类别标签
            if (!document.querySelector(`.tab-btn[data-category="${task.category}"]`)) {
                addCategoryTab(task.category);
            }
            
            // 再次尝试获取容器
            tasksContainer = document.getElementById(`tasks-${task.category}`);
            
            // 如果仍然不存在，则创建
            if (!tasksContainer) {
                console.log(`手动创建 ${task.category} 的任务容器`);
                const tabContent = document.querySelector(`.tab-content[data-category="${task.category}"]`);
                
                if (tabContent) {
                    tasksContainer = document.createElement('div');
                    tasksContainer.className = 'tasks-list';
                    tasksContainer.id = `tasks-${task.category}`;
                    tabContent.appendChild(tasksContainer);
                } else {
                    console.error(`无法找到 ${task.category} 的标签内容`);
                    return;
                }
            }
        }
        
        // 检查任务是否已存在（避免重复添加）
        if (document.querySelector(`.task-item[data-id="${task.id}"]`)) {
            console.log(`任务 ${task.id} 已存在，跳过添加`);
            return;
        }
        
        // 创建任务元素
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${isCompleted ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        taskElement.innerHTML = `
            <span>${task.name}</span>
            <div class="task-check">
                <i class="fas fa-check"></i>
            </div>
        `;
        
        // 如果任务未完成，添加点击事件
        if (!isCompleted) {
            const checkBtn = taskElement.querySelector('.task-check');
            checkBtn.addEventListener('click', function() {
                completeTask(task, taskElement);
            });
        }
        
        tasksContainer.appendChild(taskElement);
        console.log(`已添加任务 "${task.name}" 到 ${task.category} 类别`);
        
        // 更新总览
        updateDailyOverview();
    };

    const setupTimedCheckIn = () => {
        // 获取DOM元素
        const earlyWakeSection = document.querySelector('.early-wake-section');
        const earlySleepSection = document.querySelector('.early-sleep-section');
        
        // 如果DOM元素不存在，需要先创建
        if (!earlyWakeSection) {
            createTimedCheckInUI();
        }
        
        // 加载保存的设置
        loadTimedCheckInSettings();
        
        // 设置打卡按钮事件
        setupTimedCheckInButtons();
    };

    // 创建定时打卡UI
    const createTimedCheckInUI = () => {
        // 获取身体健康标签内容
        const healthTabContent = document.querySelector('.tab-content[data-category="身体健康"]');
        
        // 在起床打卡卡片后添加定时打卡区域
        const timedCheckInHTML = `
            <div class="timed-checkin-container">
                <div class="early-wake-section timed-checkin-card">
                    <div class="checkin-header">
                        <i class="fas fa-sun"></i>
                        <h3>早起打卡</h3>
                        <span class="checkin-status" id="early-wake-status">未设置</span>
                    </div>
                    <div class="checkin-time-setting">
                        <span>目标时间段：</span>
                        <input type="time" id="early-wake-start" value="05:00"> - 
                        <input type="time" id="early-wake-end" value="06:00">
                        <button id="save-early-wake" class="small-btn">保存</button>
                    </div>
                    <div class="checkin-actions">
                        <button id="early-wake-checkin" class="primary-btn">打卡</button>
                    </div>
                    <div class="checkin-info" id="early-wake-info">
                        <p>在05:00-06:00之间打卡有效，可获得3元奖励</p>
                    </div>
                </div>
                
                <div class="early-sleep-section timed-checkin-card">
                    <div class="checkin-header">
                        <i class="fas fa-moon"></i>
                        <h3>早睡打卡</h3>
                        <span class="checkin-status" id="early-sleep-status">未设置</span>
                    </div>
                    <div class="checkin-time-setting">
                        <span>目标时间段：</span>
                        <input type="time" id="early-sleep-start" value="22:00"> - 
                        <input type="time" id="early-sleep-end" value="23:00">
                        <button id="save-early-sleep" class="small-btn">保存</button>
                    </div>
                    <div class="checkin-actions">
                        <button id="early-sleep-checkin" class="primary-btn">打卡</button>
                    </div>
                    <div class="checkin-info" id="early-sleep-info">
                        <p>在22:00-23:00之间打卡有效，可获得3元奖励</p>
                    </div>
                </div>
            </div>
        `;
        
        // 将定时打卡UI插入到起床打卡后面
        const wakeupCard = healthTabContent.querySelector('.wakeup-card');
        if (wakeupCard) {
            wakeupCard.insertAdjacentHTML('afterend', timedCheckInHTML);
        } else {
            healthTabContent.insertAdjacentHTML('afterbegin', timedCheckInHTML);
        }
    };

    // 加载保存的定时打卡设置
    const loadTimedCheckInSettings = () => {
        const todayData = StorageService.getTodayData();
        
        // 加载早起打卡设置和状态
        if (todayData.earlyWakeSettings) {
            document.getElementById('early-wake-start').value = todayData.earlyWakeSettings.startTime;
            document.getElementById('early-wake-end').value = todayData.earlyWakeSettings.endTime;
            
            const earlyWakeInfo = document.getElementById('early-wake-info');
            earlyWakeInfo.innerHTML = `<p>在${todayData.earlyWakeSettings.startTime}-${todayData.earlyWakeSettings.endTime}之间打卡有效，可获得3元奖励</p>`;
            
            if (todayData.earlyWakeCheckedIn) {
                document.getElementById('early-wake-status').textContent = '已完成';
                document.getElementById('early-wake-status').classList.add('completed');
                document.getElementById('early-wake-checkin').disabled = true;
            }
        }
        
        // 加载早睡打卡设置和状态
        if (todayData.earlySleepSettings) {
            document.getElementById('early-sleep-start').value = todayData.earlySleepSettings.startTime;
            document.getElementById('early-sleep-end').value = todayData.earlySleepSettings.endTime;
            
            const earlySleepInfo = document.getElementById('early-sleep-info');
            earlySleepInfo.innerHTML = `<p>在${todayData.earlySleepSettings.startTime}-${todayData.earlySleepSettings.endTime}之间打卡有效，可获得3元奖励</p>`;
            
            if (todayData.earlySleepCheckedIn) {
                document.getElementById('early-sleep-status').textContent = '已完成';
                document.getElementById('early-sleep-status').classList.add('completed');
                document.getElementById('early-sleep-checkin').disabled = true;
            }
        }
    };

    // 设置定时打卡按钮事件
    const setupTimedCheckInButtons = () => {
        // 早起打卡设置保存
        document.getElementById('save-early-wake').addEventListener('click', () => {
            const startTime = document.getElementById('early-wake-start').value;
            const endTime = document.getElementById('early-wake-end').value;
            
            // 验证时间设置
            if (!startTime || !endTime || startTime >= endTime) {
                NotificationsModule.showNotification('设置失败', '请设置有效的时间范围');
                return;
            }
            
            // 保存设置
            const todayData = StorageService.getTodayData();
            todayData.earlyWakeSettings = {
                startTime: startTime,
                endTime: endTime
            };
            StorageService.updateTodayData(todayData);
            
            // 更新UI
            const earlyWakeInfo = document.getElementById('early-wake-info');
            earlyWakeInfo.innerHTML = `<p>在${startTime}-${endTime}之间打卡有效，可获得3元奖励</p>`;
            
            NotificationsModule.showNotification('设置成功', `早起打卡时间已设为${startTime}-${endTime}`);
        });
        
        // 早睡打卡设置保存
        document.getElementById('save-early-sleep').addEventListener('click', () => {
            const startTime = document.getElementById('early-sleep-start').value;
            const endTime = document.getElementById('early-sleep-end').value;
            
            // 验证时间设置
            if (!startTime || !endTime || startTime >= endTime) {
                NotificationsModule.showNotification('设置失败', '请设置有效的时间范围');
                return;
            }
            
            // 保存设置
            const todayData = StorageService.getTodayData();
            todayData.earlySleepSettings = {
                startTime: startTime,
                endTime: endTime
            };
            StorageService.updateTodayData(todayData);
            
            // 更新UI
            const earlySleepInfo = document.getElementById('early-sleep-info');
            earlySleepInfo.innerHTML = `<p>在${startTime}-${endTime}之间打卡有效，可获得3元奖励</p>`;
            
            NotificationsModule.showNotification('设置成功', `早睡打卡时间已设为${startTime}-${endTime}`);
        });
        
        // 早起打卡
        document.getElementById('early-wake-checkin').addEventListener('click', () => {
            const todayData = StorageService.getTodayData();
            
            if (!todayData.earlyWakeSettings) {
                NotificationsModule.showNotification('打卡失败', '请先设置打卡时间范围');
                return;
            }
            
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // 检查是否在有效时间范围内
            if (currentTime >= todayData.earlyWakeSettings.startTime && currentTime <= todayData.earlyWakeSettings.endTime) {
                // 打卡成功
                todayData.earlyWakeCheckedIn = true;
                
                // 添加到完成任务列表
                const earlyWakeTask = {
                    id: `early-wake-${Date.now()}`,
                    category: '身体健康',
                    name: '早起打卡成功',
                    completed: true,
                    date: now.toISOString(),
                    earnings: 3
                };
                
                todayData.completedTasks.push(earlyWakeTask);
                
                // 更新身体健康收入
                todayData.totalEarnings.bodyHealth += 3;
                todayData.totalEarnings.total += 3;
                
                StorageService.updateTodayData(todayData);
                
                // 更新UI
                document.getElementById('early-wake-status').textContent = '已完成';
                document.getElementById('early-wake-status').classList.add('completed');
                document.getElementById('early-wake-checkin').disabled = true;
                
                NotificationsModule.showNotification('早起打卡成功', '恭喜你成功早起！获得3元奖励');
                
                // 更新总览
                updateDailyOverview();
            } else {
                // 打卡失败
                NotificationsModule.showNotification('打卡失败', `当前不在有效打卡时间内(${todayData.earlyWakeSettings.startTime}-${todayData.earlyWakeSettings.endTime})`);
            }
        });
        
        // 早睡打卡
        document.getElementById('early-sleep-checkin').addEventListener('click', () => {
            const todayData = StorageService.getTodayData();
            
            if (!todayData.earlySleepSettings) {
                NotificationsModule.showNotification('打卡失败', '请先设置打卡时间范围');
                return;
            }
            
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            // 检查是否在有效时间范围内
            if (currentTime >= todayData.earlySleepSettings.startTime && currentTime <= todayData.earlySleepSettings.endTime) {
                // 打卡成功
                todayData.earlySleepCheckedIn = true;
                
                // 添加到完成任务列表
                const earlySleepTask = {
                    id: `early-sleep-${Date.now()}`,
                    category: '身体健康',
                    name: '早睡打卡成功',
                    completed: true,
                    date: now.toISOString(),
                    earnings: 3
                };
                
                todayData.completedTasks.push(earlySleepTask);
                
                // 更新身体健康收入
                todayData.totalEarnings.bodyHealth += 3;
                todayData.totalEarnings.total += 3;
                
                StorageService.updateTodayData(todayData);
                
                // 更新UI
                document.getElementById('early-sleep-status').textContent = '已完成';
                document.getElementById('early-sleep-status').classList.add('completed');
                document.getElementById('early-sleep-checkin').disabled = true;
                
                NotificationsModule.showNotification('早睡打卡成功', '恭喜你今天早睡！获得3元奖励');
                
                // 更新总览
                updateDailyOverview();
            } else {
                // 打卡失败
                NotificationsModule.showNotification('打卡失败', `当前不在有效打卡时间内(${todayData.earlySleepSettings.startTime}-${todayData.earlySleepSettings.endTime})`);
            }
        });
    };    
        
    // 完成任务
    // 修改 completeTask 函数
    const completeTask = (task, taskElement) => {
        // 检查任务是否已经完成，避免重复计算
        if (taskElement.classList.contains('completed')) {
            return;
        }
        
        // 更新UI
        taskElement.classList.add('completed');
        
        // 更新任务状态
        task.completed = true;
        task.date = new Date().toISOString();
        task.earnings = 2; // 每个任务2元
        
        // 更新今日数据
        const todayData = StorageService.getTodayData();
        
        // 检查是否已存在此任务ID（避免重复添加）
        const existingTaskIndex = todayData.completedTasks.findIndex(t => t.id === task.id);
        if (existingTaskIndex === -1) {
            todayData.completedTasks.push(task);
            
            // 更新相应类别的收入
            const earningField = CATEGORY_EARNING_MAPPING[task.category] || 'selfImprovement';
            todayData.totalEarnings[earningField] += task.earnings;
            todayData.totalEarnings.total += task.earnings;
            
            StorageService.updateTodayData(todayData);
            
            // 显示通知
            NotificationsModule.showNotification('任务完成', `完成"${task.name}"，获得2元奖励！`);
        }
        
        // 更新总览
        updateDailyOverview();
        
        // 禁用点击事件
        const checkBtn = taskElement.querySelector('.task-check');
        checkBtn.removeEventListener('click', () => completeTask(task, taskElement));
        checkBtn.style.pointerEvents = 'none'; // 确保不可点击
    };
    
    // 添加诊断函数，用于检查和修复类别问题
    const diagnoseAndFixCategoryIssues = () => {
        console.log('开始诊断类别问题...');
        
        // 获取所有自定义类别
        const customCategories = StorageService.getCustomCategories();
        console.log(`发现 ${customCategories.length} 个自定义类别`);
        
        // 检查每个自定义类别是否有对应的UI元素
        customCategories.forEach(category => {
            // 检查标签按钮
            const tabBtn = document.querySelector(`.tab-btn[data-category="${category}"]`);
            if (!tabBtn) {
                console.log(`类别 "${category}" 缺少标签按钮，正在修复...`);
                addCategoryTab(category);
            }
            
            // 检查内容区域
            const tabContent = document.querySelector(`.tab-content[data-category="${category}"]`);
            if (!tabContent) {
                console.log(`类别 "${category}" 缺少内容区域，正在修复...`);
                // addCategoryTab函数会同时创建标签和内容区域
            }
            
            // 检查任务列表容器
            const tasksList = document.getElementById(`tasks-${category}`);
            if (!tasksList) {
                console.log(`类别 "${category}" 缺少任务列表容器，正在修复...`);
                
                if (tabContent) {
                    const newTasksList = document.createElement('div');
                    newTasksList.className = 'tasks-list';
                    newTasksList.id = `tasks-${category}`;
                    tabContent.appendChild(newTasksList);
                }
            }
        });
        
        // 检查是否有任务被分配到了不存在的类别
        const todayData = StorageService.getTodayData();
        const allTasks = todayData.completedTasks;
        const missingCategories = new Set();
        
        allTasks.forEach(task => {
            if (!DEFAULT_CATEGORIES.includes(task.category) && !customCategories.includes(task.category)) {
                console.log(`发现任务使用了不存在的类别: "${task.category}"`);
                missingCategories.add(task.category);
            }
        });
        
        // 修复缺失的类别
        missingCategories.forEach(category => {
            console.log(`添加缺失的类别: "${category}"`);
            StorageService.addCustomCategory(category);
            addCategoryTab(category);
        });
        
        console.log('类别诊断和修复完成');
    };

    // 确认删除自定义类别
    const confirmDeleteCategory = (categoryName) => {
        try {
            // 创建确认对话框
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'modal';
            confirmDialog.innerHTML = `
                <div class="modal-header">
                    <h3>确认删除类别</h3>
                    <button class="close-modal">×</button>
                </div>
                <div class="modal-body">
                    <p>确定要删除类别"${categoryName}"吗？</p>
                    <p class="warning-text">此操作将移除该类别及其所有任务模板，但不会删除历史任务记录。</p>
                    <div class="form-actions">
                        <button id="confirm-delete-category" class="danger-btn">确认删除</button>
                        <button id="cancel-delete-category" class="secondary-btn">取消</button>
                    </div>
                </div>
            `;
            
            // 显示确认对话框
            const modalOverlay = document.getElementById('modal-overlay');
            modalOverlay.classList.remove('hidden');
            modalOverlay.appendChild(confirmDialog);
            
            // 设置确认按钮事件
            document.getElementById('confirm-delete-category').addEventListener('click', () => {
                deleteCategory(categoryName);
                modalOverlay.removeChild(confirmDialog);
                modalOverlay.classList.add('hidden');
            });
            
            // 设置取消按钮事件
            document.getElementById('cancel-delete-category').addEventListener('click', () => {
                modalOverlay.removeChild(confirmDialog);
                modalOverlay.classList.add('hidden');
            });
            
            // 设置关闭按钮事件
            confirmDialog.querySelector('.close-modal').addEventListener('click', () => {
                modalOverlay.removeChild(confirmDialog);
                modalOverlay.classList.add('hidden');
            });
            
        } catch (error) {
            console.error('显示删除确认对话框失败:', error);
            NotificationsModule.showNotification('删除失败', '无法显示确认对话框');
        }
    };

    // 删除自定义类别
    const deleteCategory = (categoryName) => {
        try {
            // 使用StorageService删除类别，带备用方案
            let result;
            
            if (StorageService.deleteCustomCategory) {
                // 使用正式的删除方法
                result = StorageService.deleteCustomCategory(categoryName);
            } else {
                // 备用方案：直接操作localStorage
                console.warn('StorageService.deleteCustomCategory不可用，使用备用删除方案');
                
                const storageKey = StorageService.KEYS ? 
                    StorageService.KEYS.CUSTOM_CATEGORIES : 
                    'bloom_custom_categories'; // 备用键名
                
                const categories = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const index = categories.indexOf(categoryName);
                
                if (index === -1) {
                    throw new Error(`类别"${categoryName}"不存在`);
                }
                
                categories.splice(index, 1);
                localStorage.setItem(storageKey, JSON.stringify(categories));
                
                result = { success: true, categories: categories };
            }
            
            if (result.success) {
                // 移除UI中的类别卡片
                const categoryCard = document.querySelector(`.category-card[data-category="${categoryName}"]`);
                if (categoryCard) {
                    categoryCard.remove();
                }
                
                // 移除标签按钮
                const tabBtn = document.querySelector(`.tab-btn[data-category="${categoryName}"]`);
                if (tabBtn) {
                    tabBtn.remove();
                }
                
                // 移除标签内容
                const tabContent = document.querySelector(`.tab-content[data-category="${categoryName}"]`);
                if (tabContent) {
                    tabContent.remove();
                }
                
                // 更新任务表单中的类别选择
                const categorySelect = document.getElementById('task-category');
                if (categorySelect) {
                    const option = categorySelect.querySelector(`option[value="${categoryName}"]`);
                    if (option) {
                        option.remove();
                    }
                }
                
                // 切换到默认标签
                switchTab('身体健康');
                
                // 显示成功通知
                let message = `类别"${categoryName}"已成功删除`;
                if (result.hasTasksInCategory) {
                    message += '，但历史任务记录仍保留';
                }
                NotificationsModule.showNotification('删除成功', message);
                
                console.log(`类别"${categoryName}"删除成功`);
                
            } else {
                throw new Error('删除操作失败');
            }
            
        } catch (error) {
            console.error('删除类别失败:', error);
            NotificationsModule.showNotification('删除失败', error.message || '删除类别时发生错误');
        }
    };

    // 公开API
    return {
        initialize,
        loadTodayTasks
    };
})();