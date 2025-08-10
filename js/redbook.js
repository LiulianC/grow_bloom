/**
 * 红账本模块 - 记录每日美好与宁静的时刻
 */
const RedbookModule = (() => {
    // 存储键名
    const STORAGE_KEYS = {
        ENTRIES: 'bloom_redbook_entries',
        SETTINGS: 'bloom_redbook_settings'
    };

    // 当前编辑的条目ID
    let currentEditingEntryId = null;

    // 初始化模块
    const initialize = () => {
        console.log('初始化红账本模块...');
        
        // 初始化存储
        if (!localStorage.getItem(STORAGE_KEYS.ENTRIES)) {
            localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
                autoArchiveEnabled: true,
                lastArchiveDate: null
            }));
        }
        
        // 绑定事件
        bindEvents();
        
        // 自动归档检查
        checkAutoArchive();
        
        // 加载今日条目
        loadTodayEntries();
    };

    // 绑定事件
    const bindEvents = () => {
        // 添加红账按钮
        const addEntryBtn = document.getElementById('add-redbook-entry-btn');
        if (addEntryBtn) {
            addEntryBtn.addEventListener('click', showAddEntryModal);
        }

        // 历史红账按钮
        const historyBtn = document.getElementById('redbook-history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', showHistoryPage);
        }

        // 搜索按钮（主页面）
        const searchBtn = document.getElementById('redbook-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', showSearchModal);
        }

        // 搜索按钮（历史页面）
        const searchBtnHistory = document.getElementById('redbook-search-btn-history');
        if (searchBtnHistory) {
            searchBtnHistory.addEventListener('click', showSearchModal);
        }

        // 提交新条目表单
        const entryForm = document.getElementById('redbook-entry-form');
        if (entryForm) {
            entryForm.addEventListener('submit', handleEntrySubmit);
        }

        // 搜索表单
        const searchForm = document.getElementById('redbook-search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', handleSearch);
        }

        // 返回主页按钮
        const backToMainBtn = document.getElementById('redbook-back-to-main');
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', showMainPage);
        }

        // 返回历史页按钮
        const backToHistoryBtn = document.getElementById('redbook-back-to-history');
        if (backToHistoryBtn) {
            backToHistoryBtn.addEventListener('click', showMainPage);
        }
    };

    // 生成唯一ID
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    // 获取当前日期字符串
    const getTodayString = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    // 获取所有条目
    const getAllEntries = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES)) || [];
    };

    // 保存所有条目
    const saveAllEntries = (entries) => {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    };

    // 显示添加条目模态框
    const showAddEntryModal = () => {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('redbook-add-entry-modal');
        const textarea = document.getElementById('redbook-entry-content');
        
        if (overlay && modal) {
            // 隐藏其他模态框
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            
            // 显示模态框
            overlay.classList.remove('hidden');
            modal.classList.remove('hidden');
            
            // 清空并聚焦输入框
            if (textarea) {
                textarea.value = '';
                textarea.focus();
            }
        }
    };

    // 处理添加条目
    const handleAddEntry = (e) => {
        e.preventDefault();
        
        const content = document.getElementById('redbook-entry-content').value.trim();
        if (!content) {
            if (typeof NotificationsModule !== 'undefined') {
                NotificationsModule.showNotification('内容不能为空', '请输入一些美好的感受');
            }
            return;
        }

        const newEntry = {
            id: generateId(),
            content: content,
            createdTime: new Date().toISOString(),
            updatedTime: new Date().toISOString(),
            date: getTodayString()
        };

        // 保存条目
        const entries = getAllEntries();
        entries.push(newEntry);
        saveAllEntries(entries);

        // 关闭模态框
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('redbook-add-entry-modal').classList.add('hidden');

        // 重新加载今日条目
        loadTodayEntries();

        // 显示成功消息
        if (typeof NotificationsModule !== 'undefined') {
            NotificationsModule.showNotification('添加成功', '美好时刻已记录');
        }
    };

    // 加载今日条目
    const loadTodayEntries = () => {
        const entries = getAllEntries();
        const today = getTodayString();
        const todayEntries = entries.filter(entry => entry.date === today);
        
        // 按时间倒序排列
        todayEntries.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
        
        const container = document.getElementById('redbook-today-entries');
        if (!container) return;

        if (todayEntries.length === 0) {
            container.innerHTML = `
                <div class="redbook-empty-state">
                    <i class="fas fa-heart"></i>
                    <p>今天还没有记录美好时刻</p>
                    <p>点击上方的"+"按钮开始记录吧</p>
                </div>
            `;
            return;
        }

        container.innerHTML = todayEntries.map(entry => {
            // 截取前两行文本用于预览
            const lines = entry.content.split('\n');
            const preview = lines.length > 2 ? 
                lines.slice(0, 2).join('\n') + '...' : 
                entry.content;

            const time = new Date(entry.createdTime).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="redbook-entry-item" data-entry-id="${entry.id}">
                    <div class="redbook-entry-preview">${preview.replace(/\n/g, '<br>')}</div>
                    <div class="redbook-entry-time">${time}</div>
                </div>
            `;
        }).join('');

        // 绑定点击事件
        container.querySelectorAll('.redbook-entry-item').forEach(item => {
            item.addEventListener('click', () => {
                const entryId = item.dataset.entryId;
                showEntryDetail(entryId);
            });
        });
    };

    // 显示条目详情
    const showEntryDetail = (entryId) => {
        const entries = getAllEntries();
        const entry = entries.find(e => e.id === entryId);
        
        if (!entry) return;

        // 隐藏主页面，显示详情页面
        document.getElementById('redbook-main-page').style.display = 'none';
        document.getElementById('redbook-detail-page').style.display = 'block';
        document.getElementById('redbook-history-page').style.display = 'none';

        // 填充详情内容
        const contentDiv = document.getElementById('redbook-detail-content');
        const timeDiv = document.getElementById('redbook-detail-time');
        
        if (contentDiv) {
            contentDiv.innerHTML = entry.content.replace(/\n/g, '<br>');
        }
        
        if (timeDiv) {
            const createdTime = new Date(entry.createdTime).toLocaleString('zh-CN');
            let timeText = `记录时间：${createdTime}`;
            
            if (entry.updatedTime !== entry.createdTime) {
                const updatedTime = new Date(entry.updatedTime).toLocaleString('zh-CN');
                timeText += `<br>更新时间：${updatedTime}`;
            }
            
            timeDiv.innerHTML = timeText;
        }

        // 绑定编辑和删除按钮
        const editBtn = document.getElementById('redbook-edit-btn');
        const deleteBtn = document.getElementById('redbook-delete-btn');
        
        if (editBtn) {
            editBtn.onclick = () => editEntry(entryId);
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = () => deleteEntry(entryId);
        }
    };

    // 编辑条目
    const editEntry = (entryId) => {
        const entries = getAllEntries();
        const entry = entries.find(e => e.id === entryId);
        
        if (!entry) return;

        currentEditingEntryId = entryId;
        
        // 显示编辑模态框
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('redbook-add-entry-modal');
        const textarea = document.getElementById('redbook-entry-content');
        const submitBtn = document.querySelector('#redbook-entry-form button[type="submit"]');
        
        if (overlay && modal && textarea && submitBtn) {
            // 隐藏其他模态框
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            
            // 显示模态框
            overlay.classList.remove('hidden');
            modal.classList.remove('hidden');
            
            // 填充现有内容
            textarea.value = entry.content;
            textarea.focus();
            
            // 修改按钮文本
            submitBtn.textContent = '更新';
        }
    };

    // 删除条目
    const deleteEntry = (entryId) => {
        if (confirm('确定要删除这条红账记录吗？')) {
            const entries = getAllEntries();
            const updatedEntries = entries.filter(e => e.id !== entryId);
            saveAllEntries(updatedEntries);
            
            // 返回主页面并刷新
            showMainPage();
            loadTodayEntries();
            
            if (typeof NotificationsModule !== 'undefined') {
                NotificationsModule.showNotification('删除成功', '记录已删除');
            }
        }
    };

    // 显示主页面
    const showMainPage = () => {
        document.getElementById('redbook-main-page').style.display = 'block';
        document.getElementById('redbook-detail-page').style.display = 'none';
        document.getElementById('redbook-history-page').style.display = 'none';
        
        // 重置编辑状态
        currentEditingEntryId = null;
        const submitBtn = document.querySelector('#redbook-entry-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '添加';
        }
    };

    // 显示历史页面
    const showHistoryPage = () => {
        document.getElementById('redbook-main-page').style.display = 'none';
        document.getElementById('redbook-detail-page').style.display = 'none';
        document.getElementById('redbook-history-page').style.display = 'block';
        
        loadHistoryEntries();
    };

    // 加载历史条目
    const loadHistoryEntries = (searchResults = null) => {
        const entries = searchResults || getAllEntries();
        const today = getTodayString();
        
        // 过滤出历史条目（非今日）
        const historyEntries = entries.filter(entry => entry.date !== today);
        
        // 按日期分组
        const entriesByDate = {};
        historyEntries.forEach(entry => {
            if (!entriesByDate[entry.date]) {
                entriesByDate[entry.date] = [];
            }
            entriesByDate[entry.date].push(entry);
        });
        
        // 排序日期（最新在前）
        const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a));
        
        const container = document.getElementById('redbook-history-entries');
        if (!container) return;

        if (sortedDates.length === 0) {
            container.innerHTML = `
                <div class="redbook-empty-state">
                    <i class="fas fa-history"></i>
                    <p>${searchResults ? '没有找到匹配的记录' : '还没有历史记录'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedDates.map(date => {
            const dateEntries = entriesByDate[date];
            // 按时间倒序排列每日条目
            dateEntries.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
            
            const dateDisplay = new Date(date + 'T00:00:00').toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            return `
                <div class="redbook-date-group">
                    <h3 class="redbook-date-header">${dateDisplay}</h3>
                    <div class="redbook-date-entries">
                        ${dateEntries.map(entry => {
                            const lines = entry.content.split('\n');
                            const preview = lines.length > 2 ? 
                                lines.slice(0, 2).join('\n') + '...' : 
                                entry.content;

                            const time = new Date(entry.createdTime).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return `
                                <div class="redbook-entry-item" data-entry-id="${entry.id}">
                                    <div class="redbook-entry-preview">${preview.replace(/\n/g, '<br>')}</div>
                                    <div class="redbook-entry-time">${time}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // 绑定点击事件
        container.querySelectorAll('.redbook-entry-item').forEach(item => {
            item.addEventListener('click', () => {
                const entryId = item.dataset.entryId;
                showEntryDetail(entryId);
            });
        });
    };

    // 显示搜索模态框
    const showSearchModal = () => {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('redbook-search-modal');
        
        if (overlay && modal) {
            // 隐藏其他模态框
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            
            // 显示模态框
            overlay.classList.remove('hidden');
            modal.classList.remove('hidden');
            
            // 清空搜索表单
            const form = document.getElementById('redbook-search-form');
            if (form) {
                form.reset();
            }
        }
    };

    // 处理搜索
    const handleSearch = (e) => {
        e.preventDefault();
        
        const keyword = document.getElementById('redbook-search-keyword').value.trim();
        const startDate = document.getElementById('redbook-search-start-date').value;
        const endDate = document.getElementById('redbook-search-end-date').value;
        
        if (!keyword && !startDate && !endDate) {
            if (typeof NotificationsModule !== 'undefined') {
                NotificationsModule.showNotification('请输入搜索条件', '请输入关键字或选择日期范围');
            }
            return;
        }

        const entries = getAllEntries();
        const today = getTodayString();
        
        // 过滤条件
        let filteredEntries = entries.filter(entry => entry.date !== today); // 只搜索历史记录
        
        // 关键字搜索
        if (keyword) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.content.toLowerCase().includes(keyword.toLowerCase())
            );
        }
        
        // 日期范围搜索
        if (startDate) {
            filteredEntries = filteredEntries.filter(entry => entry.date >= startDate);
        }
        
        if (endDate) {
            filteredEntries = filteredEntries.filter(entry => entry.date <= endDate);
        }
        
        // 关闭搜索模态框
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('redbook-search-modal').classList.add('hidden');
        
        // 显示搜索结果
        showHistoryPage();
        loadHistoryEntries(filteredEntries);
        
        // 显示搜索结果提示
        if (typeof NotificationsModule !== 'undefined') {
            NotificationsModule.showNotification('搜索完成', `找到 ${filteredEntries.length} 条记录`);
        }
    };

    // 检查自动归档
    const checkAutoArchive = () => {
        try {
            const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
            
            if (!settings.autoArchiveEnabled) {
                return;
            }
            
            const today = getTodayString();
            
            // 如果今天已经检查过归档，则跳过
            if (settings.lastArchiveDate === today) {
                return;
            }
            
            // 执行归档逻辑（这里主要是标记检查日期）
            settings.lastArchiveDate = today;
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            
            console.log('自动归档检查完成');
        } catch (error) {
            console.error('自动归档检查失败:', error);
        }
    };

    // 修改条目提交处理，支持编辑
    const handleEntrySubmit = (e) => {
        e.preventDefault();
        
        const content = document.getElementById('redbook-entry-content').value.trim();
        if (!content) {
            if (typeof NotificationsModule !== 'undefined') {
                NotificationsModule.showNotification('内容不能为空', '请输入一些美好的感受');
            }
            return;
        }

        const entries = getAllEntries();
        
        if (currentEditingEntryId) {
            // 编辑现有条目
            const entryIndex = entries.findIndex(e => e.id === currentEditingEntryId);
            if (entryIndex !== -1) {
                entries[entryIndex].content = content;
                entries[entryIndex].updatedTime = new Date().toISOString();
                
                saveAllEntries(entries);
                
                // 关闭模态框
                document.getElementById('modal-overlay').classList.add('hidden');
                document.getElementById('redbook-add-entry-modal').classList.add('hidden');
                
                // 显示详情页面
                showEntryDetail(currentEditingEntryId);
                
                if (typeof NotificationsModule !== 'undefined') {
                    NotificationsModule.showNotification('更新成功', '记录已更新');
                }
            }
        } else {
            // 添加新条目
            handleAddEntry(e);
        }
    };

    // 确保事件绑定
    const ensureEventBindings = () => {
        // 重新绑定表单提交事件
        const entryForm = document.getElementById('redbook-entry-form');
        if (entryForm) {
            entryForm.removeEventListener('submit', handleAddEntry);
            entryForm.addEventListener('submit', handleEntrySubmit);
        }
    };

    // 公开的API
    return {
        initialize,
        loadTodayEntries,
        showMainPage,
        showHistoryPage,
        ensureEventBindings
    };
})();