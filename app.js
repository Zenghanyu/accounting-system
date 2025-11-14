// 全局变量
let currentUser = null;
let transactions = [];
let budgets = [];
let loans = [];
let recurringBills = [];
let savingsGoals = [];
let accounts = [];
let trendChart = null;
let categoryChart = null;
let deepseekApiKey = '';
let chatHistory = [];

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
            date: dateInput.value,
            note: document.getElementById('note').value
        };

        transactions.push(transaction);
        saveUserData();

        form.reset();
        dateInput.valueAsDate = new Date();
        updateCategories();
        displayTransactions();
        updateDashboard();

        alert('交易添加成功！');
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
    list.innerHTML = sortedTransactions.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="category">${t.category}</div>
                ${t.note ? `<div class="note">${t.note}</div>` : ''}
                <div class="date">${t.date}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}¥${t.amount.toFixed(2)}
            </div>
            <div class="transaction-actions">
                <button class="btn-delete" onclick="deleteTransaction(${t.id})">删除</button>
            </div>
        </div>
    `).join('');

    // 显示最近10条
    recentList.innerHTML = sortedTransactions.slice(0, 10).map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="category">${t.category}</div>
                ${t.note ? `<div class="note">${t.note}</div>` : ''}
                <div class="date">${t.date}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}¥${t.amount.toFixed(2)}
            </div>
        </div>
    `).join('');
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
}

function updateStats() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    document.getElementById('totalIncome').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `¥${expense.toFixed(2)}`;
    document.getElementById('balance').textContent = `¥${balance.toFixed(2)}`;
    document.getElementById('totalAssets').textContent = `¥${totalAssets.toFixed(2)}`;
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

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const expenseTransactions = transactions.filter(t =>
        t.type === 'expense' && t.date.startsWith(currentMonth)
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

async function callDeepSeekAPI(prompt) {
    if (!deepseekApiKey) {
        alert('请先设置DeepSeek API密钥！');
        throw new Error('未设置API密钥');
    }

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的个人财务分析助手，擅长分析用户的收支情况、消费习惯，并提供实用的理财建议。请用简洁、专业且易懂的语言回答。'
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
            const error = await response.json();
            throw new Error(error.error?.message || '请求失败');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API调用错误:', error);
        alert('AI分析失败：' + error.message);
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

// ==================== 页面加载 ====================

window.addEventListener('DOMContentLoaded', function() {
    initAuth();
});
