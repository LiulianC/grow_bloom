/**
 * 计时器模块 - 管理学习计时功能
 */
const TimerModule = (() => {
    // 私有状态
    let timerInterval = null;
    let startTime = null;            // ms，真实开始时间（含暂停恢复修正）
    let elapsedTime = 0;             // s，用于界面展示与结算（累计已运行时间，不含暂停）
    let targetTime = 0;              // s，倒计时总时长
    let isRunning = false;
    let isCountdown = false;

    // 幂等与防重
    let eventsBound = false;         // 避免重复绑定事件
    let hasCompletedThisSession = false; // 同一次学习中防止 completeTimer 被重复触发

    // DOM 元素
    const timerDisplay = document.getElementById('timer');
    const startButton = document.getElementById('start-timer');
    const pauseButton = document.getElementById('pause-timer');
    const stopButton = document.getElementById('stop-timer');
    const countdownOptions = document.getElementById('countdown-options');

    // 工具：格式化 HH:MM:SS
    const formatTime = (timeInSeconds) => {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // 刷新显示
    const updateDisplay = () => {
        if (isCountdown) {
            const remainingTime = Math.max(0, targetTime - elapsedTime);
            timerDisplay.textContent = formatTime(remainingTime);

            // 倒计时自然结束
            if (remainingTime === 0 && isRunning) {
                completeTimer(true); // 自然完成
            }
        } else {
            timerDisplay.textContent = formatTime(elapsedTime);
        }
    };

    // 开始
    const startTimer = () => {
        if (isRunning) return;

        // 开始本次学习，解锁完成防抖
        hasCompletedThisSession = false;

        // 以真实时间差为准，支持暂停恢复（暂停后再次开始，会用累计的 elapsedTime 回算开始时刻）
        startTime = Date.now() - (elapsedTime * 1000);

        timerInterval = setInterval(() => {
            // 仅在运行时按真实时间差累加，暂停时不变
            elapsedTime = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
            updateDisplay();
        }, 1000);

        isRunning = true;

        // 按钮状态
        startButton.disabled = true;
        pauseButton.disabled = false;
        stopButton.disabled = false;
    };

    // 暂停
    const pauseTimer = () => {
        if (!isRunning) return;

        // 此刻的 elapsedTime 已由 setInterval 刷新为“实际已运行秒数”
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;

        startButton.disabled = false;
        pauseButton.disabled = true;
    };

    // 停止（弹出确认）
    const stopTimer = () => {
        if (startTime === null && elapsedTime === 0) return;

        const modalOverlay = document.getElementById('modal-overlay');
        const exitModal = document.getElementById('exit-confirm-modal');

        // 根据模式设置提示文案
        const tipP = exitModal ? exitModal.querySelector('.modal-body p') : null;
        if (tipP) {
            if (isCountdown) {
                tipP.textContent = '提前结束学习将按8元/小时计算收入，是否确认退出？';
            } else {
                tipP.textContent = '正计时：小于5分钟不计收入；满5分钟按10元/小时计算。是否结束？';
            }
        }

        if (modalOverlay) {
            modalOverlay.classList.add('show-exit-modal');
            modalOverlay.classList.remove('hidden');
        }
        if (exitModal) exitModal.classList.remove('hidden');
    };

    // 计算“实际生效的学习秒数”
    // - 运行中：以当前时间与 startTime 的差计算
    // - 暂停/未运行：直接使用累计的 elapsedTime
    // - 倒计时：封顶到 targetTime（避免超过总时长）
    const getEffectiveElapsedSeconds = () => {
        const runningSeconds = isRunning && typeof startTime === 'number'
            ? Math.max(0, Math.floor((Date.now() - startTime) / 1000))
            : Math.max(0, elapsedTime);

        if (isCountdown && targetTime > 0) {
            return Math.min(runningSeconds, targetTime);
        }
        return runningSeconds;
    };

    // 完成（结算）
    // isNormalCompletion 仅对倒计时有效；正计时忽略该参数
    const completeTimer = (isNormalCompletion = true) => {
        // 防止一次点击触发多次（重复监听或自然结束+手动结束的竞态）
        if (hasCompletedThisSession) return;
        hasCompletedThisSession = true;

        // 无论是否在运行，立即停止计时
        clearInterval(timerInterval);
        timerInterval = null;

        // 关键修复：使用“实际生效的学习秒数”，不会把暂停时段算进去
        const elapsedSeconds = getEffectiveElapsedSeconds();
        const durationMinutes = Math.floor(elapsedSeconds / 60);

        let hourlyRate = 0;
        let earnings = 0;
        let completedFlag = true;

        if (!isCountdown) {
            // 正计时：<5 分钟不计收入；≥5 分钟按 10 元/小时
            if (durationMinutes >= 5) {
                hourlyRate = 10;
                earnings = (elapsedSeconds / 3600) * hourlyRate;
                completedFlag = true;
            } else {
                hourlyRate = 0;
                earnings = 0;
                completedFlag = false;
            }
        } else {
            // 倒计时：自然结束 10 元/小时；提前结束 8 元/小时
            hourlyRate = isNormalCompletion ? 10 : 8;
            earnings = (elapsedSeconds / 3600) * hourlyRate;
            completedFlag = isNormalCompletion;
        }

        // 学习记录
        const endTs = Date.now();
        const effectiveStart = (typeof startTime === 'number') ? startTime : (endTs - elapsedSeconds * 1000);
        const studySession = {
            id: Date.now().toString(),
            startTime: new Date(effectiveStart).toISOString(),
            endTime: new Date(endTs).toISOString(),
            duration: durationMinutes, // 分钟
            completed: completedFlag,
            earnings: parseFloat(earnings.toFixed(2))
        };

        // 写入存储
        const todayData = StorageService.getTodayData();
        todayData.studySessions.push(studySession);
        todayData.totalEarnings.selfImprovement += studySession.earnings;
        todayData.totalEarnings.total += studySession.earnings;
        StorageService.updateTodayData(todayData);

        // 通知
        if (!isCountdown && durationMinutes < 5) {
            NotificationsModule.showNotification('学习结束', `本次学习 ${durationMinutes} 分钟，未满 5 分钟，不计收入。`);
        } else {
            NotificationsModule.showNotification('学习完成', `你完成了 ${durationMinutes} 分钟的学习，获得 ${studySession.earnings} 元收入！`);
        }

        // 重置并刷新
        resetTimer();
        if (typeof updateDailyOverview === 'function') {
            updateDailyOverview();
        }
    };

    // 重置
    const resetTimer = () => {
        clearInterval(timerInterval);
        timerInterval = null;
        startTime = null;
        elapsedTime = 0;
        isRunning = false;

        // 不重置 hasCompletedThisSession，保持本次已完成状态；
        // 在下一次 startTimer 时再解锁
        updateDisplay();

        startButton.disabled = false;
        pauseButton.disabled = true;
        stopButton.disabled = true;

        // 关闭退出模态
        const modalOverlay = document.getElementById('modal-overlay');
        const exitModal = document.getElementById('exit-confirm-modal');
        if (modalOverlay) {
            modalOverlay.classList.remove('show-exit-modal');
            modalOverlay.classList.add('hidden');
        }
        if (exitModal) exitModal.classList.add('hidden');
    };

    // 模式切换
    const setCountdownMode = (enabled) => {
        isCountdown = enabled;
        if (countdownOptions) {
            countdownOptions.style.display = enabled ? 'flex' : 'none';
        }
        resetTimer();

        if (enabled && countdownOptions) {
            const firstOption = countdownOptions.querySelector('button');
            if (firstOption) {
                setCountdownTime(parseInt(firstOption.dataset.time));
                firstOption.classList.add('active');
            }
        } else {
            timerDisplay.textContent = '00:00:00';
        }
    };

    // 设置倒计时预设
    const setCountdownTime = (minutes) => {
        targetTime = minutes * 60;
        elapsedTime = 0;
        updateDisplay();
    };

    // 初始化（幂等）
    const initialize = () => {
        // 首次进入时初始化显示
        if (!eventsBound) {
            timerDisplay.textContent = '00:00:00';
        }

        // 已绑定则直接返回，避免重复监听导致 completeTimer 被多次触发
        if (eventsBound) return;
        eventsBound = true;

        // 模式切换
        document.querySelectorAll('input[name="timer-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => setCountdownMode(e.target.value === 'countdown'));
        });

        // 倒计时预设
        if (countdownOptions) {
            countdownOptions.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    countdownOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    setCountdownTime(parseInt(btn.dataset.time));
                });
            });
        }

        // 主按钮
        startButton.addEventListener('click', () => {
            // 允许在“结束弹窗”打开时点击开始，先关闭弹窗再启动，避免状态错乱
            const modalOverlay = document.getElementById('modal-overlay');
            const exitModal = document.getElementById('exit-confirm-modal');
            if (modalOverlay?.classList.contains('show-exit-modal')) {
                modalOverlay.classList.remove('show-exit-modal');
                modalOverlay.classList.add('hidden');
                exitModal?.classList.add('hidden');
            }
            startTimer();
        });
        pauseButton.addEventListener('click', pauseTimer);
        stopButton.addEventListener('click', stopTimer);

        // 退出确认/取消（只绑定一次）
        const confirmBtn = document.getElementById('confirm-exit');
        const cancelBtn = document.getElementById('cancel-exit');
        const modalOverlay = document.getElementById('modal-overlay');
        const exitModal = document.getElementById('exit-confirm-modal');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                // 关闭弹窗
                if (modalOverlay) {
                    modalOverlay.classList.add('hidden');
                    modalOverlay.classList.remove('show-exit-modal');
                }
                if (exitModal) exitModal.classList.add('hidden');
                // 结束（正计时忽略参数；倒计时视为“非自然完成”）
                completeTimer(false);
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (modalOverlay) {
                    modalOverlay.classList.add('hidden');
                    modalOverlay.classList.remove('show-exit-modal');
                }
                if (exitModal) exitModal.classList.add('hidden');
            });
        }
    };

    // 对外 API
    return {
        initialize,
        startTimer,
        pauseTimer,
        stopTimer,
        resetTimer
    };
})();