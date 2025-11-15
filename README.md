# 💰 智能记账系统

一个功能完整的在线记账系统，支持多用户、数据可视化和AI智能分析。

## ✨ 功能特点

### 核心功能
- 🔐 **多用户系统** - 支持用户注册/登录，数据独立存储
- 💸 **收支管理** - 记录收入和支出，支持分类管理
- 📊 **数据可视化** - 收支趋势图、分类饼图
- 💰 **预算管理** - 设置分类预算，实时监控执行情况
- 🏦 **贷款管理** - 计算月供、总利息等
- 📅 **定期账单** - 管理定期支出（月/季/年）
- 🎯 **储蓄目标** - 设置储蓄目标，跟踪进度
- 💳 **多账户管理** - 管理现金、银行卡、支付宝等账户
- 📥 **数据导出** - 导出所有数据为JSON格式

### AI智能分析（需DeepSeek API）
- 📈 **财务分析** - AI分析收支状况，提供专业建议
- 🔍 **消费习惯** - 深度分析消费模式
- 💡 **节省建议** - 个性化省钱技巧
- 🔮 **财务预测** - 预测未来财务趋势
- 💬 **AI对话助手** - 随时咨询财务问题

### 🚀 智能记账功能（v2.0新增）
- 🎤 **语音记账** - 说话即可记账，AI自动识别金额和分类
- 📸 **票据扫描** - 拍照上传发票，自动识别并填充信息

## 🚀 部署方法

### 方案1：GitHub Pages（推荐）⭐

1. **创建GitHub仓库**
   - 访问 https://github.com/new
   - 仓库名：`accounting-system`
   - 设为Public

2. **上传文件**
   ```bash
   cd accounting-system
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/accounting-system.git
   git push -u origin main
   ```

3. **启用GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 `main` 分支
   - 点击 Save
   - 等待几分钟后访问：`https://你的用户名.github.io/accounting-system`

### 方案2：Vercel（最简单）

1. 访问 https://vercel.com
2. 用GitHub账号登录
3. 点击 "Import Project"
4. 选择您的GitHub仓库
5. 点击 "Deploy"
6. 部署完成，获得网址！

### 方案3：Netlify（拖拽上传）

1. 访问 https://netlify.com
2. 注册/登录账号
3. 将 `accounting-system` 文件夹直接拖到页面
4. 自动部署，获得网址！

### 方案4：本地测试

1. 双击打开 `index.html` 文件
2. 或使用本地服务器：
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (需安装 http-server)
   npx http-server
   ```
3. 访问 `http://localhost:8000`

## 📖 使用指南

### 1. 注册账号
- 首次使用点击"注册"
- 输入用户名和密码
- 注册后自动跳转登录

### 2. 添加交易
- 进入"记账"标签页
- 选择类型（收入/支出）
- 选择分类、输入金额
- 添加备注（可选）
- 点击"添加交易"

### 3. 查看统计
- "概览"页面显示月度统计
- 查看收支趋势图和分类图
- 查看最近交易记录

### 4. 设置AI分析
- 进入"AI分析"标签页
- 访问 https://platform.deepseek.com 注册账号
- 获取API Key
- 在系统中输入并保存
- 点击各种AI功能卡片体验智能分析

### 5. 使用智能记账（新功能）

**语音记账：**
- 点击"记账"页面的"点击开始语音记账"按钮
- 允许麦克风权限
- 说出记账内容，例如："今天买菜花了50块"
- AI自动识别并填充表单
- 核对后提交

**票据扫描：**
- 点击"上传票据图片"按钮
- 选择发票/小票照片
- 点击"开始识别"
- AI自动识别金额、商户、分类等信息
- 点击"填充到记账表单"后核对提交

> 详细使用说明请查看 `新功能使用说明.md`

## 🔧 技术栈

- **前端框架**: 纯HTML5 + CSS3 + JavaScript（无框架依赖）
- **数据存储**: localStorage（浏览器本地存储）
- **图表库**: Chart.js 4.4.0
- **AI服务**: DeepSeek API
- **语音识别**: Web Speech API（浏览器原生）
- **图像处理**: FileReader API + Base64编码

## 📝 注意事项

1. **数据安全**
   - 所有数据存储在浏览器本地
   - 不要清除浏览器缓存，否则数据会丢失
   - 建议定期使用"导出数据"功能备份

2. **API密钥**
   - DeepSeek API密钥存储在本地
   - 不要分享您的API密钥给他人
   - 如果密钥泄露，请立即在平台重置

3. **浏览器兼容性**
   - 推荐使用Chrome、Firefox、Edge最新版
   - 需支持ES6语法和localStorage

4. **多设备使用**
   - 数据存储在浏览器本地，不同设备/浏览器数据不互通
   - 如需多设备同步，需要自行备份导入数据

## 🌟 文件结构

```
accounting-system/
├── index.html          # 主页面
├── style.css          # 样式文件
├── app.js             # JavaScript逻辑
└── README.md          # 说明文档
```

## 📞 支持

如有问题或建议，欢迎反馈！

## 📄 开源协议

MIT License - 可自由使用和修改

---

**享受智能记账，掌控财务未来！** 💰✨
