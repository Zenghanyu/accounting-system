// 全局变量
let currentUser = null;
let transactions = [];
let budgets = [];
let loans = [];
let recurringBills = [];
let savingsGoals = [];
let accounts = [];
let savingsPlans = []; // 储蓄计划列表
let lentMoney = []; // 借出记录
let borrowedMoney = []; // 借入记录
let trendChart = null;
let categoryChart = null;
let deepseekApiKey = '';
let chatHistory = [];
let challenges = []; // 挑战任务列表
let achievements = []; // 成就列表
let categoryLearningData = {}; // 分类学习数据 { "关键词": { category: "分类", count: 次数, type: "类型" } }

// 默认API密钥 - 供用户免费使用AI功能
const DEFAULT_API_KEY = 'sk-7d3699027b2749c8b50e587afdc11511';

// AI功能防抖定时器
let aiSuggestionTimeout = null;

// 汇率数据 (相对于人民币CNY的汇率)
const exchangeRates = {
    CNY: 1,
    USD: 0.138,   // 1 CNY = 0.138 USD
    EUR: 0.127,   // 1 CNY = 0.127 EUR
    GBP: 0.109,   // 1 CNY = 0.109 GBP
    JPY: 20.5,    // 1 CNY = 20.5 JPY
    HKD: 1.08,    // 1 CNY = 1.08 HKD
    KRW: 184,     // 1 CNY = 184 KRW
    SGD: 0.185    // 1 CNY = 0.185 SGD
};

// 币种符号
const currencySymbols = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    HKD: 'HK$',
    KRW: '₩',
    SGD: 'S$'
};

// 分类配置
const categories = {
    expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他'],
    income: ['工资', '奖金', '投资', '兼职', '礼金', '其他']
};

// ==================== 认证功能 ====================

function initAuth() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');

    // 登录表单
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[username] && users[username].password === password) {
            currentUser = username;
            localStorage.setItem('currentUser', username);
            loadUserData();
            showApp();
        } else {
            alert('用户名或密码错误！');
        }
    });

    // 注册表单
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('两次密码不一致！');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[username]) {
            alert('用户名已存在！');
            return;
        }

        users[username] = { password: password };
        localStorage.setItem('users', JSON.stringify(users));

        // 初始化用户数据
        const userData = {
            transactions: [],
            budgets: [],
            loans: [],
            recurringBills: [],
            savingsGoals: [],
            accounts: [],
            apiKey: ''
        };
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));

        alert('注册成功！请登录');
        showAuthTab('login');
    });

    // 检查是否已登录
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        loadUserData();
        showApp();
    }
}

function showAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab-btn');

    authTabs.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTabs[1].classList.add('active');
    }
}

function showApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('currentUsername').textContent = currentUser;
    initApp();
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('appPage').style.display = 'none';
    location.reload();
}

// ==================== 数据管理 ====================

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    transactions = userData.transactions || [];
    budgets = userData.budgets || [];
    loans = userData.loans || [];
    recurringBills = userData.recurringBills || [];
    savingsGoals = userData.savingsGoals || [];
    accounts = userData.accounts || [];
    savingsPlans = userData.savingsPlans || [];
    lentMoney = userData.lentMoney || [];
    borrowedMoney = userData.borrowedMoney || [];
    categoryLearningData = userData.categoryLearningData || {};
    challenges = userData.challenges || [];
    achievements = userData.achievements || [];
    deepseekApiKey = userData.apiKey || '';

    if (deepseekApiKey) {
        document.getElementById('apiKeyInput').value = deepseekApiKey;
    }
}

function saveUserData() {
    const userData = {
        transactions,
        budgets,
        loans,
        recurringBills,
        savingsGoals,
        accounts,
        savingsPlans,
        lentMoney,
        borrowedMoney,
        categoryLearningData,
        challenges,
        achievements,
        apiKey: deepseekApiKey
    };
    localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));
}

// ==================== 主应用初始化 ====================

function initApp() {
    initTabs();
    initTransactions();
    initBudget();
    initLoan();
    initRecurring();
    initSavings();
    initAccounts();
    updateDashboard();

    // 初始化商家分析
    analyzeMerchants();

    // 初始化日历
    renderCalendar();

    // 初始化储蓄计划
    initSavingsPlans();

    // 初始化借贷管理
    initLendBorrow();

    // 初始化语音财务顾问（必须在登录后初始化）
    initVoiceRecognition();
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'overview') {
                updateDashboard();
            }
        });
    });

    // 初始化子标签
    initSubTabs();
}

function initSubTabs() {
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const subtabName = btn.getAttribute('data-subtab');
            const parentContainer = btn.closest('.tab-content');

            // 获取父容器内的所有子标签按钮和内容
            const siblingBtns = parentContainer.querySelectorAll('.sub-tab-btn');
            const subContents = parentContainer.querySelectorAll('.sub-tab-content');

            // 移除所有active类
            siblingBtns.forEach(b => b.classList.remove('active'));
            subContents.forEach(c => c.classList.remove('active'));

            // 添加active类
            btn.classList.add('active');
            const targetContent = parentContainer.querySelector(`#${subtabName}-sub`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // 当切换到商家分析时，更新商家数据
            if (subtabName === 'merchant') {
                analyzeMerchants();
            }
        });
    });
}

// ==================== 交易管理 ====================

function initTransactions() {
    const form = document.getElementById('transactionForm');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');

    // 设置默认日期为今天
    dateInput.valueAsDate = new Date();

    // 更新分类选项
    typeSelect.addEventListener('change', updateCategories);
    updateCategories();

    // 表单提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const transaction = {
            id: Date.now(),
            type: typeSelect.value,
            category: categorySelect.value,
            amount: parseFloat(document.getElementById('amount').value),
            currency: document.getElementById('currency').value || 'CNY',
            date: dateInput.value,
            note: document.getElementById('note').value
        };

        transactions.push(transaction);

        // 记录用户的分类选择，用于机器学习
        learnFromUserChoice(transaction.note, transaction.category, transaction.type);

        saveUserData();

        // 检测异常交易
        detectAnomalousTransactions();

        // 如果是异常交易，提醒用户
        setTimeout(() => {
            showAnomalyAlert(transaction);
        }, 100);

        form.reset();
        dateInput.valueAsDate = new Date();
        updateCategories();
        displayTransactions();
        updateDashboard();

        // 更新商家分析和日历
        analyzeMerchants();
        renderCalendar();

        // 隐藏AI建议
        document.getElementById('aiSuggestion').style.display = 'none';
        lastNoteValue = '';

        showToast('✅ 交易添加成功！');
    });

    displayTransactions();
}

function updateCategories() {
    const type = document.getElementById('type').value;
    const categorySelect = document.getElementById('category');
    const budgetCategorySelect = document.getElementById('budgetCategory');

    categorySelect.innerHTML = '';
    if (budgetCategorySelect) budgetCategorySelect.innerHTML = '';

    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);

        if (type === 'expense' && budgetCategorySelect) {
            const budgetOption = option.cloneNode(true);
            budgetCategorySelect.appendChild(budgetOption);
        }
    });
}

function displayTransactions() {
    const list = document.getElementById('transactionsList');
    const recentList = document.getElementById('recentList');

    if (transactions.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无交易记录</p></div>';
        recentList.innerHTML = '<div class="empty-state"><p>暂无交易记录</p></div>';
        return;
    }

    // 按日期排序
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    // 显示所有交易
    list.innerHTML = sortedTransactions.map(t => {
        let badges = '';
        if (t.isAnomalous) {
            badges += '<span class="badge badge-warning" title="' + (t.anomalyReason || '异常交易') + '">⚠️ 异常</span>';
        }
        if (t.isLarge) {
            badges += '<span class="badge badge-large">💰 大额</span>';
        }

        const currency = t.currency || 'CNY';
        const currencyBadge = currency !== 'CNY' ? `<span class="currency-badge ${currency}">${currency}</span>` : '';

        return `
        <div class="transaction-item ${t.isAnomalous ? 'anomalous' : ''}">
            <div class="transaction-info">
                <div class="category">
                    ${t.category}
                    ${badges}
                    ${currencyBadge}
                </div>
                ${t.note ? `<div class="note">${t.note}</div>` : ''}
                <div class="date">${t.date}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}
            </div>
            <div class="transaction-actions">
                <button class="btn-delete" onclick="deleteTransaction(${t.id})">删除</button>
            </div>
        </div>
    `;
    }).join('');

    // 显示最近10条
    recentList.innerHTML = sortedTransactions.slice(0, 10).map(t => {
        const currency = t.currency || 'CNY';
        const currencyBadge = currency !== 'CNY' ? `<span class="currency-badge ${currency}">${currency}</span>` : '';

        return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="category">${t.category}${currencyBadge}</div>
                ${t.note ? `<div class="note">${t.note}</div>` : ''}
                <div class="date">${t.date}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}
            </div>
        </div>
    `;
    }).join('');
}

function deleteTransaction(id) {
    if (confirm('确定要删除这条交易记录吗？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveUserData();
        displayTransactions();
        updateDashboard();
    }
}

// ==================== 数据导出 ====================

function exportData() {
    const data = {
        导出时间: new Date().toLocaleString(),
        用户: currentUser,
        交易记录: transactions,
        预算: budgets,
        贷款: loans,
        定期账单: recurringBills,
        储蓄目标: savingsGoals,
        账户: accounts
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `账务数据_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== 仪表板更新 ====================

function updateDashboard() {
    updateStats();
    updateCharts();

    // 生成AI智能洞察
    generateAIInsights();

    // 检测异常交易
    detectAnomalousTransactions();

    // 计算财务健康评分
    calculateHealthScore();

    // 初始化挑战任务
    // initChallenges();

    // 更新挑战进度
    // updateChallengeProgress();
}

function updateStats() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 计算上个月的年月
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // 本月数据
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
            const amountInCNY = convertToCNY(t.amount, t.currency || 'CNY');
            return sum + amountInCNY;
        }, 0);

    const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
            const amountInCNY = convertToCNY(t.amount, t.currency || 'CNY');
            return sum + amountInCNY;
        }, 0);

    const balance = income - expense;
    const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 上月数据
    const lastMonthTransactions = transactions.filter(t => t.date.startsWith(lastMonth));
    const lastIncome = lastMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
            const amountInCNY = convertToCNY(t.amount, t.currency || 'CNY');
            return sum + amountInCNY;
        }, 0);

    const lastExpense = lastMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
            const amountInCNY = convertToCNY(t.amount, t.currency || 'CNY');
            return sum + amountInCNY;
        }, 0);

    const lastBalance = lastIncome - lastExpense;

    // 更新显示
    document.getElementById('totalIncome').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `¥${expense.toFixed(2)}`;
    document.getElementById('balance').textContent = `¥${balance.toFixed(2)}`;
    document.getElementById('totalAssets').textContent = `¥${totalAssets.toFixed(2)}`;

    // 更新对比信息
    updateComparison('incomeComparison', income, lastIncome, '上月');
    updateComparison('expenseComparison', expense, lastExpense, '上月', true); // expense是越少越好
    updateComparison('balanceComparison', balance, lastBalance, '上月');

    // 总资产对比（与上月同一天的资产对比，这里简化为显示上月结余）
    const assetsChange = balance - lastBalance;
    const assetsComparisonEl = document.getElementById('assetsComparison');
    if (assetsComparisonEl) {
        assetsComparisonEl.textContent = `上月结余: ¥${lastBalance.toFixed(2)}`;
        assetsComparisonEl.style.color = '#666';
        assetsComparisonEl.style.fontSize = '13px';
    }
}

// 辅助函数：更新对比信息
function updateComparison(elementId, current, previous, label, isReverse = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (previous === 0) {
        element.textContent = `${label}: ¥${previous.toFixed(2)}`;
        element.style.color = '#666';
    } else {
        const change = current - previous;
        const changePercent = (change / previous * 100).toFixed(1);
        const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '—';

        // 判断颜色：对于支出，减少是好的（绿色），增加是不好的（红色）
        let color = '#666';
        if (change !== 0) {
            if (isReverse) {
                // 支出：减少是好的
                color = change < 0 ? '#10b981' : '#ef4444';
            } else {
                // 收入/结余：增加是好的
                color = change > 0 ? '#10b981' : '#ef4444';
            }
        }

        element.textContent = `${label}: ¥${previous.toFixed(2)} ${arrow} ${Math.abs(parseFloat(changePercent))}%`;
        element.style.color = color;
    }

    element.style.fontSize = '13px';
    element.style.marginTop = '8px';
}

function updateCharts() {
    updateTrendChart();
    updateCategoryChart();
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    // 获取最近6个月
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: `${date.getMonth() + 1}月`
        });
    }

    const incomeData = months.map(m => {
        return transactions
            .filter(t => t.type === 'income' && t.date.startsWith(m.key))
            .reduce((sum, t) => sum + t.amount, 0);
    });

    const expenseData = months.map(m => {
        return transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(m.key))
            .reduce((sum, t) => sum + t.amount, 0);
    });

    if (trendChart) {
        trendChart.destroy();
    }

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.label),
            datasets: [
                {
                    label: '收入',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: '支出',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // 使用选择的月份而不是当前月份
    const selectedMonth = `${categoryChartYear}-${String(categoryChartMonth + 1).padStart(2, '0')}`;

    // 更新月份标签
    const monthLabel = document.getElementById('categoryMonthLabel');
    if (monthLabel) {
        monthLabel.textContent = `${categoryChartYear}年${categoryChartMonth + 1}月`;
    }

    const expenseTransactions = transactions.filter(t =>
        t.type === 'expense' && t.date.startsWith(selectedMonth)
    );

    const categoryData = {};
    expenseTransactions.forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (labels.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                    '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// ==================== 预算管理 ====================

function initBudget() {
    const form = document.getElementById('budgetForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const category = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);

        const existingIndex = budgets.findIndex(b => b.category === category);
        if (existingIndex >= 0) {
            budgets[existingIndex].amount = amount;
        } else {
            budgets.push({ category, amount });
        }

        saveUserData();
        form.reset();
        displayBudgets();

        alert('预算设置成功！');
    });

    displayBudgets();
}

function displayBudgets() {
    const list = document.getElementById('budgetList');

    if (budgets.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无预算设置</p></div>';
        return;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    list.innerHTML = budgets.map(budget => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / budget.amount * 100).toFixed(1);
        const isOver = spent > budget.amount;

        return `
            <div class="budget-item">
                <div class="budget-header">
                    <span>${budget.category}</span>
                    <span>¥${spent.toFixed(2)} / ¥${budget.amount.toFixed(2)}</span>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-bar ${isOver ? 'over-budget' : ''}"
                         style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="budget-info">
                    <span>${percentage}% 已使用</span>
                    <span>${isOver ? '⚠️ 超出预算' : `剩余 ¥${(budget.amount - spent).toFixed(2)}`}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== 贷款管理 ====================

function initLoan() {
    const form = document.getElementById('loanForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const loan = {
            id: Date.now(),
            name: document.getElementById('loanName').value,
            amount: parseFloat(document.getElementById('loanAmount').value),
            rate: parseFloat(document.getElementById('loanRate').value),
            months: parseInt(document.getElementById('loanMonths').value),
            startDate: document.getElementById('loanStartDate').value
        };

        // 计算月供（等额本息）
        const monthlyRate = loan.rate / 100 / 12;
        const monthlyPayment = loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.months) /
                              (Math.pow(1 + monthlyRate, loan.months) - 1);
        loan.monthlyPayment = monthlyPayment;

        loans.push(loan);
        saveUserData();
        form.reset();
        displayLoans();

        alert('贷款添加成功！');
    });

    displayLoans();
}

function displayLoans() {
    const list = document.getElementById('loanList');

    if (loans.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无贷款记录</p></div>';
        return;
    }

    list.innerHTML = loans.map(loan => `
        <div class="loan-item">
            <h4>${loan.name}</h4>
            <div class="loan-details">
                <div>贷款金额: ¥${loan.amount.toFixed(2)}</div>
                <div>年利率: ${loan.rate}%</div>
                <div>期数: ${loan.months}个月</div>
                <div>月供: ¥${loan.monthlyPayment.toFixed(2)}</div>
                <div>开始日期: ${loan.startDate}</div>
                <div>总利息: ¥${(loan.monthlyPayment * loan.months - loan.amount).toFixed(2)}</div>
            </div>
            <button class="btn-delete" onclick="deleteLoan(${loan.id})" style="margin-top: 10px;">删除</button>
        </div>
    `).join('');
}

function deleteLoan(id) {
    if (confirm('确定要删除这条贷款记录吗？')) {
        loans = loans.filter(l => l.id !== id);
        saveUserData();
        displayLoans();
    }
}

// ==================== 定期账单 ====================

function initRecurring() {
    const form = document.getElementById('recurringForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const bill = {
            id: Date.now(),
            name: document.getElementById('recurringName').value,
            amount: parseFloat(document.getElementById('recurringAmount').value),
            frequency: document.getElementById('recurringFrequency').value,
            nextDate: document.getElementById('recurringNextDate').value
        };

        recurringBills.push(bill);
        saveUserData();
        form.reset();
        displayRecurring();

        alert('定期账单添加成功！');
    });

    displayRecurring();
}

function displayRecurring() {
    const list = document.getElementById('recurringList');

    if (recurringBills.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无定期账单</p></div>';
        return;
    }

    const frequencyMap = {
        monthly: '每月',
        quarterly: '每季度',
        yearly: '每年'
    };

    list.innerHTML = recurringBills.map(bill => `
        <div class="budget-item">
            <div class="budget-header">
                <span>${bill.name}</span>
                <span>¥${bill.amount.toFixed(2)}</span>
            </div>
            <div class="budget-info">
                <span>${frequencyMap[bill.frequency]}</span>
                <span>下次扣款: ${bill.nextDate}</span>
            </div>
            <button class="btn-delete" onclick="deleteRecurring(${bill.id})" style="margin-top: 10px;">删除</button>
        </div>
    `).join('');
}

function deleteRecurring(id) {
    if (confirm('确定要删除这条定期账单吗？')) {
        recurringBills = recurringBills.filter(b => b.id !== id);
        saveUserData();
        displayRecurring();
    }
}

// ==================== 储蓄目标 ====================

function initSavings() {
    const form = document.getElementById('savingsForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const goal = {
            id: Date.now(),
            name: document.getElementById('savingsName').value,
            target: parseFloat(document.getElementById('savingsTarget').value),
            current: parseFloat(document.getElementById('savingsCurrent').value),
            deadline: document.getElementById('savingsDeadline').value
        };

        savingsGoals.push(goal);
        saveUserData();
        form.reset();
        displaySavings();

        alert('储蓄目标添加成功！');
    });

    displaySavings();
}

function displaySavings() {
    const list = document.getElementById('savingsList');

    if (savingsGoals.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无储蓄目标</p></div>';
        return;
    }

    list.innerHTML = savingsGoals.map(goal => {
        const percentage = (goal.current / goal.target * 100).toFixed(1);

        return `
            <div class="savings-item">
                <h4>${goal.name}</h4>
                <div class="budget-header">
                    <span>¥${goal.current.toFixed(2)} / ¥${goal.target.toFixed(2)}</span>
                    <span>目标: ${goal.deadline}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="budget-info">
                    <span>${percentage}% 完成</span>
                    <span>还需 ¥${(goal.target - goal.current).toFixed(2)}</span>
                </div>
                <button class="btn-delete" onclick="deleteSavings(${goal.id})" style="margin-top: 10px;">删除</button>
            </div>
        `;
    }).join('');
}

function deleteSavings(id) {
    if (confirm('确定要删除这个储蓄目标吗？')) {
        savingsGoals = savingsGoals.filter(g => g.id !== id);
        saveUserData();
        displaySavings();
    }
}

// ==================== 账户管理 ====================

function initAccounts() {
    const form = document.getElementById('accountForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const account = {
            id: Date.now(),
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            balance: parseFloat(document.getElementById('accountBalance').value)
        };

        accounts.push(account);
        saveUserData();
        form.reset();
        displayAccounts();
        updateDashboard();

        alert('账户添加成功！');
    });

    displayAccounts();
}

function displayAccounts() {
    const list = document.getElementById('accountsList');

    if (accounts.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无账户</p></div>';
        return;
    }

    list.innerHTML = accounts.map(account => `
        <div class="account-item">
            <div class="account-info">
                <h4>${account.name}</h4>
                <p>${account.type}</p>
            </div>
            <div class="account-balance">¥${account.balance.toFixed(2)}</div>
            <button class="btn-delete" onclick="deleteAccount(${account.id})">删除</button>
        </div>
    `).join('');
}

function deleteAccount(id) {
    if (confirm('确定要删除这个账户吗？')) {
        accounts = accounts.filter(a => a.id !== id);
        saveUserData();
        displayAccounts();
        updateDashboard();
    }
}

// ==================== AI 功能 ====================

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        alert('请输入API密钥！');
        return;
    }

    deepseekApiKey = apiKey;
    saveUserData();
    alert('API密钥保存成功！');
}

async function callDeepSeekAPI(prompt, systemPrompt = '你是小记，哈记米系统的AI理财顾问。你是一个专业且友好的个人财务分析助手，擅长分析用户的收支情况、消费习惯，并提供实用的理财建议。请用简洁、专业且易懂的语言回答，并在适当时候体现你是"小记"这个角色。') {
    // 使用用户密钥或默认密钥
    const apiKey = deepseekApiKey || DEFAULT_API_KEY;

    if (!apiKey) {
        throw new Error('API密钥未配置');
    }

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            let errorMessage = '请求失败';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch (e) {
                // 无法解析错误响应
            }

            if (response.status === 401) {
                errorMessage = 'API密钥无效或已过期';
            } else if (response.status === 429) {
                errorMessage = 'API调用次数超限，请稍后再试';
            } else if (response.status >= 500) {
                errorMessage = 'AI服务暂时不可用';
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API返回数据格式错误');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('API调用错误:', error);

        // 网络错误处理
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('网络连接失败，请检查网络设置');
        }

        throw error;
    }
}

function generateFinancialSummary() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const categoryExpense = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        categoryExpense[t.category] = (categoryExpense[t.category] || 0) + t.amount;
    });

    return {
        currentMonth: { income, expense, balance: income - expense },
        categoryExpense,
        totalAssets: accounts.reduce((sum, a) => sum + a.balance, 0),
        budgets: budgets.map(b => {
            const spent = monthTransactions
                .filter(t => t.type === 'expense' && t.category === b.category)
                .reduce((sum, t) => sum + t.amount, 0);
            return { category: b.category, budget: b.amount, spent };
        })
    };
}

async function analyzeFinance() {
    showLoading('正在分析您的财务状况...');

    try {
        const summary = generateFinancialSummary();

        const prompt = `请分析以下财务数据并提供建议：

【本月概况】
收入: ¥${summary.currentMonth.income.toFixed(2)}
支出: ¥${summary.currentMonth.expense.toFixed(2)}
结余: ¥${summary.currentMonth.balance.toFixed(2)}

【支出分类】
${Object.entries(summary.categoryExpense).map(([cat, amount]) =>
    `${cat}: ¥${amount.toFixed(2)}`
).join('\n')}

【总资产】¥${summary.totalAssets.toFixed(2)}

【预算执行情况】
${summary.budgets.map(b =>
    `${b.category}: 预算¥${b.budget.toFixed(2)}, 已花¥${b.spent.toFixed(2)} (${(b.spent/b.budget*100).toFixed(1)}%)`
).join('\n')}

请提供：
1. 财务健康度评估
2. 主要问题和风险
3. 具体改进建议`;

        const result = await callDeepSeekAPI(prompt);
        displayAIResult(result);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function getSpendingHabits() {
    showLoading('正在分析您的消费习惯...');

    try {
        const summary = generateFinancialSummary();

        const prompt = `基于以下消费数据，分析用户的消费习惯：

【月度支出分类】
${Object.entries(summary.categoryExpense).map(([cat, amount]) =>
    `${cat}: ¥${amount.toFixed(2)} (占比${(amount/summary.currentMonth.expense*100).toFixed(1)}%)`
).join('\n')}

【总支出】¥${summary.currentMonth.expense.toFixed(2)}

请分析：
1. 主要消费倾向和特点
2. 消费结构是否合理
3. 潜在的过度消费领域
4. 优化建议`;

        const result = await callDeepSeekAPI(prompt);
        displayAIResult(result);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function getSavingTips() {
    showLoading('正在生成节省建议...');

    try {
        const summary = generateFinancialSummary();

        const prompt = `根据以下财务数据，提供个性化的省钱建议：

【月度收支】
收入: ¥${summary.currentMonth.income.toFixed(2)}
支出: ¥${summary.currentMonth.expense.toFixed(2)}
储蓄率: ${(summary.currentMonth.balance/summary.currentMonth.income*100).toFixed(1)}%

【主要支出】
${Object.entries(summary.categoryExpense)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amount]) => `${cat}: ¥${amount.toFixed(2)}`)
    .join('\n')}

请提供：
1. 可以节省的具体领域
2. 实用的省钱技巧（至少5条）
3. 如何提高储蓄率
4. 长期理财建议`;

        const result = await callDeepSeekAPI(prompt);
        displayAIResult(result);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function getForecast() {
    showLoading('正在预测财务趋势...');

    try {
        const summary = generateFinancialSummary();

        // 计算过去3个月的平均值
        const months = [];
        const now = new Date();
        for (let i = 2; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push(key);
        }

        const avgIncome = months.reduce((sum, m) => {
            return sum + transactions.filter(t => t.type === 'income' && t.date.startsWith(m))
                .reduce((s, t) => s + t.amount, 0);
        }, 0) / 3;

        const avgExpense = months.reduce((sum, m) => {
            return sum + transactions.filter(t => t.type === 'expense' && t.date.startsWith(m))
                .reduce((s, t) => s + t.amount, 0);
        }, 0) / 3;

        const prompt = `基于以下财务数据进行趋势预测：

【当月数据】
收入: ¥${summary.currentMonth.income.toFixed(2)}
支出: ¥${summary.currentMonth.expense.toFixed(2)}

【近3个月平均】
平均收入: ¥${avgIncome.toFixed(2)}
平均支出: ¥${avgExpense.toFixed(2)}

【当前总资产】¥${summary.totalAssets.toFixed(2)}

请预测：
1. 未来3个月的财务趋势
2. 如果保持当前消费习惯，6个月后的资产状况
3. 潜在的财务风险
4. 应对建议`;

        const result = await callDeepSeekAPI(prompt);
        displayAIResult(result);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // 显示用户消息
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML += `
        <div class="chat-message user">
            ${message}
        </div>
    `;

    input.value = '';
    showLoading('AI思考中...');

    try {
        const summary = generateFinancialSummary();
        const context = `当前用户的财务概况：
收入¥${summary.currentMonth.income.toFixed(2)}，支出¥${summary.currentMonth.expense.toFixed(2)}，
总资产¥${summary.totalAssets.toFixed(2)}。

用户问题：${message}`;

        const result = await callDeepSeekAPI(context);

        messagesDiv.innerHTML += `
            <div class="chat-message ai">
                ${result.replace(/\n/g, '<br>')}
            </div>
        `;

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

function displayAIResult(content) {
    const resultDiv = document.getElementById('aiResult');
    const resultContent = document.getElementById('aiResultContent');

    // 格式化内容
    let formatted = content
        .replace(/【(.+?)】/g, '<h4>$1</h4>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    resultContent.innerHTML = `<p>${formatted}</p>`;
    resultDiv.style.display = 'block';

    // 滚动到结果
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    text.textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// ==================== 语音记账 ====================

let isRecording = false;
let recognition = null;

function initSpeechRecognition() {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        return null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
        isRecording = true;
        const btn = document.getElementById('voiceAccountingBtn');
        const btnText = document.getElementById('voiceBtnText');
        if (btn) btn.classList.add('recording');
        if (btnText) btnText.textContent = '🎤 正在录音...（说完后停顿）';
    };

    recognition.onend = function() {
        isRecording = false;
        const btn = document.getElementById('voiceAccountingBtn');
        const btnText = document.getElementById('voiceBtnText');
        if (btn) btn.classList.remove('recording');
        if (btnText) btnText.textContent = '点击开始语音记账';
    };

    recognition.onerror = function(event) {
        console.error('语音识别错误:', event.error);
        isRecording = false;
        const btn = document.getElementById('voiceAccountingBtn');
        const btnText = document.getElementById('voiceBtnText');
        if (btn) btn.classList.remove('recording');
        if (btnText) btnText.textContent = '点击开始语音记账';

        if (event.error === 'no-speech') {
            alert('没有检测到语音，请重试');
        } else if (event.error === 'not-allowed') {
            alert('请允许使用麦克风权限');
        } else {
            alert('语音识别失败：' + event.error);
        }
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('识别到的语音:', transcript);

        // 显示识别结果
        const resultDiv = document.getElementById('voiceResult');
        resultDiv.innerHTML = `<p>识别到：<strong>${transcript}</strong></p>`;
        resultDiv.style.display = 'block';

        // 使用AI解析语音内容
        parseVoiceToTransaction(transcript);
    };

    return recognition;
}

function startVoiceAccounting() {
    if (!recognition) {
        recognition = initSpeechRecognition();
    }

    if (!recognition) {
        alert('您的浏览器不支持语音识别功能，请使用Chrome、Edge等现代浏览器');
        return;
    }

    if (isRecording) {
        recognition.stop();
        return;
    }

    try {
        recognition.start();
    } catch (error) {
        console.error('启动语音识别失败:', error);
        // 如果启动失败，重新初始化
        recognition = initSpeechRecognition();
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                alert('语音识别启动失败，请刷新页面后重试');
            }
        }
    }
}

async function parseVoiceToTransaction(text) {
    // 使用用户密钥或默认密钥
    const apiKey = deepseekApiKey || DEFAULT_API_KEY;

    showLoading('小记正在解析语音内容...');

    try {
        const today = new Date().toISOString().split('T')[0];
        const prompt = `请解析以下语音记账内容，提取交易信息：

"${text}"

今天的日期是：${today}

请以JSON格式返回，格式如下：
{
  "type": "income或expense",
  "category": "分类",
  "amount": 金额数字,
  "date": "YYYY-MM-DD格式的日期",
  "note": "备注"
}

可选的支出分类：餐饮、交通、购物、娱乐、医疗、教育、住房、其他
可选的收入分类：工资、奖金、投资、兼职、礼金、其他

注意：
1. 如果无法确定是收入还是支出，默认为支出
2. 金额必须是数字
3. 尽量准确匹配分类
4. 备注可以包含详细信息
5. 日期识别规则：
   - 如果用户说"今天"，使用今天日期：${today}
   - 如果说"昨天"，使用昨天日期
   - 如果说"前天"，使用前天日期
   - 如果说具体日期如"12月1号"、"上周五"等，计算对应日期
   - 如果没有提到日期，默认使用今天：${today}
   - 返回格式必须是YYYY-MM-DD`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个智能记账助手，擅长理解用户的记账需求并提取结构化信息。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || '解析失败');
        }

        const data = await response.json();
        const resultText = data.choices[0].message.content;

        // 解析JSON结果
        let transactionData;
        try {
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                transactionData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('无法解析AI返回的结果');
            }
        } catch (e) {
            console.error('JSON解析错误:', e);
            alert('小记解析失败，请重试或手动输入');
            return;
        }

        // 显示解析结果
        displayVoiceResult(transactionData);

        // 填充表单
        fillFormFromVoice(transactionData);

    } catch (error) {
        console.error('语音解析错误:', error);
        alert('小记解析失败：' + error.message);
    } finally {
        hideLoading();
    }
}

function displayVoiceResult(data) {
    const resultDiv = document.getElementById('voiceResult');

    const typeText = data.type === 'income' ? '收入' : '支出';

    let html = `
        <div class="voice-parsed-result">
            <h5>✅ 小记解析结果</h5>
            <p><strong>类型：</strong>${typeText}</p>
            <p><strong>分类：</strong>${data.category || '未识别'}</p>
            <p><strong>金额：</strong>¥${data.amount || '0'}</p>
            ${data.date ? `<p><strong>日期：</strong>${data.date}</p>` : ''}
            ${data.note ? `<p><strong>备注：</strong>${data.note}</p>` : ''}
            <p class="success-hint">信息已自动填充到表单，请核对后提交！</p>
        </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

function fillFormFromVoice(data) {
    // 设置类型
    if (data.type) {
        document.getElementById('type').value = data.type;
        updateCategories();
    }

    // 设置分类
    if (data.category) {
        const categorySelect = document.getElementById('category');
        // 检查分类是否存在于当前类型的分类列表中
        const categoryOptions = Array.from(categorySelect.options).map(opt => opt.value);
        if (categoryOptions.includes(data.category)) {
            categorySelect.value = data.category;
        }
    }

    // 设置金额
    if (data.amount) {
        document.getElementById('amount').value = data.amount;
    }

    // 设置日期
    if (data.date) {
        document.getElementById('date').value = data.date;
    }

    // 设置备注
    if (data.note) {
        document.getElementById('note').value = data.note;
    }

    // 滚动到表单
    setTimeout(() => {
        document.getElementById('transactionForm').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// ==================== AI智能助手功能 ====================

// 生成AI智能洞察
async function generateAIInsights() {
    const container = document.getElementById('aiInsightsContainer');

    // 检查是否有交易数据
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="ai-insight-item info">
                <div class="ai-insight-icon">💡</div>
                <div class="ai-insight-content">
                    <div class="ai-insight-title">欢迎使用AI智能助手</div>
                    <div class="ai-insight-text">开始记账后，AI将为您提供个性化的财务建议</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="ai-insight-loading">
            <div class="loading-dots">小记正在分析您的财务数据<span>.</span><span>.</span><span>.</span></div>
        </div>
    `;

    try {
        const summary = generateFinancialSummary();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const prompt = `作为小记AI财务助手，请分析以下数据并提供3-5条简短的洞察和建议（每条不超过30字）：

【本月数据】
收入: ¥${summary.currentMonth.income.toFixed(2)}
支出: ¥${summary.currentMonth.expense.toFixed(2)}
结余: ¥${summary.currentMonth.balance.toFixed(2)}

【支出分类】
${Object.entries(summary.categoryExpense).map(([cat, amount]) =>
    `${cat}: ¥${amount.toFixed(2)} (${(amount/summary.currentMonth.expense*100).toFixed(1)}%)`
).join('\n')}

【预算执行】
${summary.budgets.map(b =>
    `${b.category}: ${(b.spent/b.budget*100).toFixed(0)}% (${b.spent > b.budget ? '超支' : '正常'})`
).join('\n') || '未设置预算'}

请提供：
1. 最重要的财务提醒（如超支、异常等）
2. 具体改进建议
3. 鼓励性的正面反馈

每条建议用一句话表达，格式：【类型】内容
类型可以是：警告、建议、提醒、鼓励等`;

        const result = await callDeepSeekAPI(prompt);

        // 解析AI返回的建议
        const insights = parseAIInsights(result);
        displayAIInsights(insights);

    } catch (error) {
        console.error('AI洞察生成失败:', error);
        container.innerHTML = `
            <div class="ai-insight-item error">
                <div class="ai-insight-icon">⚠️</div>
                <div class="ai-insight-content">
                    <div class="ai-insight-text">小记分析暂时不可用，请稍后再试</div>
                </div>
            </div>
        `;
    }
}

// 解析AI洞察
function parseAIInsights(text) {
    const insights = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
        let type = 'info';
        let content = line.trim();

        // 去除序号
        content = content.replace(/^\d+[\.\、]\s*/, '');

        // 识别类型
        if (content.match(/【(.*?)】/)) {
            const typeMatch = content.match(/【(.*?)】/);
            const typeText = typeMatch[1];
            content = content.replace(/【.*?】\s*/, '');

            if (typeText.includes('警告') || typeText.includes('超') || typeText.includes('风险')) {
                type = 'warning';
            } else if (typeText.includes('建议') || typeText.includes('提示')) {
                type = 'suggestion';
            } else if (typeText.includes('鼓励') || typeText.includes('表扬') || typeText.includes('优秀')) {
                type = 'success';
            }
        } else {
            // 通过关键词判断类型
            if (content.includes('超') || content.includes('过高') || content.includes('警告') || content.includes('注意')) {
                type = 'warning';
            } else if (content.includes('建议') || content.includes('可以') || content.includes('应该')) {
                type = 'suggestion';
            } else if (content.includes('优秀') || content.includes('很好') || content.includes('继续')) {
                type = 'success';
            }
        }

        if (content.length > 10) {
            insights.push({ type, content });
        }
    }

    return insights.slice(0, 5); // 最多显示5条
}

// 显示AI洞察
function displayAIInsights(insights) {
    const container = document.getElementById('aiInsightsContainer');

    if (insights.length === 0) {
        container.innerHTML = `
            <div class="ai-insight-item info">
                <div class="ai-insight-icon">💡</div>
                <div class="ai-insight-content">
                    <div class="ai-insight-text">继续保持良好的记账习惯！</div>
                </div>
            </div>
        `;
        return;
    }

    const iconMap = {
        warning: '⚠️',
        suggestion: '💡',
        success: '✅',
        info: 'ℹ️'
    };

    container.innerHTML = insights.map(insight => `
        <div class="ai-insight-item ${insight.type}">
            <div class="ai-insight-icon">${iconMap[insight.type]}</div>
            <div class="ai-insight-content">
                <div class="ai-insight-text">${insight.content}</div>
            </div>
        </div>
    `).join('');
}

// 刷新AI洞察
async function refreshAIInsights() {
    await generateAIInsights();
}

// ==================== AI智能分类推荐 ====================

let lastNoteValue = '';

// 获取AI分类建议
async function getAICategorySuggestion() {
    const noteInput = document.getElementById('note');
    const amountInput = document.getElementById('amount');
    const suggestionDiv = document.getElementById('aiSuggestion');
    const suggestionContent = document.getElementById('aiSuggestionContent');

    const note = noteInput.value.trim();
    const amount = amountInput.value;

    // 如果备注太短或没有改变，不请求AI
    if (note.length < 2 || note === lastNoteValue) {
        return;
    }

    lastNoteValue = note;

    // 清除之前的定时器
    if (aiSuggestionTimeout) {
        clearTimeout(aiSuggestionTimeout);
    }

    // 防抖：500ms后才请求AI
    aiSuggestionTimeout = setTimeout(async () => {
        suggestionDiv.style.display = 'block';
        suggestionContent.innerHTML = '<div class="ai-thinking">分析中...</div>';

        try {
            // 优先使用学习系统的预测
            const learnedPrediction = predictCategory(note);

            if (learnedPrediction) {
                // 学习系统有预测结果
                const stats = getLearningStats();
                const suggestion = {
                    type: learnedPrediction.type,
                    category: learnedPrediction.category,
                    reason: `智能学习预测 (准确率${stats.accuracy}%)`,
                    isLearned: true
                };
                displayCategorySuggestion(suggestion);
            } else {
                // 学习系统没有预测结果，使用DeepSeek AI
                const prompt = `根据以下交易信息，推荐最合适的分类：

备注: ${note}
${amount ? `金额: ¥${amount}` : ''}

可选分类：
支出: 餐饮、交通、购物、娱乐、医疗、教育、住房、其他
收入: 工资、奖金、投资、兼职、礼金、其他

只需返回JSON格式：{"type": "income或expense", "category": "分类名", "reason": "推荐理由(10字内)"}`;

                const systemPrompt = '你是一个智能记账分类助手，擅长根据交易描述推荐准确的分类。';
                const result = await callDeepSeekAPI(prompt, systemPrompt);

                // 解析JSON
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const suggestion = JSON.parse(jsonMatch[0]);
                    suggestion.isLearned = false;
                    displayCategorySuggestion(suggestion);
                } else {
                    suggestionDiv.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('分类推荐失败:', error);
            suggestionDiv.style.display = 'none';
        }
    }, 500);
}

// 显示分类建议
function displayCategorySuggestion(suggestion) {
    const suggestionContent = document.getElementById('aiSuggestionContent');
    const typeText = suggestion.type === 'income' ? '收入' : '支出';
    const sourceIcon = suggestion.isLearned ? '🎓' : '🤖';

    suggestionContent.innerHTML = `
        <div class="ai-suggestion-result">
            <span class="suggestion-badge">${sourceIcon} ${typeText} - ${suggestion.category}</span>
            <span class="suggestion-reason">${suggestion.reason}</span>
            <button class="btn-apply-suggestion" onclick="applyCategorySuggestion('${suggestion.type}', '${suggestion.category}')">
                采纳建议
            </button>
        </div>
    `;
}

// 应用分类建议
function applyCategorySuggestion(type, category) {
    document.getElementById('type').value = type;
    updateCategories();

    // 等待分类更新后设置
    setTimeout(() => {
        document.getElementById('category').value = category;
    }, 100);

    // 隐藏建议
    document.getElementById('aiSuggestion').style.display = 'none';

    // 提示用户
    showToast('✅ 已采纳AI建议');
}

// ==================== 异常交易检测 ====================

// 检测异常交易
function detectAnomalousTransactions() {
    if (transactions.length < 5) return; // 数据太少不检测

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 计算各分类的平均值和标准差
    const categoryStats = {};

    transactions.forEach(t => {
        if (t.type === 'expense') {
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = [];
            }
            categoryStats[t.category].push(t.amount);
        }
    });

    // 检测当前月的异常交易
    transactions.forEach(t => {
        if (t.date && t.date.startsWith(currentMonth) && t.type === 'expense') {
            const amounts = categoryStats[t.category];
            if (amounts && amounts.length >= 3) {
                const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const threshold = avg * 2; // 超过平均值2倍视为异常

                if (t.amount > threshold) {
                    t.isAnomalous = true;
                    t.anomalyReason = `金额异常：是该分类平均值的${(t.amount/avg).toFixed(1)}倍`;
                }
            }

            // 检测大额交易
            if (t.amount > 500) {
                t.isLarge = true;
            }
        }
    });

    saveUserData();
}

// 显示异常提醒
function showAnomalyAlert(transaction) {
    if (transaction.isAnomalous) {
        const message = `⚠️ 检测到异常交易\n\n${transaction.category} - ¥${transaction.amount}\n${transaction.anomalyReason}\n\n请确认这笔交易是否正确？`;

        if (confirm(message)) {
            // 用户确认是正确的，移除异常标记
            transaction.isAnomalous = false;
            delete transaction.anomalyReason;
            saveUserData();
        }
    }
}

// ==================== 工具函数 ====================

// 显示提示消息
function showToast(message, duration = 2000) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

// ==================== 账单导入功能 ====================

async function handleBillImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading('正在导入账单...');

    try {
        const fileName = file.name.toLowerCase();
        let parsedData = [];

        if (fileName.includes('.csv')) {
            parsedData = await parseCSVFile(file);
        } else if (fileName.includes('.xlsx') || fileName.includes('.xls')) {
            parsedData = await parseExcelFile(file);
        } else {
            throw new Error('不支持的文件格式，请上传CSV或Excel文件');
        }

        if (parsedData.length === 0) {
            throw new Error('未能解析到有效数据');
        }

        // 使用AI智能分类（异步）
        showLoading('小记正在智能分类中...');
        await aiClassifyTransactions(parsedData);

        // 导入交易
        let imported = 0;
        for (const data of parsedData) {
            transactions.push(data);
            imported++;
        }

        saveUserData();
        displayTransactions();
        updateDashboard();

        // 更新商家分析和日历
        analyzeMerchants();
        renderCalendar();

        hideLoading();
        showToast(`✅ 成功导入${imported}条交易记录！小记已完成智能分类`);

        // 清空文件输入
        event.target.value = '';

    } catch (error) {
        console.error('账单导入失败:', error);
        hideLoading();
        alert('账单导入失败：' + error.message);
    }
}

async function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                let text = '';

                // 尝试GBK编码解码（支付宝常用）
                try {
                    const decoder = new TextDecoder('gbk');
                    text = decoder.decode(arrayBuffer);

                    // 检查是否有乱码（如果包含大量�字符，说明解码失败）
                    const invalidChars = (text.match(/�/g) || []).length;
                    if (invalidChars > text.length * 0.1) {
                        throw new Error('GBK解码失败');
                    }
                } catch (gbkError) {
                    // GBK失败，尝试UTF-8
                    console.log('GBK解码失败，尝试UTF-8');
                    const decoder = new TextDecoder('utf-8');
                    text = decoder.decode(arrayBuffer);
                }

                const transactions = parseCSVContent(text);
                resolve(transactions);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function() {
            reject(new Error('文件读取失败'));
        };

        // 读取为ArrayBuffer以便支持多种编码
        reader.readAsArrayBuffer(file);
    });
}

async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 获取第一个sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // 转换为JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // 识别是支付宝还是微信账单
                const transactions = parseExcelContent(jsonData, file.name);
                resolve(transactions);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function() {
            reject(new Error('文件读取失败'));
        };

        reader.readAsArrayBuffer(file);
    });
}

function parseExcelContent(rows, fileName) {
    const transactions = [];

    // 判断是支付宝还是微信
    const isAlipay = fileName.includes('支付宝') || fileName.includes('alipay');
    const isWechat = fileName.includes('微信') || fileName.includes('wechat');

    // 查找数据开始行
    let dataStartIndex = -1;
    let headerRow = null;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rowText = row.join('').toLowerCase();

        // 支付宝格式
        if (rowText.includes('交易时间') && rowText.includes('交易分类')) {
            dataStartIndex = i + 1;
            headerRow = row;
            break;
        }

        // 微信格式
        if (rowText.includes('交易时间') && rowText.includes('交易类型')) {
            dataStartIndex = i + 1;
            headerRow = row;
            break;
        }
    }

    if (dataStartIndex === -1) {
        throw new Error('无法识别Excel格式，请确保是支付宝或微信导出的账单');
    }

    // 解析数据行
    for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 7) continue;

        // 跳过空行和分隔行
        const firstCell = String(row[0] || '').trim();
        if (!firstCell || firstCell.startsWith('---') || firstCell.startsWith('===')) {
            continue;
        }

        try {
            let transaction = null;

            if (isAlipay || (!isWechat && row.length >= 9)) {
                transaction = parseAlipayExcelRow(row);
            } else if (isWechat) {
                transaction = parseWechatExcelRow(row);
            } else {
                // 尝试自动识别
                transaction = parseAlipayExcelRow(row);
            }

            if (transaction) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('解析行失败:', e, row);
        }
    }

    return transactions;
}

function parseAlipayExcelRow(row) {
    // 支付宝Excel格式：交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,...
    const timeStr = String(row[0] || '').trim();
    const typeStr = String(row[5] || '').trim(); // 收入/支出/不计收支
    const amountStr = String(row[6] || '').trim();
    const description = String(row[4] || row[2] || '').trim();
    const status = String(row[8] || '').trim();

    // 只导入成功的交易
    if (!status.includes('成功') && !status.includes('交易成功')) {
        return null;
    }

    // 解析金额
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) {
        return null;
    }

    // 判断类型
    let type = 'expense';
    if (typeStr === '收入' || typeStr.includes('收入')) {
        type = 'income';
    } else if (typeStr === '不计收支' || typeStr.includes('不计收支')) {
        return null;
    }

    // 解析日期
    let date = '';
    if (timeStr) {
        try {
            // 支持多种日期格式
            const dateMatch = timeStr.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/);
            if (dateMatch) {
                const year = dateMatch[1];
                const month = String(dateMatch[2]).padStart(2, '0');
                const day = String(dateMatch[3]).padStart(2, '0');
                date = `${year}-${month}-${day}`;
            }
        } catch (e) {
            date = new Date().toISOString().split('T')[0];
        }
    }

    // 智能分类
    const category = guessCategory(description, type);

    return {
        id: Date.now() + Math.random(),
        type: type,
        category: category,
        amount: amount,
        date: date || new Date().toISOString().split('T')[0],
        note: description.substring(0, 50),
        source: 'Excel导入'
    };
}

function parseWechatExcelRow(row) {
    // 微信Excel格式：交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,...
    const timeStr = String(row[0] || '').trim();
    const typeStr = String(row[4] || '').trim(); // 收入/支出
    const amountStr = String(row[5] || '').trim();
    const description = String(row[3] || row[1] || '').trim();
    const status = String(row[7] || '').trim();

    // 只导入成功的交易
    if (status && !status.includes('成功') && !status.includes('支付成功')) {
        return null;
    }

    // 解析金额（微信格式可能是"¥100.00"）
    let amountValue = amountStr.replace(/[¥￥,]/g, '').trim();
    const amount = parseFloat(amountValue);
    if (isNaN(amount) || amount === 0) {
        return null;
    }

    // 判断类型
    let type = 'expense';
    if (typeStr === '收入' || typeStr.includes('收入') || typeStr === '/' ) {
        type = 'income';
    }

    // 解析日期
    let date = '';
    if (timeStr) {
        try {
            const dateMatch = timeStr.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/);
            if (dateMatch) {
                const year = dateMatch[1];
                const month = String(dateMatch[2]).padStart(2, '0');
                const day = String(dateMatch[3]).padStart(2, '0');
                date = `${year}-${month}-${day}`;
            }
        } catch (e) {
            date = new Date().toISOString().split('T')[0];
        }
    }

    // 智能分类
    const category = guessCategory(description, type);

    return {
        id: Date.now() + Math.random(),
        type: type,
        category: category,
        amount: amount,
        date: date || new Date().toISOString().split('T')[0],
        note: description.substring(0, 50),
        source: 'Excel导入'
    };
}

function parseCSVContent(csvText) {
    const lines = csvText.split('\n');
    const transactions = [];

    // 查找数据开始行（支付宝格式）
    let dataStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('交易时间') && lines[i].includes('交易分类')) {
            dataStartIndex = i + 1;
            break;
        }
    }

    if (dataStartIndex === -1) {
        throw new Error('无法识别CSV格式');
    }

    // 解析数据行
    for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('---')) continue;

        const fields = parseCSVLine(line);
        if (fields.length < 7) continue;

        try {
            const transaction = parseAlipayTransaction(fields);
            if (transaction) {
                transactions.push(transaction);
            }
        } catch (e) {
            console.warn('解析行失败:', e, fields);
        }
    }

    return transactions;
}

function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current) {
        fields.push(current.trim());
    }

    return fields;
}

function parseAlipayTransaction(fields) {
    // 支付宝CSV格式：交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,...
    const timeStr = fields[0];
    const typeStr = fields[5]; // 收入/支出/不计收支
    const amountStr = fields[6];
    const description = fields[4] || fields[2];
    const status = fields[8];

    // 只导入成功的交易
    if (!status.includes('成功')) {
        return null;
    }

    // 解析金额
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) {
        return null;
    }

    // 判断类型
    let type = 'expense';
    if (typeStr === '收入' || typeStr.includes('收入')) {
        type = 'income';
    } else if (typeStr === '不计收支') {
        return null; // 跳过不计收支的交易
    }

    // 解析日期
    let date = '';
    if (timeStr) {
        try {
            const dateMatch = timeStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
                date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            }
        } catch (e) {
            date = new Date().toISOString().split('T')[0];
        }
    }

    // 智能分类
    const category = guessCategory(description, type);

    return {
        id: Date.now() + Math.random(),
        type: type,
        category: category,
        amount: amount,
        date: date || new Date().toISOString().split('T')[0],
        note: description.substring(0, 50),
        source: '支付宝导入'
    };
}

function guessCategory(description, type) {
    const desc = description.toLowerCase();

    if (type === 'income') {
        if (desc.includes('工资') || desc.includes('薪') || desc.includes('salary')) return '工资';
        if (desc.includes('奖金') || desc.includes('红包') || desc.includes('bonus')) return '奖金';
        if (desc.includes('投资') || desc.includes('分红') || desc.includes('股息')) return '投资';
        if (desc.includes('兼职') || desc.includes('外快')) return '兼职';
        if (desc.includes('礼金') || desc.includes('礼')) return '礼金';
        return '其他';
    }

    // 支出分类 - 优化关键词匹配
    // 餐饮
    if (desc.match(/餐|饭|吃|外卖|美食|咖啡|奶茶|食|饮|肯德基|麦当劳|星巴克|喜茶|海底捞|烧烤|火锅|食堂|快餐|小吃|饮料|茶|lunch|dinner|food/i)) {
        return '餐饮';
    }
    // 交通
    if (desc.match(/打车|滴滴|出租|uber|地铁|公交|bus|出行|加油|油费|停车|车|ticket|火车|高铁|飞机|机票|航空|火车票|公交卡|交通卡|shared|共享单车|bike/i)) {
        return '交通';
    }
    // 购物
    if (desc.match(/购物|淘宝|京东|天猫|拼多多|超市|商品|衣服|鞋|裤|包|化妆品|日用品|家居|电器|数码|手机|电脑|mall|shopping|store|market/i)) {
        return '购物';
    }
    // 娱乐
    if (desc.match(/电影|游戏|ktv|唱|娱乐|玩|乐园|游乐|酒吧|club|演出|票|concert|movie|netflix|会员|视频|音乐|spotify/i)) {
        return '娱乐';
    }
    // 医疗
    if (desc.match(/医|药|hospital|clinic|诊所|体检|看病|治疗|保健|health|doctor|药店|药房/i)) {
        return '医疗';
    }
    // 教育
    if (desc.match(/教育|培训|课程|学|书|考试|学费|tuition|class|course|培|训练|辅导|图书/i)) {
        return '教育';
    }
    // 住房
    if (desc.match(/房租|租金|物业|水费|电费|燃气|暖气|rent|utility|房|宿舍|住宿|apartment|管理费/i)) {
        return '住房';
    }

    return '其他';
}

// AI智能分类（批量处理）
async function aiClassifyTransactions(transactions) {
    const apiKey = deepseekApiKey || DEFAULT_API_KEY;

    // 只处理分类为"其他"的交易，最多20条
    const needClassify = transactions
        .filter(t => t.category === '其他' && t.note)
        .slice(0, 20);

    if (needClassify.length === 0) {
        return transactions;
    }

    try {
        const descriptions = needClassify.map((t, i) => `${i + 1}. ${t.note}`).join('\n');

        const prompt = `请为以下交易分类。每条交易给出最合适的分类。

交易列表：
${descriptions}

可选分类：
- 收入：工资、奖金、投资、兼职、礼金、其他
- 支出：餐饮、交通、购物、娱乐、医疗、教育、住房、其他

请以JSON数组格式返回，每个元素格式为 {"index": 序号, "category": "分类名"}
只返回JSON，不要其他说明。`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是小记AI分类助手，擅长准确识别交易的分类。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('AI分类失败');
        }

        const data = await response.json();
        const resultText = data.choices[0].message.content.trim();

        // 提取JSON
        let classifications = [];
        try {
            const jsonMatch = resultText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                classifications = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败:', e);
            return transactions;
        }

        // 应用AI分类结果
        classifications.forEach(item => {
            const index = item.index - 1;
            if (index >= 0 && index < needClassify.length) {
                needClassify[index].category = item.category;
            }
        });

        console.log(`✅ 小记已智能分类${classifications.length}条交易`);

    } catch (error) {
        console.error('AI分类错误:', error);
    }

    return transactions;
}

// ==================== AI财务健康评分 ====================

// ==================== 增强版财务健康评分系统（8维度） ====================

async function calculateHealthScore() {
    const scoreCircle = document.getElementById('scoreProgress');
    const scoreNumber = document.getElementById('scoreNumber');
    const scoreLabel = document.getElementById('scoreLabel');
    const scoreFactors = document.getElementById('scoreFactors');

    // 检查必要的DOM元素是否存在
    if (!scoreCircle || !scoreNumber || !scoreLabel || !scoreFactors) {
        console.warn('Health score elements not found');
        return;
    }

    if (transactions.length === 0) {
        scoreNumber.textContent = '--';
        scoreLabel.textContent = '暂无数据';
        scoreFactors.innerHTML = '<p style="color: #666; font-size: 14px;">添加交易记录后查看评分</p>';
        return;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonth));

    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // 1. 💰 储蓄能力 (15分)
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const savingsScore = Math.min(savingsRate * 0.3, 15);

    // 2. 📊 预算纪律 (15分)
    let budgetScore = 0;
    if (budgets.length > 0) {
        const budgetCompliance = budgets.map(b => {
            const spent = monthTransactions
                .filter(t => t.type === 'expense' && t.category === b.category)
                .reduce((sum, t) => sum + t.amount, 0);
            return spent <= b.amount ? 1 : Math.max(0, 1 - (spent - b.amount) / b.amount);
        });
        const avgCompliance = budgetCompliance.reduce((a, b) => a + b, 0) / budgetCompliance.length;
        budgetScore = avgCompliance * 15;
    } else {
        budgetScore = 7.5; // 没设置预算给一半分数
    }

    // 3. 📈 消费稳定性 (10分) - 最近3个月波动
    let stabilityScore = 10;
    const last3Months = [];
    for (let i = 0; i < 3; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        const monthExpense = transactions
            .filter(t => t.type === 'expense' && t.date && t.date.startsWith(monthKey))
            .reduce((sum, t) => sum + t.amount, 0);
        last3Months.push(monthExpense);
    }
    if (last3Months.length >= 2 && last3Months.some(m => m > 0)) {
        const avg = last3Months.reduce((a, b) => a + b, 0) / last3Months.length;
        const variance = last3Months.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / last3Months.length;
        const volatility = Math.sqrt(variance) / (avg || 1);
        stabilityScore = Math.max(0, 10 - volatility * 30);
    }

    // 4. 💳 债务健康 (15分)
    const borrowData = transactions.filter(t => t.type === 'borrow');
    const totalBorrow = borrowData.reduce((sum, t) => sum + t.amount, 0);
    const returnedBorrow = borrowData.filter(t => t.status === 'returned').reduce((sum, t) => sum + t.amount, 0);
    const activeBorrow = totalBorrow - returnedBorrow;
    const debtRatio = income > 0 ? (activeBorrow / income) : 0;
    const debtScore = Math.max(0, 15 - (debtRatio * 30));

    // 5. 🎯 目标进度 (10分)
    const activeGoals = (savingsGoals || []).filter(g => g.status !== 'completed');
    let goalScore = 5; // 基础分
    if (activeGoals.length > 0) {
        const goalProgress = activeGoals.map(g => Math.min(g.current / g.target, 1));
        const avgProgress = goalProgress.reduce((a, b) => a + b, 0) / goalProgress.length;
        goalScore = 5 + (avgProgress * 5);
    }

    // 6. 📉 应急储备 (15分)
    const avgMonthlyExpense = expense || 1000;
    const currentBalance = income - expense;
    const emergencyMonths = currentBalance / avgMonthlyExpense;
    const emergencyScore = Math.min(emergencyMonths * 5, 15); // 3个月及以上满分

    // 7. 🔄 收入多元化 (10分)
    const incomeCategories = new Set(monthTransactions.filter(t => t.type === 'income').map(t => t.category));
    const diversityScore = Math.min(incomeCategories.size * 3, 10);

    // 8. 📱 财务习惯 (10分)
    const recordDays = new Set(transactions.filter(t => {
        const tDate = new Date(t.date);
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return tDate >= monthAgo;
    }).map(t => t.date.split(' ')[0]));
    const habitScore = Math.min(recordDays.size * 0.5, 10); // 20天记录满分

    // 计算总分
    const totalScore = Math.round(
        savingsScore + budgetScore + stabilityScore + debtScore +
        goalScore + emergencyScore + diversityScore + habitScore
    );

    // 评级系统（更细致）
    let rating = '';
    let ratingIcon = '';
    let ratingColor = '';
    if (totalScore >= 90) {
        rating = '卓越';
        ratingIcon = '💎';
        ratingColor = '#10b981';
    } else if (totalScore >= 80) {
        rating = '优秀';
        ratingIcon = '🌟';
        ratingColor = '#3b82f6';
    } else if (totalScore >= 70) {
        rating = '良好';
        ratingIcon = '✨';
        ratingColor = '#8b5cf6';
    } else if (totalScore >= 60) {
        rating = '及格';
        ratingIcon = '⚠️';
        ratingColor = '#f59e0b';
    } else if (totalScore >= 50) {
        rating = '待改进';
        ratingIcon = '📊';
        ratingColor = '#ef4444';
    } else {
        rating = '需努力';
        ratingIcon = '❌';
        ratingColor = '#dc2626';
    }

    // 保存历史评分（用于趋势分析）
    saveScoreHistory(totalScore);

    // 更新UI
    scoreNumber.textContent = totalScore;
    scoreLabel.textContent = `${ratingIcon} ${rating}`;
    scoreLabel.style.color = ratingColor;

    // 动画更新圆环
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (totalScore / 100) * circumference;
    scoreCircle.style.strokeDashoffset = offset;
    scoreCircle.style.transition = 'stroke-dashoffset 1s ease';

    // 获取改进建议
    const suggestions = getImprovementSuggestions({
        savingsScore, budgetScore, stabilityScore, debtScore,
        goalScore, emergencyScore, diversityScore, habitScore
    });

    // 显示8个维度的得分
    scoreFactors.innerHTML = `
        <div class="score-dimensions">
            ${createDimensionItem('💰 储蓄能力', savingsScore, 15)}
            ${createDimensionItem('📊 预算纪律', budgetScore, 15)}
            ${createDimensionItem('📈 消费稳定', stabilityScore, 10)}
            ${createDimensionItem('💳 债务健康', debtScore, 15)}
            ${createDimensionItem('🎯 目标进度', goalScore, 10)}
            ${createDimensionItem('📉 应急储备', emergencyScore, 15)}
            ${createDimensionItem('🔄 收入多元', diversityScore, 10)}
            ${createDimensionItem('📱 财务习惯', habitScore, 10)}
        </div>
        <div class="score-suggestions">
            <h4>💡 改进建议</h4>
            <ul>
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>
        <div class="score-trend">
            <h4>📈 评分趋势</h4>
            <div id="scoreTrendChart"></div>
        </div>
    `;

    // 绘制趋势图（需要在DOM更新后执行）
    setTimeout(() => {
        renderScoreTrend();
    }, 0);
}

function createDimensionItem(label, score, max) {
    const percentage = (score / max * 100).toFixed(0);
    const color = score / max >= 0.8 ? '#10b981' : score / max >= 0.6 ? '#3b82f6' : '#f59e0b';
    return `
        <div class="factor-item">
            <div class="factor-label">${label}</div>
            <div class="factor-bar">
                <div class="factor-fill" style="width: ${percentage}%; background: ${color}"></div>
            </div>
            <div class="factor-score">${Math.round(score)}/${max}</div>
        </div>
    `;
}

function getImprovementSuggestions(scores) {
    const suggestions = [];
    const maxScore = { savingsScore: 15, budgetScore: 15, stabilityScore: 10, debtScore: 15, goalScore: 10, emergencyScore: 15, diversityScore: 10, habitScore: 10 };

    // 找出得分最低的3个维度
    const sortedScores = Object.entries(scores)
        .map(([key, value]) => ({ key, value, max: maxScore[key], ratio: value / maxScore[key] }))
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 3);

    sortedScores.forEach(item => {
        if (item.key === 'savingsScore' && item.ratio < 0.6) {
            suggestions.push('增加收入或减少支出以提高储蓄率');
        } else if (item.key === 'budgetScore' && item.ratio < 0.6) {
            suggestions.push('严格遵守预算，避免超支');
        } else if (item.key === 'stabilityScore' && item.ratio < 0.6) {
            suggestions.push('保持消费稳定，避免大额非必要支出');
        } else if (item.key === 'debtScore' && item.ratio < 0.6) {
            suggestions.push('尽快偿还借款，减少债务负担');
        } else if (item.key === 'goalScore' && item.ratio < 0.6) {
            suggestions.push('设定明确的储蓄目标并努力完成');
        } else if (item.key === 'emergencyScore' && item.ratio < 0.6) {
            suggestions.push('建立应急基金，至少储备3个月生活费');
        } else if (item.key === 'diversityScore' && item.ratio < 0.6) {
            suggestions.push('尝试开拓多元化收入来源');
        } else if (item.key === 'habitScore' && item.ratio < 0.6) {
            suggestions.push('养成每日记账的好习惯');
        }
    });

    if (suggestions.length === 0) {
        suggestions.push('您的财务状况非常健康，继续保持！');
    }

    return suggestions;
}

function saveScoreHistory(score) {
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    const scoreHistory = userData.scoreHistory || [];

    const today = new Date().toISOString().split('T')[0];
    const existingIndex = scoreHistory.findIndex(s => s.date === today);

    if (existingIndex >= 0) {
        scoreHistory[existingIndex].score = score;
    } else {
        scoreHistory.push({ date: today, score: score });
    }

    // 只保留最近30天的数据
    if (scoreHistory.length > 30) {
        scoreHistory.splice(0, scoreHistory.length - 30);
    }

    userData.scoreHistory = scoreHistory;
    localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));
}

function renderScoreTrend() {
    const chartContainer = document.getElementById('scoreTrendChart');
    if (!chartContainer) {
        console.warn('scoreTrendChart element not found');
        return;
    }

    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    const scoreHistory = userData.scoreHistory || [];

    if (scoreHistory.length < 2) {
        chartContainer.innerHTML = '<p style="color: #666; font-size: 12px;">需要更多数据才能显示趋势</p>';
        return;
    }

    const width = chartContainer.offsetWidth || 300;
    const height = 60;

    const maxScore = Math.max(...scoreHistory.map(s => s.score), 100);
    const points = scoreHistory.map((s, i) => {
        const x = (i / (scoreHistory.length - 1)) * width;
        const y = height - (s.score / maxScore) * height;
        return `${x},${y}`;
    }).join(' ');

    chartContainer.innerHTML = `
        <svg width="${width}" height="${height}" style="background: rgba(255,255,255,0.05); border-radius: 8px;">
            <polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="2"/>
            ${scoreHistory.map((s, i) => {
                const x = (i / (scoreHistory.length - 1)) * width;
                const y = height - (s.score / maxScore) * height;
                return `<circle cx="${x}" cy="${y}" r="3" fill="#3b82f6"/>`;
            }).join('')}
        </svg>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 5px;">
            <span>${scoreHistory[0].date}</span>
            <span>${scoreHistory[scoreHistory.length - 1].date}</span>
        </div>
    `;
}

// ==================== AI智能标签系统 ====================

async function generateSmartTags(transaction) {
    if (!transaction) return [];

    const tags = [];
    const hour = transaction.date ? parseInt(transaction.date.split(' ')[1]?.split(':')[0] || 12) : 12;
    const dayOfWeek = transaction.date ? new Date(transaction.date).getDay() : 0;

    // 时间标签
    if (hour >= 0 && hour < 6) {
        tags.push({ text: '#深夜消费', color: '#8b5cf6' });
    } else if (hour >= 22) {
        tags.push({ text: '#夜间消费', color: '#6366f1' });
    }

    // 星期标签
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        tags.push({ text: '#周末', color: '#ec4899' });
    }

    // 金额标签
    if (transaction.amount > 500) {
        tags.push({ text: '#大额', color: '#f59e0b' });
    } else if (transaction.amount < 10) {
        tags.push({ text: '#小额', color: '#10b981' });
    }

    // 使用AI生成个性化标签
    if (transaction.note && transaction.note.length > 2) {
        try {
            const aiTags = await getAITags(transaction);
            tags.push(...aiTags);
        } catch (e) {
            console.warn('AI标签生成失败', e);
        }
    }

    return tags.slice(0, 3); // 最多3个标签
}

async function getAITags(transaction) {
    try {
        const prompt = `根据这笔交易，生成1-2个简短的行为或场景标签：

交易：${transaction.category} - ${transaction.note} - ¥${transaction.amount}

返回JSON格式：["#标签1", "#标签2"]

标签示例：#冲动购物、#必要支出、#奖励自己、#约会、#加班、#健身、#老地方、#首次尝试等`;

        const systemPrompt = '你是一个消费行为分析助手，擅长给交易打上准确的标签。';
        const result = await callDeepSeekAPI(prompt, systemPrompt);

        const jsonMatch = result.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
            const tagTexts = JSON.parse(jsonMatch[0]);
            return tagTexts.slice(0, 2).map((text, i) => ({
                text: text,
                color: ['#3b82f6', '#10b981', '#f59e0b'][i % 3]
            }));
        }
    } catch (e) {
        console.warn('AI标签失败', e);
    }

    return [];
}

// ==================== AI挑战任务系统 ====================

// ==================== 增强版挑战任务系统 ====================

// 挑战类型定义（12种挑战类型）
const CHALLENGE_TYPES = {
    // 支出控制类
    CATEGORY_LIMIT: 'category_limit',           // 分类支出控制
    TOTAL_EXPENSE_LIMIT: 'total_expense_limit', // 总支出控制
    NO_CATEGORY_SPEND: 'no_category_spend',     // 特定分类零支出

    // 储蓄类
    SAVINGS_TARGET: 'savings_target',           // 储蓄目标
    INCOME_BOOST: 'income_boost',               // 增加收入

    // 习惯养成类
    DAILY_RECORD: 'daily_record',               // 连续记账
    BUDGET_COMPLIANCE: 'budget_compliance',     // 预算遵守
    REVIEW_TRANSACTIONS: 'review_transactions', // 定期复盘

    // 优化类
    REDUCE_IMPULSE: 'reduce_impulse',           // 减少冲动消费
    INCREASE_NECESSARY: 'increase_necessary',   // 增加必要支出占比

    // 成就类
    ZERO_DEBT: 'zero_debt',                     // 清零债务
    EMERGENCY_FUND: 'emergency_fund'            // 建立应急基金
};

// 难度等级
const DIFFICULTY_LEVELS = {
    EASY: { name: '简单', multiplier: 1, color: '#10b981', points: 100 },
    MEDIUM: { name: '中等', multiplier: 1.5, color: '#3b82f6', points: 250 },
    HARD: { name: '困难', multiplier: 2, color: '#8b5cf6', points: 500 }
};

async function initChallenges() {
    // 从本地存储加载挑战
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    challenges = userData.challenges || [];
    achievements = userData.achievements || [];

    // 初始化用户积分
    if (!userData.challengePoints) {
        userData.challengePoints = 0;
        localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));
    }

    // 如果没有活跃挑战，生成新挑战
    const activeChallenges = challenges.filter(c => c.status === 'active');
    if (activeChallenges.length === 0 && transactions.length > 0) {
        await generateSmartChallenges();
    }

    displayChallenges();
}

async function generateSmartChallenges() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 分析用户财务数据
    const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // 计算各分类支出
    const categoryExpense = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        categoryExpense[t.category] = (categoryExpense[t.category] || 0) + t.amount;
    });

    // 获取AI推荐的挑战（基于用户行为分析）
    const recommendedChallenges = await getAIRecommendedChallenges(categoryExpense, income, expense);

    // 生成多样化的挑战池
    const challengePool = [];

    // 1. 分类支出控制挑战
    const topCategories = Object.entries(categoryExpense)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    topCategories.forEach(([category, amount], index) => {
        const difficulty = index === 0 ? 'HARD' : index === 1 ? 'MEDIUM' : 'EASY';
        const reduction = index === 0 ? 0.7 : index === 1 ? 0.8 : 0.9;
        challengePool.push(createChallenge(
            CHALLENGE_TYPES.CATEGORY_LIMIT,
            `控制${category}支出`,
            `本周${category}支出控制在${Math.round(amount * reduction / 4)}元以内`,
            Math.round(amount * reduction / 4),
            category,
            difficulty
        ));
    });

    // 2. 总支出控制挑战
    challengePool.push(createChallenge(
        CHALLENGE_TYPES.TOTAL_EXPENSE_LIMIT,
        '总支出控制',
        `本周总支出不超过${Math.round(expense * 0.8 / 4)}元`,
        Math.round(expense * 0.8 / 4),
        null,
        'MEDIUM'
    ));

    // 3. 储蓄目标挑战
    if (income > 0) {
        challengePool.push(createChallenge(
            CHALLENGE_TYPES.SAVINGS_TARGET,
            '储蓄目标',
            `本周储蓄达到${Math.round(income * 0.3 / 4)}元`,
            Math.round(income * 0.3 / 4),
            null,
            'MEDIUM'
        ));
    }

    // 4. 连续记账挑战
    challengePool.push(createChallenge(
        CHALLENGE_TYPES.DAILY_RECORD,
        '连续记账7天',
        '连续7天每天至少记录一笔交易',
        7,
        null,
        'EASY'
    ));

    // 5. 预算遵守挑战
    if (budgets.length > 0) {
        challengePool.push(createChallenge(
            CHALLENGE_TYPES.BUDGET_COMPLIANCE,
            '预算完美执行',
            '本周所有预算分类不超支',
            budgets.length,
            null,
            'HARD'
        ));
    }

    // 6. 零特定分类支出挑战
    const optionalCategories = ['娱乐', '购物', '其他'];
    optionalCategories.forEach(cat => {
        if (categoryExpense[cat]) {
            challengePool.push(createChallenge(
                CHALLENGE_TYPES.NO_CATEGORY_SPEND,
                `零${cat}支出`,
                `本周完全不在${cat}分类花钱`,
                0,
                cat,
                'HARD'
            ));
        }
    });

    // 7. 减少冲动消费挑战
    const impulseTransactions = monthTransactions.filter(t =>
        t.tags && t.tags.some(tag => tag.text === '#冲动购物')
    ).length;
    if (impulseTransactions > 2) {
        challengePool.push(createChallenge(
            CHALLENGE_TYPES.REDUCE_IMPULSE,
            '理性消费',
            '本周冲动消费不超过2笔',
            2,
            null,
            'MEDIUM'
        ));
    }

    // 8. 债务清零挑战
    const activeBorrows = transactions.filter(t => t.type === 'borrow' && t.status !== 'returned');
    if (activeBorrows.length > 0) {
        challengePool.push(createChallenge(
            CHALLENGE_TYPES.ZERO_DEBT,
            '清零债务',
            `归还${activeBorrows.length}笔借款`,
            activeBorrows.length,
            null,
            'HARD'
        ));
    }

    // 9. 应急基金挑战
    const avgMonthlyExpense = expense || 1000;
    challengePool.push(createChallenge(
        CHALLENGE_TYPES.EMERGENCY_FUND,
        '建立应急基金',
        `储蓄达到${Math.round(avgMonthlyExpense * 3)}元（3个月生活费）`,
        Math.round(avgMonthlyExpense * 3),
        null,
        'HARD'
    ));

    // 10. 定期复盘挑战
    challengePool.push(createChallenge(
        CHALLENGE_TYPES.REVIEW_TRANSACTIONS,
        '财务复盘',
        '本周查看统计页面至少3次',
        3,
        null,
        'EASY'
    ));

    // 从挑战池中随机选择3-5个挑战
    const selectedChallenges = selectDiverseChallenges(challengePool, recommendedChallenges);

    challenges.push(...selectedChallenges);
    saveChallenges();
}

function createChallenge(type, title, description, target, category, difficulty) {
    const difficultyConfig = DIFFICULTY_LEVELS[difficulty];
    return {
        id: Date.now() + Math.random(),
        type: type,
        title: title,
        description: description,
        target: target,
        current: 0,
        category: category,
        difficulty: difficulty,
        difficultyName: difficultyConfig.name,
        difficultyColor: difficultyConfig.color,
        points: difficultyConfig.points,
        startDate: getWeekStart(),
        endDate: getWeekEnd(),
        status: 'active',
        icon: getChallengeIcon(type)
    };
}

function getChallengeIcon(type) {
    const icons = {
        [CHALLENGE_TYPES.CATEGORY_LIMIT]: '🍽️',
        [CHALLENGE_TYPES.TOTAL_EXPENSE_LIMIT]: '💰',
        [CHALLENGE_TYPES.NO_CATEGORY_SPEND]: '🚫',
        [CHALLENGE_TYPES.SAVINGS_TARGET]: '💎',
        [CHALLENGE_TYPES.INCOME_BOOST]: '📈',
        [CHALLENGE_TYPES.DAILY_RECORD]: '✍️',
        [CHALLENGE_TYPES.BUDGET_COMPLIANCE]: '📊',
        [CHALLENGE_TYPES.REVIEW_TRANSACTIONS]: '🔍',
        [CHALLENGE_TYPES.REDUCE_IMPULSE]: '🧘',
        [CHALLENGE_TYPES.INCREASE_NECESSARY]: '🎯',
        [CHALLENGE_TYPES.ZERO_DEBT]: '💳',
        [CHALLENGE_TYPES.EMERGENCY_FUND]: '🏦'
    };
    return icons[type] || '🎯';
}

async function getAIRecommendedChallenges(categoryExpense, income, expense) {
    // 基于用户数据的智能推荐
    const recommendations = [];

    // 分析支出占比
    const savingsRate = income > 0 ? ((income - expense) / income) : 0;
    if (savingsRate < 0.2) {
        recommendations.push(CHALLENGE_TYPES.SAVINGS_TARGET);
        recommendations.push(CHALLENGE_TYPES.TOTAL_EXPENSE_LIMIT);
    }

    // 分析分类支出
    const topCategory = Object.entries(categoryExpense).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] / expense > 0.4) {
        recommendations.push(CHALLENGE_TYPES.CATEGORY_LIMIT);
    }

    // 分析记账频率
    const last7Days = transactions.filter(t => {
        const tDate = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tDate >= weekAgo;
    });
    const recordDays = new Set(last7Days.map(t => t.date.split(' ')[0])).size;
    if (recordDays < 5) {
        recommendations.push(CHALLENGE_TYPES.DAILY_RECORD);
    }

    return recommendations;
}

function selectDiverseChallenges(pool, recommended) {
    const selected = [];
    const difficulties = ['EASY', 'MEDIUM', 'HARD'];

    // 优先选择推荐的挑战
    recommended.forEach(recType => {
        const challenge = pool.find(c => c.type === recType && !selected.includes(c));
        if (challenge) selected.push(challenge);
    });

    // 确保每个难度至少有一个挑战
    difficulties.forEach(diff => {
        if (!selected.some(c => c.difficulty === diff)) {
            const challenge = pool.find(c => c.difficulty === diff && !selected.includes(c));
            if (challenge) selected.push(challenge);
        }
    });

    // 随机补充到3-4个挑战
    while (selected.length < 3 && pool.length > selected.length) {
        const remaining = pool.filter(c => !selected.includes(c));
        if (remaining.length === 0) break;
        const random = remaining[Math.floor(Math.random() * remaining.length)];
        selected.push(random);
    }

    return selected.slice(0, 4); // 最多4个挑战
}

function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function getWeekEnd() {
    const start = new Date(getWeekStart());
    return new Date(start.setDate(start.getDate() + 6)).toISOString().split('T')[0];
}

function getDateAfterDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function updateChallengeProgress() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    challenges.forEach(challenge => {
        if (challenge.status !== 'active') return;

        // 检查是否过期
        if (challenge.endDate < today) {
            challenge.status = 'expired';
            return;
        }

        const periodTransactions = transactions.filter(t =>
            t.date >= challenge.startDate && t.date <= challenge.endDate
        );

        // 根据不同类型更新进度
        switch (challenge.type) {
            case CHALLENGE_TYPES.CATEGORY_LIMIT:
                // 分类支出控制
                const categorySpent = periodTransactions
                    .filter(t => t.type === 'expense' && t.category === challenge.category)
                    .reduce((sum, t) => sum + t.amount, 0);
                challenge.current = categorySpent;
                if (categorySpent <= challenge.target && challenge.endDate <= today) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.TOTAL_EXPENSE_LIMIT:
                // 总支出控制
                const totalExpense = periodTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                challenge.current = totalExpense;
                if (totalExpense <= challenge.target && challenge.endDate <= today) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.NO_CATEGORY_SPEND:
                // 零特定分类支出
                const catSpent = periodTransactions
                    .filter(t => t.type === 'expense' && t.category === challenge.category)
                    .reduce((sum, t) => sum + t.amount, 0);
                challenge.current = catSpent;
                if (catSpent === 0 && challenge.endDate <= today) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.SAVINGS_TARGET:
                // 储蓄目标
                const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const expense = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                const savings = income - expense;
                challenge.current = Math.max(0, savings);
                if (savings >= challenge.target) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.DAILY_RECORD:
                // 连续记账
                const recordDays = new Set();
                transactions.forEach(t => {
                    if (t.date >= challenge.startDate && t.date <= today) {
                        recordDays.add(t.date.split(' ')[0]);
                    }
                });
                challenge.current = recordDays.size;
                if (challenge.current >= challenge.target) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.BUDGET_COMPLIANCE:
                // 预算遵守
                let compliantBudgets = 0;
                budgets.forEach(b => {
                    const spent = periodTransactions
                        .filter(t => t.type === 'expense' && t.category === b.category)
                        .reduce((sum, t) => sum + t.amount, 0);
                    if (spent <= b.amount) compliantBudgets++;
                });
                challenge.current = compliantBudgets;
                if (compliantBudgets >= challenge.target && challenge.endDate <= today) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.REDUCE_IMPULSE:
                // 减少冲动消费
                const impulseCount = periodTransactions.filter(t =>
                    t.tags && t.tags.some(tag => tag.text === '#冲动购物')
                ).length;
                challenge.current = impulseCount;
                if (impulseCount <= challenge.target && challenge.endDate <= today) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.ZERO_DEBT:
                // 清零债务
                const activeBorrows = transactions.filter(t =>
                    t.type === 'borrow' && t.status !== 'returned'
                ).length;
                challenge.current = challenge.target - activeBorrows;
                if (activeBorrows === 0) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.EMERGENCY_FUND:
                // 建立应急基金
                const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
                const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                const balance = monthIncome - monthExpense;
                challenge.current = Math.max(0, balance);
                if (balance >= challenge.target) {
                    completeChallenge(challenge);
                }
                break;

            case CHALLENGE_TYPES.REVIEW_TRANSACTIONS:
                // 定期复盘（需要在查看统计页面时手动增加）
                // challenge.current 会在其他地方更新
                if (challenge.current >= challenge.target) {
                    completeChallenge(challenge);
                }
                break;
        }
    });

    saveChallenges();
    displayChallenges();
}

function completeChallenge(challenge) {
    challenge.status = 'completed';

    // 奖励积分
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    userData.challengePoints = (userData.challengePoints || 0) + challenge.points;
    localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));

    // 解锁成就
    const achievementName = `${challenge.icon} ${challenge.title}达人`;
    unlockAchievement(achievementName);

    // 显示完成提示
    showChallengeCompleteNotification(challenge);
}

function showChallengeCompleteNotification(challenge) {
    // 创建完成通知
    const notification = document.createElement('div');
    notification.className = 'challenge-complete-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">🎉</div>
            <div class="notification-text">
                <h4>挑战完成！</h4>
                <p>${challenge.title}</p>
                <p class="points-earned">+${challenge.points} 积分</p>
            </div>
        </div>
    `;
    document.body.appendChild(notification);

    // 3秒后移除通知
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function displayChallenges() {
    const container = document.getElementById('challengeContainer');
    const activeChallenges = challenges.filter(c => c.status === 'active');

    // 获取用户总积分
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    const totalPoints = userData.challengePoints || 0;

    if (activeChallenges.length === 0) {
        container.innerHTML = `
            <div class="challenge-header">
                <div class="user-points">💰 总积分: ${totalPoints}</div>
            </div>
            <div class="no-challenge">
                <p>🎯 暂无活跃挑战</p>
                <button onclick="generateSmartChallenges().then(() => displayChallenges())" class="btn-primary" style="margin-top: 10px;">
                    🎲 生成智能挑战
                </button>
            </div>
        `;
        return;
    }

    // 按难度分组显示
    const easyCount = activeChallenges.filter(c => c.difficulty === 'EASY').length;
    const mediumCount = activeChallenges.filter(c => c.difficulty === 'MEDIUM').length;
    const hardCount = activeChallenges.filter(c => c.difficulty === 'HARD').length;

    container.innerHTML = `
        <div class="challenge-header">
            <div class="user-points">💰 总积分: ${totalPoints}</div>
            <div class="challenge-summary">
                <span class="difficulty-badge easy">${easyCount} 简单</span>
                <span class="difficulty-badge medium">${mediumCount} 中等</span>
                <span class="difficulty-badge hard">${hardCount} 困难</span>
            </div>
        </div>
        <div class="challenges-list">
            ${activeChallenges.map(challenge => createChallengeCard(challenge)).join('')}
        </div>
        <button onclick="generateSmartChallenges().then(() => displayChallenges())" class="btn-secondary" style="margin-top: 15px; width: 100%;">
            🔄 刷新挑战
        </button>
    `;
}

function createChallengeCard(challenge) {
    const isComplete = challenge.status === 'completed';
    const progress = challenge.target > 0 ? Math.min((challenge.current / challenge.target) * 100, 100) : 0;

    // 确定单位
    let unit = '';
    if (challenge.type === CHALLENGE_TYPES.CATEGORY_LIMIT ||
        challenge.type === CHALLENGE_TYPES.TOTAL_EXPENSE_LIMIT ||
        challenge.type === CHALLENGE_TYPES.SAVINGS_TARGET ||
        challenge.type === CHALLENGE_TYPES.EMERGENCY_FUND) {
        unit = '元';
    } else if (challenge.type === CHALLENGE_TYPES.DAILY_RECORD) {
        unit = '天';
    } else if (challenge.type === CHALLENGE_TYPES.NO_CATEGORY_SPEND) {
        unit = '元';
    } else if (challenge.type === CHALLENGE_TYPES.REDUCE_IMPULSE) {
        unit = '笔';
    } else if (challenge.type === CHALLENGE_TYPES.ZERO_DEBT ||
               challenge.type === CHALLENGE_TYPES.BUDGET_COMPLIANCE) {
        unit = '项';
    } else if (challenge.type === CHALLENGE_TYPES.REVIEW_TRANSACTIONS) {
        unit = '次';
    }

    // 处理反向进度条（支出越少越好）
    const isReverseProgress = challenge.type === CHALLENGE_TYPES.CATEGORY_LIMIT ||
                              challenge.type === CHALLENGE_TYPES.TOTAL_EXPENSE_LIMIT ||
                              challenge.type === CHALLENGE_TYPES.REDUCE_IMPULSE ||
                              challenge.type === CHALLENGE_TYPES.NO_CATEGORY_SPEND;

    let progressColor = '#10b981';
    if (isReverseProgress) {
        // 反向进度：超标显示红色
        if (challenge.current > challenge.target) {
            progressColor = '#ef4444';
        } else if (challenge.current > challenge.target * 0.8) {
            progressColor = '#f59e0b';
        }
    } else {
        // 正向进度：完成度越高越绿
        if (progress < 50) {
            progressColor = '#ef4444';
        } else if (progress < 80) {
            progressColor = '#f59e0b';
        }
    }

    return `
        <div class="challenge-item ${isComplete ? 'completed' : ''}" style="border-left: 4px solid ${challenge.difficultyColor}">
            <div class="challenge-header-row">
                <div class="challenge-icon-large">${challenge.icon}</div>
                <div class="challenge-meta">
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-badges">
                        <span class="difficulty-tag" style="background: ${challenge.difficultyColor}">
                            ${challenge.difficultyName}
                        </span>
                        <span class="points-tag">+${challenge.points}积分</span>
                    </div>
                </div>
            </div>
            <div class="challenge-desc">${challenge.description}</div>
            <div class="challenge-progress-container">
                <div class="challenge-progress-bar">
                    <div class="challenge-progress-fill"
                         style="width: ${progress}%; background: ${progressColor}">
                    </div>
                </div>
                <div class="challenge-stats">
                    <span class="progress-text">
                        ${isReverseProgress ?
                            `已用 ${challenge.current}${unit} / 限额 ${challenge.target}${unit}` :
                            `${challenge.current} / ${challenge.target}${unit}`
                        }
                    </span>
                    <span class="progress-percent">${Math.round(progress)}%</span>
                </div>
            </div>
            ${isComplete ? '<div class="completed-badge">✅ 已完成</div>' : ''}
        </div>
    `;
}

function unlockAchievement(reward) {
    if (!achievements.includes(reward)) {
        achievements.push(reward);
        showToast(`🎉 解锁成就：${reward}`, 3000);
        saveChallenges();
    }
}

function saveChallenges() {
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser}`) || '{}');
    userData.challenges = challenges;
    userData.achievements = achievements;
    localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));
}

// ==================== 日历视图功能 ====================

let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth(); // 0-11
let selectedDate = null;

// 支出分类图表的月份选择
let categoryChartYear = new Date().getFullYear();
let categoryChartMonth = new Date().getMonth(); // 0-11

function renderCalendar() {
    const year = currentCalendarYear;
    const month = currentCalendarMonth;

    // 更新标题
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('calendarTitle').textContent = `${year}年${monthNames[month]}`;

    // 计算本月统计数据
    const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(t => {
        if (t.date >= monthStart && t.date <= monthEnd) {
            if (t.type === 'income') {
                monthIncome += t.amount;
            } else {
                monthExpense += t.amount;
            }
        }
    });

    document.getElementById('monthIncome').textContent = `¥${monthIncome.toFixed(2)}`;
    document.getElementById('monthExpense').textContent = `¥${monthExpense.toFixed(2)}`;
    document.getElementById('monthBalance').textContent = `¥${(monthIncome - monthExpense).toFixed(2)}`;

    // 获取该月第一天是星期几 (0-6, 0是周日)
    const firstDay = new Date(year, month, 1).getDay();

    // 获取该月总天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 获取上个月总天数
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 清空日历网格（保留星期标题）
    const grid = document.getElementById('calendarGrid');
    const weekdayHeaders = grid.querySelectorAll('.calendar-weekday');
    grid.innerHTML = '';
    weekdayHeaders.forEach(header => grid.appendChild(header));

    // 填充上个月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, true, year, month - 1);
        grid.appendChild(dayEl);
    }

    // 填充本月的日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = createDayElement(day, false, year, month);
        grid.appendChild(dayEl);
    }

    // 填充下个月的日期（补齐到42个格子）
    const totalCells = grid.children.length - 7; // 减去星期标题
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, true, year, month + 1);
        grid.appendChild(dayEl);
    }
}

function createDayElement(day, isOtherMonth, year, month) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }

    // 构造日期字符串
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // 检查是否是今天
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today && !isOtherMonth) {
        dayEl.classList.add('today');
    }

    // 检查是否被选中
    if (dateStr === selectedDate) {
        dayEl.classList.add('selected');
    }

    // 日期数字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);

    // 计算当天的收支
    if (!isOtherMonth) {
        const dayTransactions = transactions.filter(t => t.date === dateStr);
        let dayIncome = 0;
        let dayExpense = 0;

        dayTransactions.forEach(t => {
            if (t.type === 'income') {
                dayIncome += t.amount;
            } else {
                dayExpense += t.amount;
            }
        });

        // 显示金额
        if (dayIncome > 0 || dayExpense > 0) {
            const amountEl = document.createElement('div');
            amountEl.className = 'day-amount';

            if (dayIncome > 0 && dayExpense > 0) {
                amountEl.classList.add('both');
                amountEl.textContent = `+${dayIncome.toFixed(0)} -${dayExpense.toFixed(0)}`;
            } else if (dayIncome > 0) {
                amountEl.classList.add('income');
                amountEl.textContent = `+${dayIncome.toFixed(0)}`;
            } else {
                amountEl.classList.add('expense');
                amountEl.textContent = `-${dayExpense.toFixed(0)}`;
            }

            dayEl.appendChild(amountEl);
        }
    }

    // 点击事件
    dayEl.addEventListener('click', () => {
        if (!isOtherMonth) {
            selectedDate = dateStr;
            showDayDetails(dateStr);
            renderCalendar(); // 重新渲染以更新选中状态
        }
    });

    return dayEl;
}

function changeMonth(delta) {
    currentCalendarMonth += delta;

    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }

    renderCalendar();
}

function goToToday() {
    const today = new Date();
    currentCalendarYear = today.getFullYear();
    currentCalendarMonth = today.getMonth();
    selectedDate = today.toISOString().split('T')[0];
    renderCalendar();
    showDayDetails(selectedDate);
}

function showDayDetails(dateStr) {
    const dayTransactions = transactions.filter(t => t.date === dateStr);

    document.getElementById('selectedDate').textContent = dateStr;

    const listEl = document.getElementById('dayTransactions');

    if (dayTransactions.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">当天暂无交易记录</div>';
    } else {
        listEl.innerHTML = dayTransactions.map(t => `
            <div class="day-transaction-item ${t.type}">
                <div class="day-transaction-info">
                    <div class="day-transaction-category">${t.category}</div>
                    <div class="day-transaction-note">${t.note || '无备注'}</div>
                </div>
                <div class="day-transaction-amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}¥${t.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    document.getElementById('dayDetails').style.display = 'block';
}

function closeDayDetails() {
    document.getElementById('dayDetails').style.display = 'none';
    selectedDate = null;
    renderCalendar();
}

// ==================== 支出分类月份切换 ====================

function changeCategoryMonth(delta) {
    categoryChartMonth += delta;

    if (categoryChartMonth > 11) {
        categoryChartMonth = 0;
        categoryChartYear++;
    } else if (categoryChartMonth < 0) {
        categoryChartMonth = 11;
        categoryChartYear--;
    }

    updateCategoryChart();
}

// ==================== 商家分析功能 ====================

function analyzeMerchants() {
    const merchantData = {};

    // 从交易记录中提取商家信息
    transactions.forEach(t => {
        if (t.type === 'expense') {
            // 商家名称优先从note字段提取，如果有source字段也可以使用
            let merchantName = t.note || t.merchant || '未知商家';

            // 简化商家名称（去除常见后缀）
            merchantName = merchantName
                .replace(/外卖|美食|奶茶|咖啡|购物|超市|便利店|药店/g, '')
                .trim();

            if (!merchantName || merchantName.length > 20) {
                merchantName = t.category || '其他';
            }

            if (!merchantData[merchantName]) {
                merchantData[merchantName] = {
                    name: merchantName,
                    count: 0,
                    total: 0,
                    transactions: []
                };
            }

            merchantData[merchantName].count++;
            merchantData[merchantName].total += t.amount;
            merchantData[merchantName].transactions.push(t);
        }
    });

    // 转换为数组并排序
    const merchantArray = Object.values(merchantData)
        .sort((a, b) => b.total - a.total);

    // 更新统计卡片
    document.getElementById('totalMerchants').textContent = merchantArray.length;

    if (merchantArray.length > 0) {
        // 消费次数最多的商家
        const mostFrequent = [...merchantArray].sort((a, b) => b.count - a.count)[0];
        document.getElementById('topMerchant').textContent = mostFrequent.name;

        // 消费金额最多的商家
        document.getElementById('maxSpendMerchant').textContent = merchantArray[0].name;
    } else {
        document.getElementById('topMerchant').textContent = '--';
        document.getElementById('maxSpendMerchant').textContent = '--';
    }

    // 渲染商家列表
    const listEl = document.getElementById('merchantList');

    if (merchantArray.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无商家消费记录</div>';
        return;
    }

    listEl.innerHTML = merchantArray.map((merchant, index) => {
        const rankClass = index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : '';
        const rankSymbol = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);

        // 标记"老地方"（访问3次以上）
        const isFavorite = merchant.count >= 3;

        // 计算平均消费
        const avgSpend = merchant.total / merchant.count;

        return `
            <div class="merchant-item">
                <div class="merchant-rank ${rankClass}">${rankSymbol}</div>
                <div class="merchant-info">
                    <div class="merchant-name">
                        ${merchant.name}
                        ${isFavorite ? '<span class="merchant-badge">老地方</span>' : ''}
                    </div>
                    <div class="merchant-details">
                        消费 ${merchant.count} 次 · 平均 ¥${avgSpend.toFixed(2)}/次
                    </div>
                </div>
                <div class="merchant-amount">
                    <div class="merchant-total">¥${merchant.total.toFixed(2)}</div>
                    <div class="merchant-count">占比 ${((merchant.total / transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(1)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== 储蓄计划功能 ====================

function initSavingsPlans() {
    const form = document.getElementById('savingsPlanForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const planName = document.getElementById('planName').value;
        const planAmount = parseFloat(document.getElementById('planAmount').value);
        const planCurrent = parseFloat(document.getElementById('planCurrent').value);
        const planDeadline = document.getElementById('planDeadline').value;
        const planIcon = document.querySelector('input[name="planIcon"]:checked').value;

        const plan = {
            id: Date.now(),
            name: planName,
            targetAmount: planAmount,
            currentAmount: planCurrent,
            deadline: planDeadline,
            icon: planIcon,
            createdDate: new Date().toISOString().split('T')[0]
        };

        savingsPlans.push(plan);
        saveUserData();
        form.reset();
        displaySavingsPlans();
        showToast('✅ 储蓄计划创建成功！');
    });

    displaySavingsPlans();
}

function displaySavingsPlans() {
    const listEl = document.getElementById('savingsPlansList');

    if (savingsPlans.length === 0) {
        listEl.innerHTML = '';
        return;
    }

    listEl.innerHTML = savingsPlans.map(plan => {
        const progress = (plan.currentAmount / plan.targetAmount) * 100;
        const progressCapped = Math.min(progress, 100);

        // 计算剩余金额和时间
        const remaining = plan.targetAmount - plan.currentAmount;
        const today = new Date();
        const deadline = new Date(plan.deadline);
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));

        // 计算每月需要存款
        const monthlyRequired = remaining / monthsRemaining;

        // 计算状态
        let statusClass = 'on-track';
        let statusText = '进度正常';

        if (progress >= 100) {
            statusClass = 'completed';
            statusText = '已完成';
        } else if (daysRemaining < 0) {
            statusClass = 'behind';
            statusText = '已逾期';
        } else if (monthlyRequired > 10000) {
            statusClass = 'behind';
            statusText = '需加速';
        }

        return `
            <div class="savings-plan-card">
                <div class="plan-header">
                    <div class="plan-title">
                        <div class="plan-icon">${plan.icon}</div>
                        <div class="plan-name-group">
                            <h4>${plan.name}</h4>
                            <div class="plan-deadline">目标日期：${plan.deadline} （还剩 ${daysRemaining} 天）</div>
                        </div>
                    </div>
                    <button class="plan-delete-btn" onclick="deleteSavingsPlan(${plan.id})">删除</button>
                </div>

                <div class="plan-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progressCapped}%">
                            ${progressCapped.toFixed(1)}%
                        </div>
                    </div>
                    <div class="progress-info">
                        <span>已存：¥${plan.currentAmount.toFixed(2)}</span>
                        <span>目标：¥${plan.targetAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="plan-stats">
                    <div class="plan-stat-item">
                        <div class="plan-stat-label">还需存款</div>
                        <div class="plan-stat-value highlight">¥${remaining.toFixed(0)}</div>
                    </div>
                    <div class="plan-stat-item">
                        <div class="plan-stat-label">每月需存</div>
                        <div class="plan-stat-value ${monthlyRequired > 10000 ? 'warning' : 'success'}">¥${monthlyRequired.toFixed(0)}</div>
                    </div>
                    <div class="plan-stat-item">
                        <div class="plan-stat-label">剩余月数</div>
                        <div class="plan-stat-value">${monthsRemaining}个月</div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <span class="plan-status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

function deleteSavingsPlan(id) {
    if (confirm('确定要删除这个储蓄计划吗？')) {
        savingsPlans = savingsPlans.filter(p => p.id !== id);
        saveUserData();
        displaySavingsPlans();
        showToast('储蓄计划已删除');
    }
}

// ==================== 启动页面控制 ====================

function hideSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        // 3秒后自动隐藏启动页面
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 3000);
    }
}

// ==================== 借贷管理 ====================

function initLendBorrow() {
    // 初始化借出表单
    const lentForm = document.getElementById('lentForm');
    if (lentForm) {
        lentForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const lentRecord = {
                id: Date.now(),
                to: document.getElementById('lentTo').value.trim(),
                amount: parseFloat(document.getElementById('lentAmount').value),
                date: document.getElementById('lentDate').value,
                dueDate: document.getElementById('lentDueDate').value,
                note: document.getElementById('lentNote').value.trim(),
                returned: false,
                returnedDate: null
            };

            lentMoney.push(lentRecord);
            saveUserData();
            displayLentRecords();
            lentForm.reset();
            showToast('✅ 借出记录已添加');
        });
    }

    // 初始化借入表单
    const borrowedForm = document.getElementById('borrowedForm');
    if (borrowedForm) {
        borrowedForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const borrowedRecord = {
                id: Date.now(),
                from: document.getElementById('borrowedFrom').value.trim(),
                amount: parseFloat(document.getElementById('borrowedAmount').value),
                date: document.getElementById('borrowedDate').value,
                dueDate: document.getElementById('borrowedDueDate').value,
                note: document.getElementById('borrowedNote').value.trim(),
                returned: false,
                returnedDate: null
            };

            borrowedMoney.push(borrowedRecord);
            saveUserData();
            displayBorrowedRecords();
            borrowedForm.reset();
            showToast('✅ 借入记录已添加');
        });
    }

    // 显示记录
    displayLentRecords();
    displayBorrowedRecords();
}

function displayLentRecords() {
    const lentList = document.getElementById('lentList');
    if (!lentList) return;

    if (lentMoney.length === 0) {
        lentList.innerHTML = '<div class="empty-state"><p>暂无借出记录</p></div>';
        return;
    }

    // 计算统计数据
    const totalLent = lentMoney.filter(l => !l.returned).reduce((sum, l) => sum + l.amount, 0);
    const totalReturned = lentMoney.filter(l => l.returned).reduce((sum, l) => sum + l.amount, 0);
    const overdueCount = lentMoney.filter(l => !l.returned && l.dueDate && new Date(l.dueDate) < new Date()).length;

    let html = `
        <div class="lend-summary">
            <div class="summary-item">
                <h4>未收回金额</h4>
                <div class="amount">¥${totalLent.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <h4>已收回金额</h4>
                <div class="amount">¥${totalReturned.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <h4>逾期笔数</h4>
                <div class="amount">${overdueCount}笔</div>
            </div>
        </div>
    `;

    // 按日期排序（最新的在前）
    const sortedRecords = [...lentMoney].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedRecords.forEach(record => {
        const isOverdue = !record.returned && record.dueDate && new Date(record.dueDate) < new Date();
        const returnedClass = record.returned ? 'returned' : '';

        html += `
            <div class="lend-item ${returnedClass}">
                <div class="lend-info">
                    <h4>借给：${record.to}${isOverdue ? '<span class="overdue-tag">已逾期</span>' : ''}</h4>
                    <p>借出日期：${record.date}</p>
                    ${record.dueDate ? `<p>预计归还：${record.dueDate}</p>` : ''}
                    ${record.note ? `<p>备注：${record.note}</p>` : ''}
                    ${record.returned ? `<p style="color: #10b981;">✅ 已归还（${record.returnedDate}）</p>` : ''}
                </div>
                <div class="lend-amount">¥${record.amount.toFixed(2)}</div>
                <div class="lend-actions">
                    ${!record.returned ? `
                        <button class="btn-return" onclick="markAsReturned(${record.id}, 'lent')">已归还</button>
                        <button class="btn-remind" onclick="remindReturn(${record.id}, 'lent')">提醒</button>
                    ` : ''}
                    <button class="btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="deleteLendBorrow(${record.id}, 'lent')">删除</button>
                </div>
            </div>
        `;
    });

    lentList.innerHTML = html;
}

function displayBorrowedRecords() {
    const borrowedList = document.getElementById('borrowedList');
    if (!borrowedList) return;

    if (borrowedMoney.length === 0) {
        borrowedList.innerHTML = '<div class="empty-state"><p>暂无借入记录</p></div>';
        return;
    }

    // 计算统计数据
    const totalBorrowed = borrowedMoney.filter(b => !b.returned).reduce((sum, b) => sum + b.amount, 0);
    const totalRepaid = borrowedMoney.filter(b => b.returned).reduce((sum, b) => sum + b.amount, 0);
    const overdueCount = borrowedMoney.filter(b => !b.returned && b.dueDate && new Date(b.dueDate) < new Date()).length;

    let html = `
        <div class="borrow-summary">
            <div class="summary-item">
                <h4>未归还金额</h4>
                <div class="amount">¥${totalBorrowed.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <h4>已归还金额</h4>
                <div class="amount">¥${totalRepaid.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <h4>逾期笔数</h4>
                <div class="amount">${overdueCount}笔</div>
            </div>
        </div>
    `;

    // 按日期排序（最新的在前）
    const sortedRecords = [...borrowedMoney].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedRecords.forEach(record => {
        const isOverdue = !record.returned && record.dueDate && new Date(record.dueDate) < new Date();
        const returnedClass = record.returned ? 'returned' : '';

        html += `
            <div class="borrow-item ${returnedClass}">
                <div class="borrow-info">
                    <h4>从${record.from}借入${isOverdue ? '<span class="overdue-tag">已逾期</span>' : ''}</h4>
                    <p>借入日期：${record.date}</p>
                    ${record.dueDate ? `<p>预计归还：${record.dueDate}</p>` : ''}
                    ${record.note ? `<p>备注：${record.note}</p>` : ''}
                    ${record.returned ? `<p style="color: #10b981;">✅ 已归还（${record.returnedDate}）</p>` : ''}
                </div>
                <div class="borrow-amount">¥${record.amount.toFixed(2)}</div>
                <div class="borrow-actions">
                    ${!record.returned ? `
                        <button class="btn-return" onclick="markAsReturned(${record.id}, 'borrowed')">已归还</button>
                    ` : ''}
                    <button class="btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="deleteLendBorrow(${record.id}, 'borrowed')">删除</button>
                </div>
            </div>
        `;
    });

    borrowedList.innerHTML = html;
}

function markAsReturned(id, type) {
    const today = new Date().toISOString().split('T')[0];

    if (type === 'lent') {
        const record = lentMoney.find(r => r.id === id);
        if (record) {
            record.returned = true;
            record.returnedDate = today;
            displayLentRecords();
            showToast('✅ 已标记为归还');
        }
    } else if (type === 'borrowed') {
        const record = borrowedMoney.find(r => r.id === id);
        if (record) {
            record.returned = true;
            record.returnedDate = today;
            displayBorrowedRecords();
            showToast('✅ 已标记为归还');
        }
    }

    saveUserData();
}

function deleteLendBorrow(id, type) {
    if (!confirm('确定要删除这条记录吗？')) return;

    if (type === 'lent') {
        const index = lentMoney.findIndex(r => r.id === id);
        if (index !== -1) {
            lentMoney.splice(index, 1);
            displayLentRecords();
            showToast('✅ 记录已删除');
        }
    } else if (type === 'borrowed') {
        const index = borrowedMoney.findIndex(r => r.id === id);
        if (index !== -1) {
            borrowedMoney.splice(index, 1);
            displayBorrowedRecords();
            showToast('✅ 记录已删除');
        }
    }

    saveUserData();
}

function remindReturn(id, type) {
    const record = lentMoney.find(r => r.id === id);
    if (!record) return;

    // 这里可以集成提醒功能，如发送通知、短信等
    // 目前只是显示一个提示
    alert(`提醒${record.to}归还¥${record.amount.toFixed(2)}\n\n您可以通过微信、短信等方式提醒对方归还借款。`);
}

// ==================== 多币种功能 ====================

/**
 * 将任意币种金额转换为人民币
 */
function convertToCNY(amount, currency) {
    if (currency === 'CNY') return amount;
    // 从其他货币转换到CNY需要除以汇率
    return amount / exchangeRates[currency];
}

/**
 * 将人民币转换为任意币种
 */
function convertFromCNY(amountInCNY, targetCurrency) {
    if (targetCurrency === 'CNY') return amountInCNY;
    return amountInCNY * exchangeRates[targetCurrency];
}

/**
 * 在两种币种之间转换
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
    // 先转换为CNY，再转换为目标货币
    const amountInCNY = convertToCNY(amount, fromCurrency);
    return convertFromCNY(amountInCNY, toCurrency);
}

/**
 * 格式化显示金额（带币种符号）
 */
function formatCurrency(amount, currency = 'CNY') {
    const symbol = currencySymbols[currency] || '';
    return `${symbol}${amount.toFixed(2)}`;
}

/**
 * 切换汇率转换器显示
 */
function toggleCurrencyConverter() {
    const converter = document.getElementById('currencyConverter');
    if (converter.style.display === 'none') {
        converter.style.display = 'block';
    } else {
        converter.style.display = 'none';
    }
}

/**
 * 执行货币转换
 */
function performConversion() {
    const amount = parseFloat(document.getElementById('convertAmount').value);
    const fromCurrency = document.getElementById('convertFrom').value;
    const toCurrency = document.getElementById('convertTo').value;

    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额');
        return;
    }

    const result = convertCurrency(amount, fromCurrency, toCurrency);
    const resultEl = document.getElementById('converterResult');

    resultEl.innerHTML = `
        <span class="result-amount">${formatCurrency(result, toCurrency)}</span>
        <div style="font-size: 13px; margin-top: 8px; opacity: 0.9;">
            ${formatCurrency(amount, fromCurrency)} = ${formatCurrency(result, toCurrency)}
        </div>
    `;
}

/**
 * 获取多币种统计
 */
function getMultiCurrencyStats() {
    const stats = {};

    transactions.forEach(t => {
        const currency = t.currency || 'CNY';
        if (!stats[currency]) {
            stats[currency] = {
                income: 0,
                expense: 0,
                total: 0
            };
        }

        if (t.type === 'income') {
            stats[currency].income += t.amount;
            stats[currency].total += t.amount;
        } else {
            stats[currency].expense += t.amount;
            stats[currency].total -= t.amount;
        }
    });

    return stats;
}

// ==================== 自动分类学习系统 ====================

/**
 * 从交易备注中提取关键词
 */
function extractKeywords(note) {
    if (!note) return [];

    // 移除标点符号，转换为小写，分词
    const cleanNote = note.toLowerCase().replace(/[，。！？、,.!?]/g, ' ');
    const words = cleanNote.split(/\s+/).filter(w => w.length >= 2);

    return words;
}

/**
 * 记录用户的分类选择，用于机器学习
 */
function learnFromUserChoice(note, category, type) {
    if (!note || note.trim().length === 0) return;

    const keywords = extractKeywords(note);

    keywords.forEach(keyword => {
        if (!categoryLearningData[keyword]) {
            categoryLearningData[keyword] = {};
        }

        const key = `${type}_${category}`;
        if (!categoryLearningData[keyword][key]) {
            categoryLearningData[keyword][key] = {
                category: category,
                type: type,
                count: 0
            };
        }

        categoryLearningData[keyword][key].count++;
    });

    saveUserData();
}

/**
 * 基于学习数据预测分类
 */
function predictCategory(note) {
    if (!note || note.trim().length === 0) return null;

    const keywords = extractKeywords(note);
    const predictions = {};

    // 计算每个分类的得分
    keywords.forEach(keyword => {
        if (categoryLearningData[keyword]) {
            Object.values(categoryLearningData[keyword]).forEach(data => {
                const key = `${data.type}_${data.category}`;
                if (!predictions[key]) {
                    predictions[key] = {
                        category: data.category,
                        type: data.type,
                        score: 0
                    };
                }
                predictions[key].score += data.count;
            });
        }
    });

    // 找出得分最高的分类
    let bestPrediction = null;
    let maxScore = 0;

    Object.values(predictions).forEach(pred => {
        if (pred.score > maxScore) {
            maxScore = pred.score;
            bestPrediction = pred;
        }
    });

    // 只有在有足够信心时才返回预测（得分至少为2）
    if (bestPrediction && maxScore >= 2) {
        return bestPrediction;
    }

    return null;
}

/**
 * 获取学习系统统计信息
 */
function getLearningStats() {
    const totalKeywords = Object.keys(categoryLearningData).length;
    let totalLearningRecords = 0;

    Object.values(categoryLearningData).forEach(keywordData => {
        Object.values(keywordData).forEach(data => {
            totalLearningRecords += data.count;
        });
    });

    // 计算准确率（基于最近100笔交易）
    const recentTransactions = transactions.slice(-100);
    let correctPredictions = 0;
    let totalPredictions = 0;

    recentTransactions.forEach(t => {
        if (t.note && t.note.trim().length > 0) {
            const prediction = predictCategory(t.note);
            if (prediction) {
                totalPredictions++;
                if (prediction.category === t.category && prediction.type === t.type) {
                    correctPredictions++;
                }
            }
        }
    });

    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100) : 0;

    return {
        totalKeywords,
        totalLearningRecords,
        accuracy: accuracy.toFixed(1),
        correctPredictions,
        totalPredictions
    };
}

/**
 * 显示学习系统状态（可以添加到小记助手中）
 */
function displayLearningStatus() {
    const stats = getLearningStats();

    return `
📚 **分类学习系统状态**

🔤 已学习关键词：${stats.totalKeywords}个
📝 学习记录总数：${stats.totalLearningRecords}条
🎯 预测准确率：${stats.accuracy}% (基于最近${stats.totalPredictions}笔有备注的交易)
✅ 正确预测：${stats.correctPredictions}/${stats.totalPredictions}

系统会自动学习您的分类习惯，使用次数越多，准确率越高！
`;
}

// ==================== 智能短信/邮件自动记账 ====================

/**
 * 切换智能解析面板
 */
function toggleSmartParse() {
    const content = document.getElementById('smartParseContent');
    const btn = document.getElementById('toggleParseBtn');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = '收起';
    } else {
        content.style.display = 'none';
        btn.textContent = '展开';
    }
}

/**
 * 清空输入框
 */
function clearSmartInput() {
    document.getElementById('smsEmailInput').value = '';
    document.getElementById('parseResult').style.display = 'none';
}

/**
 * 使用AI解析短信/邮件内容
 */
async function parseSmartText() {
    const input = document.getElementById('smsEmailInput').value.trim();
    const resultDiv = document.getElementById('parseResult');

    if (!input) {
        alert('请输入短信或邮件内容');
        return;
    }

    showLoading('AI正在解析短信/邮件...');

    try {
        const prompt = `请解析以下银行短信或支付通知，提取交易信息。

内容：
${input}

请返回JSON数组格式，每个交易包含：
{
  "date": "YYYY-MM-DD格式日期（如果没有年份则使用当年）",
  "amount": 交易金额（数字）,
  "merchant": "商家名称",
  "type": "expense或income（根据是消费还是收入判断）",
  "category": "分类（从这些选择：餐饮、交通、购物、娱乐、医疗、教育、住房、工资、奖金、投资、兼职、礼金、其他）",
  "note": "备注说明"
}

如果有多笔交易，返回数组；如果只有一笔，也返回数组格式。
只返回JSON数组，不要其他解释。`;

        const systemPrompt = '你是一个专业的金融交易解析助手，擅长从短信和邮件中提取交易信息。';
        const result = await callDeepSeekAPI(prompt, systemPrompt);

        // 解析JSON
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const transactions = JSON.parse(jsonMatch[0]);
            displayParsedTransactions(transactions);
        } else {
            alert('AI无法解析该内容，请确保内容包含交易信息');
        }

    } catch (error) {
        console.error('解析失败:', error);
        alert('解析失败：' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * 显示解析结果
 */
function displayParsedTransactions(transactions) {
    const resultDiv = document.getElementById('parseResult');

    if (!transactions || transactions.length === 0) {
        alert('未能从内容中识别出交易信息');
        return;
    }

    let html = '<h4>✅ 识别到 ' + transactions.length + ' 笔交易</h4>';

    transactions.forEach((trans, index) => {
        html += `
            <div class="parsed-transaction">
                <div class="parsed-info">
                    <div class="parsed-field">
                        <span class="parsed-label">日期</span>
                        <span class="parsed-value">${trans.date}</span>
                    </div>
                    <div class="parsed-field">
                        <span class="parsed-label">金额</span>
                        <span class="parsed-value">¥${trans.amount.toFixed(2)}</span>
                    </div>
                    <div class="parsed-field">
                        <span class="parsed-label">类型</span>
                        <span class="parsed-value">${trans.type === 'income' ? '收入' : '支出'}</span>
                    </div>
                    <div class="parsed-field">
                        <span class="parsed-label">分类</span>
                        <span class="parsed-value">${trans.category}</span>
                    </div>
                    ${trans.merchant ? `
                    <div class="parsed-field">
                        <span class="parsed-label">商家</span>
                        <span class="parsed-value">${trans.merchant}</span>
                    </div>
                    ` : ''}
                    ${trans.note ? `
                    <div class="parsed-field">
                        <span class="parsed-label">备注</span>
                        <span class="parsed-value">${trans.note}</span>
                    </div>
                    ` : ''}
                </div>
                <button class="parse-confirm-btn" onclick='confirmParsedTransaction(${JSON.stringify(trans).replace(/'/g, "&apos;")})'>
                    ✓ 添加此交易
                </button>
            </div>
        `;
    });

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

/**
 * 确认并添加解析的交易
 */
function confirmParsedTransaction(trans) {
    const transaction = {
        id: Date.now(),
        type: trans.type,
        category: trans.category,
        amount: parseFloat(trans.amount),
        currency: 'CNY',
        date: trans.date,
        note: trans.note || (trans.merchant ? `${trans.merchant}` : '')
    };

    transactions.push(transaction);

    // 记录学习数据
    learnFromUserChoice(transaction.note, transaction.category, transaction.type);

    saveUserData();
    displayTransactions();
    updateDashboard();

    // 更新商家分析和日历
    analyzeMerchants();
    renderCalendar();

    showToast('✅ 交易已添加');

    // 清除输入和结果
    setTimeout(() => {
        clearSmartInput();
    }, 1000);
}

// ==================== 语音财务顾问 ====================

let voiceRecognition = null;
let voiceSynthesis = window.speechSynthesis;
let currentResponseText = '';
let isVoiceRecording = false;
let voiceAdvisorInitialized = false; // 标记是否已初始化

/**
 * 初始化语音识别
 */
function initVoiceRecognition() {
    // 防止重复初始化
    if (voiceAdvisorInitialized) {
        console.log('语音财务顾问已初始化，跳过重复初始化');
        return;
    }

    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('浏览器不支持语音识别');
        // 禁用语音按钮并显示提示
        const voiceBtn = document.getElementById('voiceAdvisorBtn');
        if (voiceBtn) {
            voiceBtn.disabled = true;
            voiceBtn.style.opacity = '0.5';
            voiceBtn.style.cursor = 'not-allowed';
        }
        updateVoiceStatus('浏览器不支持语音识别，请使用Chrome或Edge浏览器');
        return;
    }

    voiceRecognition = new SpeechRecognition();
    voiceRecognition.lang = 'zh-CN';
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = false;

    voiceRecognition.onstart = function() {
        updateVoiceStatus('正在聆听...');
    };

    voiceRecognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        updateVoiceStatus('识别成功！');

        // 显示识别结果
        const transcriptTextEl = document.getElementById('transcriptText');
        const voiceTranscriptEl = document.getElementById('voiceTranscript');
        if (transcriptTextEl && voiceTranscriptEl) {
            transcriptTextEl.textContent = transcript;
            voiceTranscriptEl.style.display = 'block';
        }

        // 发送给AI处理
        processVoiceQuestion(transcript);
    };

    voiceRecognition.onerror = function(event) {
        console.error('语音识别错误:', event.error);

        let errorMsg = '识别失败，请重试';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            errorMsg = '请允许麦克风权限';
        } else if (event.error === 'no-speech') {
            errorMsg = '没有检测到语音，请重试';
        } else if (event.error === 'network') {
            errorMsg = '网络错误，请检查网络连接';
        }

        updateVoiceStatus(errorMsg);
        const voiceBtn = document.getElementById('voiceAdvisorBtn') || document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
        }
        isVoiceRecording = false;
    };

    voiceRecognition.onend = function() {
        const voiceBtn = document.getElementById('voiceAdvisorBtn') || document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
        }
        isVoiceRecording = false;
    };

    // 添加按钮事件监听器
    const voiceBtn = document.getElementById('voiceAdvisorBtn');
    if (voiceBtn) {
        // 桌面端事件
        voiceBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startVoiceInput();
        });

        voiceBtn.addEventListener('mouseup', function(e) {
            e.preventDefault();
            stopVoiceInput();
        });

        // 移动端事件
        voiceBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startVoiceInput();
        });

        voiceBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            stopVoiceInput();
        });

        // 防止按钮拖动时意外离开
        voiceBtn.addEventListener('mouseleave', function(e) {
            if (isVoiceRecording) {
                stopVoiceInput();
            }
        });

        // 标记已初始化
        voiceAdvisorInitialized = true;
        console.log('语音财务顾问初始化成功');
    } else {
        console.error('未找到语音财务顾问按钮 (voiceAdvisorBtn)');
    }
}

/**
 * 开始语音输入
 */
function startVoiceInput() {
    if (!voiceRecognition) {
        alert('您的浏览器不支持语音识别功能\n\n推荐使用：\n- Chrome浏览器\n- Edge浏览器');
        return;
    }

    if (isVoiceRecording) return;

    isVoiceRecording = true;
    // 支持多个按钮ID
    const voiceBtn = document.getElementById('voiceAdvisorBtn') || document.getElementById('voiceBtn');
    const voiceTranscript = document.getElementById('voiceTranscript');
    const voiceResponse = document.getElementById('voiceResponse');

    if (voiceBtn) voiceBtn.classList.add('recording');
    if (voiceTranscript) voiceTranscript.style.display = 'none';
    if (voiceResponse) voiceResponse.style.display = 'none';

    try {
        voiceRecognition.start();
    } catch (error) {
        console.error('启动语音识别失败:', error);
        updateVoiceStatus('启动失败，请稍后重试');
        isVoiceRecording = false;
        if (voiceBtn) voiceBtn.classList.remove('recording');
    }
}

/**
 * 停止语音输入
 */
function stopVoiceInput() {
    if (voiceRecognition && isVoiceRecording) {
        voiceRecognition.stop();
    }
}

/**
 * 更新语音状态
 */
function updateVoiceStatus(status) {
    const statusEl = document.getElementById('voiceStatus');
    if (statusEl) {
        statusEl.textContent = status;
    }
}

/**
 * 处理语音问题
 */
async function processVoiceQuestion(question) {
    updateVoiceStatus('小记思考中...');

    try {
        // 构建财务上下文
        const stats = {
            totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + convertToCNY(t.amount, t.currency || 'CNY'), 0),
            totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + convertToCNY(t.amount, t.currency || 'CNY'), 0),
            transactionCount: transactions.length
        };

        const prompt = `用户财务数据：
总收入：¥${stats.totalIncome.toFixed(2)}
总支出：¥${stats.totalExpense.toFixed(2)}
交易笔数：${stats.transactionCount}笔

用户问题：${question}

请作为专业的AI财务顾问，用简洁、易懂的语言回答用户的问题。回答要自然、亲切，就像在和朋友聊天一样。回答控制在100字以内。`;

        const systemPrompt = '你是小记，一个友好、专业的AI财务顾问助手。你的回答要简洁、实用、易懂。';
        const response = await callDeepSeekAPI(prompt, systemPrompt);

        // 显示回复
        currentResponseText = response;
        const responseTextEl = document.getElementById('responseText');
        const voiceResponseEl = document.getElementById('voiceResponse');
        if (responseTextEl && voiceResponseEl) {
            responseTextEl.textContent = response;
            voiceResponseEl.style.display = 'block';
        }
        updateVoiceStatus('回复完成');

        // 语音播报回复
        speakText(response);

    } catch (error) {
        console.error('处理语音问题失败:', error);
        updateVoiceStatus('处理失败，请重试');

        // 根据错误类型提供不同的错误消息
        let errorMsg = '抱歉，我现在无法回答您的问题。';
        if (error.message.includes('API') || error.message.includes('请求失败')) {
            errorMsg = '抱歉，AI服务暂时不可用，请稍后再试。';
        } else if (error.message.includes('网络')) {
            errorMsg = '网络连接失败，请检查您的网络后重试。';
        }

        const responseTextEl = document.getElementById('responseText');
        const voiceResponseEl = document.getElementById('voiceResponse');
        if (responseTextEl && voiceResponseEl) {
            responseTextEl.textContent = errorMsg;
            voiceResponseEl.style.display = 'block';
        }

        // 语音播报错误信息
        speakText(errorMsg);
    }
}

/**
 * 语音播报文本
 */
function speakText(text) {
    // 停止当前播放
    voiceSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0; // 语速
    utterance.pitch = 1.0; // 音调
    utterance.volume = 1.0; // 音量

    utterance.onstart = function() {
        updateVoiceStatus('🔊 播放中...');
    };

    utterance.onend = function() {
        updateVoiceStatus('已完成');
    };

    utterance.onerror = function(event) {
        console.error('语音播报错误:', event);
        updateVoiceStatus('播报失败');
    };

    voiceSynthesis.speak(utterance);
}

/**
 * 重新播放回复
 */
function speakResponse() {
    if (currentResponseText) {
        speakText(currentResponseText);
    }
}

// ==================== 页面加载 ====================

window.addEventListener('DOMContentLoaded', function() {
    // 显示启动页面
    hideSplashScreen();

    initAuth();

    // 初始化语音识别（旧的，用于记账页面）
    initSpeechRecognition();

    // 注意：initVoiceRecognition() 现在在登录后的 initApp() 中调用
});

// ==================== AI智能命令系统 ====================

// AI对话历史
let aiCommandHistory = [];

/**
 * 快捷命令
 */
function sendQuickCommand(command) {
    document.getElementById('aiChatInput').value = command;
    sendAICommand();
}

/**
 * 发送AI命令
 */
async function sendAICommand() {
    const input = document.getElementById('aiChatInput');
    const userMessage = input.value.trim();

    if (!userMessage) return;

    // 添加用户消息到界面
    addChatMessage(userMessage, 'user');
    input.value = '';

    // 显示正在思考
    showAITyping();

    try {
        // 使用AI理解用户意图并执行操作
        await processAICommand(userMessage);
    } catch (error) {
        console.error('AI命令处理失败:', error);
        removeAITyping();
        addChatMessage('抱歉，我遇到了一些问题。请稍后再试。', 'ai', true);
    }
}

/**
 * 处理AI命令
 */
async function processAICommand(userMessage) {
    // 使用DeepSeek AI理解用户意图
    const intent = await analyzeUserIntent(userMessage);

    removeAITyping();

    // 根据意图执行相应操作
    const result = await executeCommand(intent);

    // 显示结果
    if (result.success) {
        addChatMessage(result.message, 'ai', false, result.data);
    } else {
        addChatMessage(result.message, 'ai', true);
    }
}

/**
 * 分析用户意图
 */
async function analyzeUserIntent(userMessage) {
    const apiKey = deepseekApiKey || DEFAULT_API_KEY;

    // 构建当前财务数据上下文
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

    const context = {
        totalTransactions: transactions.length,
        monthIncome: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        monthExpense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        budgetCount: budgets.length,
        savingsGoalCount: savingsGoals.length,
        accountCount: accounts.length,
        loanCount: loans.length
    };

    const systemPrompt = `你是小记AI助手的意图识别系统。分析用户的自然语言命令，识别用户想要执行的操作。

支持的操作类型：
1. ADD_TRANSACTION - 添加交易记录（收入或支出）
2. QUERY_STATS - 查询统计数据
3. MANAGE_BUDGET - 管理预算
4. MANAGE_SAVINGS - 管理储蓄目标
5. MANAGE_ACCOUNT - 管理账户
6. MANAGE_LOAN - 管理贷款
7. MANAGE_LEND_BORROW - 管理借贷
8. CREATE_SAVINGS_PLAN - 创建储蓄计划
9. GENERAL_QUERY - 一般性咨询

返回JSON格式：
{
  "intent": "操作类型",
  "parameters": {
    // 根据操作类型提取的参数
    // ADD_TRANSACTION: { type, category, amount, date, note }
    // QUERY_STATS: { type, period }
    // MANAGE_BUDGET: { action, category, amount }
    // MANAGE_SAVINGS: { action, name, target, current, deadline }
    // 等等
  },
  "confidence": 0.95
}

只返回JSON，不要其他解释。`;

    const prompt = `用户命令：${userMessage}

当前财务状况：
- 总交易记录：${context.totalTransactions}笔
- 本月收入：¥${context.monthIncome.toFixed(2)}
- 本月支出：¥${context.monthExpense.toFixed(2)}
- 预算数量：${context.budgetCount}个
- 储蓄目标：${context.savingsGoalCount}个
- 账户数量：${context.accountCount}个
- 贷款数量：${context.loanCount}个

请分析用户意图。`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        throw new Error('意图识别失败');
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;

    // 解析JSON
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error('无法解析意图');
}

/**
 * 执行命令
 */
async function executeCommand(intent) {
    try {
        switch (intent.intent) {
            case 'ADD_TRANSACTION':
                return await addTransactionCommand(intent.parameters);

            case 'QUERY_STATS':
                return queryStatsCommand(intent.parameters);

            case 'MANAGE_BUDGET':
                return manageBudgetCommand(intent.parameters);

            case 'MANAGE_SAVINGS':
                return manageSavingsCommand(intent.parameters);

            case 'MANAGE_ACCOUNT':
                return manageAccountCommand(intent.parameters);

            case 'MANAGE_LOAN':
                return manageLoanCommand(intent.parameters);

            case 'MANAGE_LEND_BORROW':
                return manageLendBorrowCommand(intent.parameters);

            case 'CREATE_SAVINGS_PLAN':
                return createSavingsPlanCommand(intent.parameters);

            case 'GENERAL_QUERY':
                return await generalQueryCommand(intent.parameters);

            default:
                return {
                    success: false,
                    message: '抱歉，我还不理解这个命令。请换一种说法试试。'
                };
        }
    } catch (error) {
        console.error('命令执行失败:', error);
        return {
            success: false,
            message: `执行失败：${error.message}`
        };
    }
}

/**
 * 添加交易命令
 */
async function addTransactionCommand(params) {
    // 验证必要参数
    if (!params.type || !params.category || !params.amount) {
        return {
            success: false,
            message: '信息不完整。请提供交易类型、分类和金额。例如：添加一笔100元的餐饮支出'
        };
    }

    // 创建交易
    const transaction = {
        id: Date.now(),
        type: params.type === '收入' || params.type === 'income' ? 'income' : 'expense',
        category: params.category,
        amount: parseFloat(params.amount),
        currency: 'CNY',
        date: params.date || new Date().toISOString().split('T')[0],
        note: params.note || ''
    };

    transactions.push(transaction);
    saveUserData();
    displayTransactions();
    updateDashboard();
    analyzeMerchants();
    renderCalendar();

    const typeText = transaction.type === 'income' ? '收入' : '支出';
    return {
        success: true,
        message: `✅ 已添加${typeText}记录：\n\n**${transaction.category}** - ¥${transaction.amount}\n日期：${transaction.date}${transaction.note ? '\n备注：' + transaction.note : ''}`,
        data: transaction
    };
}

/**
 * 查询统计命令
 */
function queryStatsCommand(params) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 本月数据
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    // 分类统计
    const categoryStats = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        categoryStats[t.category] = (categoryStats[t.category] || 0) + t.amount;
    });

    const topCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    let message = `📊 **本月财务统计**\n\n`;
    message += `💰 收入：¥${income.toFixed(2)}\n`;
    message += `💸 支出：¥${expense.toFixed(2)}\n`;
    message += `💎 结余：¥${balance.toFixed(2)}\n\n`;

    if (topCategories.length > 0) {
        message += `**主要支出分类：**\n`;
        topCategories.forEach(([cat, amount], index) => {
            const percent = (amount / expense * 100).toFixed(1);
            message += `${index + 1}. ${cat}：¥${amount.toFixed(2)} (${percent}%)\n`;
        });
    }

    return {
        success: true,
        message: message
    };
}

/**
 * 管理预算命令
 */
function manageBudgetCommand(params) {
    if (params.action === '查看' || params.action === 'view') {
        if (budgets.length === 0) {
            return {
                success: true,
                message: '您还没有设置预算。可以说"设置餐饮预算1000元"来创建预算。'
            };
        }

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        let message = '💰 **您的预算执行情况**\n\n';
        budgets.forEach(budget => {
            const spent = transactions
                .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + t.amount, 0);

            const percent = (spent / budget.amount * 100).toFixed(1);
            const status = spent > budget.amount ? '⚠️ 超支' : '✅ 正常';

            message += `**${budget.category}**\n`;
            message += `预算：¥${budget.amount} | 已用：¥${spent.toFixed(2)} (${percent}%) ${status}\n\n`;
        });

        return { success: true, message };
    }

    if (params.action === '设置' || params.action === 'set') {
        if (!params.category || !params.amount) {
            return {
                success: false,
                message: '请提供分类和金额。例如：设置餐饮预算1000元'
            };
        }

        const existingIndex = budgets.findIndex(b => b.category === params.category);
        if (existingIndex >= 0) {
            budgets[existingIndex].amount = parseFloat(params.amount);
        } else {
            budgets.push({
                category: params.category,
                amount: parseFloat(params.amount)
            });
        }

        saveUserData();
        displayBudgets();

        return {
            success: true,
            message: `✅ 已设置**${params.category}**预算为 ¥${params.amount}`
        };
    }

    return {
        success: false,
        message: '不支持的预算操作'
    };
}

/**
 * 管理储蓄目标命令
 */
function manageSavingsCommand(params) {
    if (params.action === '查看' || params.action === 'view') {
        if (savingsGoals.length === 0) {
            return {
                success: true,
                message: '您还没有储蓄目标。可以说"创建一个1万元的旅游基金目标"来设置。'
            };
        }

        let message = '🎯 **您的储蓄目标**\n\n';
        savingsGoals.forEach(goal => {
            const progress = (goal.current / goal.target * 100).toFixed(1);
            const remaining = goal.target - goal.current;

            message += `**${goal.name}**\n`;
            message += `目标：¥${goal.target} | 当前：¥${goal.current} (${progress}%)\n`;
            message += `还需：¥${remaining.toFixed(2)}\n`;
            if (goal.deadline) {
                message += `期限：${goal.deadline}\n`;
            }
            message += '\n';
        });

        return { success: true, message };
    }

    if (params.action === '创建' || params.action === 'create') {
        if (!params.name || !params.target) {
            return {
                success: false,
                message: '请提供目标名称和金额。例如：创建一个1万元的旅游基金目标'
            };
        }

        const goal = {
            id: Date.now(),
            name: params.name,
            target: parseFloat(params.target),
            current: parseFloat(params.current || 0),
            deadline: params.deadline || ''
        };

        savingsGoals.push(goal);
        saveUserData();
        displaySavings();

        return {
            success: true,
            message: `✅ 已创建储蓄目标：**${goal.name}**\n目标金额：¥${goal.target}${goal.deadline ? '\n期限：' + goal.deadline : ''}`
        };
    }

    return {
        success: false,
        message: '不支持的储蓄目标操作'
    };
}

/**
 * 管理账户命令
 */
function manageAccountCommand(params) {
    if (params.action === '查看' || params.action === 'view') {
        if (accounts.length === 0) {
            return {
                success: true,
                message: '您还没有添加账户。可以说"添加一个工商银行储蓄卡，余额5000元"'
            };
        }

        let message = '💳 **您的账户**\n\n';
        let total = 0;
        accounts.forEach(account => {
            message += `**${account.name}** (${account.type})\n`;
            message += `余额：¥${account.balance.toFixed(2)}\n\n`;
            total += account.balance;
        });
        message += `**总计：¥${total.toFixed(2)}**`;

        return { success: true, message };
    }

    // 添加账户
    if (params.action === '添加' || params.action === 'add') {
        if (!params.name || !params.balance) {
            return {
                success: false,
                message: '请提供账户名称和余额'
            };
        }

        const account = {
            id: Date.now(),
            name: params.name,
            type: params.type || '其他',
            balance: parseFloat(params.balance)
        };

        accounts.push(account);
        saveUserData();
        displayAccounts();
        updateDashboard();

        return {
            success: true,
            message: `✅ 已添加账户：**${account.name}**\n类型：${account.type}\n余额：¥${account.balance.toFixed(2)}`
        };
    }

    return {
        success: false,
        message: '不支持的账户操作'
    };
}

/**
 * 管理贷款命令
 */
function manageLoanCommand(params) {
    if (params.action === '查看' || params.action === 'view') {
        if (loans.length === 0) {
            return {
                success: true,
                message: '您没有贷款记录'
            };
        }

        let message = '🏦 **您的贷款**\n\n';
        loans.forEach(loan => {
            message += `**${loan.name}**\n`;
            message += `金额：¥${loan.amount.toFixed(2)}\n`;
            message += `利率：${loan.rate}%\n`;
            message += `月供：¥${loan.monthlyPayment.toFixed(2)}\n`;
            message += `期数：${loan.months}个月\n\n`;
        });

        return { success: true, message };
    }

    return {
        success: false,
        message: '不支持的贷款操作'
    };
}

/**
 * 管理借贷命令
 */
function manageLendBorrowCommand(params) {
    const type = params.type || 'lent';
    const records = type === 'lent' ? lentMoney : borrowedMoney;

    if (records.length === 0) {
        const typeText = type === 'lent' ? '借出' : '借入';
        return {
            success: true,
            message: `您没有${typeText}记录`
        };
    }

    const typeText = type === 'lent' ? '借出' : '借入';
    const personKey = type === 'lent' ? 'to' : 'from';

    let message = `💸 **您的${typeText}记录**\n\n`;
    let total = 0;
    records.forEach(record => {
        if (!record.returned) {
            message += `${record[personKey]}：¥${record.amount.toFixed(2)}\n`;
            message += `日期：${record.date}\n`;
            if (record.dueDate) {
                message += `预计归还：${record.dueDate}\n`;
            }
            message += '\n';
            total += record.amount;
        }
    });

    if (total > 0) {
        message += `**未归还总计：¥${total.toFixed(2)}**`;
    } else {
        message = `所有${typeText}都已归还！`;
    }

    return { success: true, message };
}

/**
 * 创建储蓄计划命令
 */
function createSavingsPlanCommand(params) {
    if (!params.name || !params.amount) {
        return {
            success: false,
            message: '请提供计划名称和目标金额。例如：创建买房储蓄计划，目标50万元，3年内完成'
        };
    }

    const plan = {
        id: Date.now(),
        name: params.name,
        targetAmount: parseFloat(params.amount),
        currentAmount: parseFloat(params.current || 0),
        deadline: params.deadline || '',
        icon: params.icon || '💰',
        createdDate: new Date().toISOString().split('T')[0]
    };

    savingsPlans.push(plan);
    saveUserData();
    displaySavingsPlans();

    return {
        success: true,
        message: `✅ 已创建储蓄计划：**${plan.name}**\n目标金额：¥${plan.targetAmount}${plan.deadline ? '\n期限：' + plan.deadline : ''}`
    };
}

/**
 * 一般性查询命令
 */
async function generalQueryCommand(params) {
    // 使用DeepSeek AI回答一般性问题
    const apiKey = deepseekApiKey || DEFAULT_API_KEY;

    const context = generateFinancialSummary();
    const prompt = `基于用户的财务数据回答问题：

用户财务概况：
- 本月收入：¥${context.currentMonth.income.toFixed(2)}
- 本月支出：¥${context.currentMonth.expense.toFixed(2)}
- 本月结余：¥${context.currentMonth.balance.toFixed(2)}
- 总资产：¥${context.totalAssets.toFixed(2)}

用户问题：${params.question || '如何改善财务状况？'}

请用简洁、友好的语言回答，给出实用的建议。`;

    const systemPrompt = '你是小记AI助手，一个专业的财务顾问。用简洁、实用的语言提供建议。';

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('AI响应失败');
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        return {
            success: true,
            message: answer
        };
    } catch (error) {
        return {
            success: false,
            message: '抱歉，AI服务暂时不可用'
        };
    }
}

/**
 * 添加聊天消息到界面
 */
function addChatMessage(message, sender, isError = false, data = null) {
    const messagesContainer = document.getElementById('aiChatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'ai-message user-message' : 'ai-message';

    const avatar = document.createElement('div');
    avatar.className = sender === 'user' ? 'ai-avatar user-avatar' : 'ai-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'ai-bubble user-bubble' : 'ai-bubble';

    if (isError) {
        bubble.classList.add('ai-action-error');
    }

    // 转换markdown格式
    const formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    bubble.innerHTML = formattedMessage;

    if (sender === 'user') {
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 保存到历史
    aiCommandHistory.push({ sender, message, timestamp: Date.now() });
}

/**
 * 显示AI正在输入
 */
function showAITyping() {
    const messagesContainer = document.getElementById('aiChatMessages');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message';
    typingDiv.id = 'aiTypingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = '🤖';

    const typingBubble = document.createElement('div');
    typingBubble.className = 'ai-typing';
    typingBubble.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingBubble);
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * 移除AI正在输入提示
 */
function removeAITyping() {
    const typingIndicator = document.getElementById('aiTypingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

