// Contract ABI
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "getUserInfo",
        "outputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "uint256", "name": "uplineId", "type": "uint256"},
            {"internalType": "uint256", "name": "leftCount", "type": "uint256"},
            {"internalType": "uint256", "name": "rightCount", "type": "uint256"},
            {"internalType": "uint256", "name": "saveLeft", "type": "uint256"},
            {"internalType": "uint256", "name": "saveRight", "type": "uint256"},
            {"internalType": "uint256", "name": "balanceCount", "type": "uint256"},
            {"internalType": "uint256", "name": "specialBalanceCount", "type": "uint256"},
            {"internalType": "uint256", "name": "totalMinerRewards", "type": "uint256"},
            {"internalType": "uint256", "name": "entryPrice", "type": "uint256"},
            {"internalType": "bool", "name": "isMiner", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "userId", "type": "uint256"}],
        "name": "getUserDirects",
        "outputs": [
            {"internalType": "uint256", "name": "leftId", "type": "uint256"},
            {"internalType": "uint256", "name": "rightId", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalUsers",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

const CONTRACT_ADDRESS = "0x166dd205590240c90ca4e0e545ad69db47d8f22f";

// Global variables
let web3;
let contract;
let userAccount;
let userInfo = {};
let currentTreeStructure = {};

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const walletAddressSpan = document.getElementById('walletAddress');
const userInfoDiv = document.getElementById('userInfo');
const treeContainer = document.getElementById('treeContainer');
const currentUserIdSpan = document.getElementById('currentUserId');
const refreshDataBtn = document.getElementById('refreshData');
const loadingOverlay = document.getElementById('loadingOverlay');
const totalUsersSpan = document.getElementById('totalUsers');
const totalLevelsSpan = document.getElementById('totalLevels');
const totalNodesSpan = document.getElementById('totalNodes');
const currentLevelSpan = document.getElementById('currentLevel');

// Initialize
window.addEventListener('load', async () => {
    await initializeApp();
});

// Initialize Application
async function initializeApp() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        setupEventListeners();
        
        try {
            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                userAccount = accounts[0];
                updateWalletUI();
                await loadUserInfo();
            }
        } catch (error) {
            console.log('No connected accounts');
        }
    } else {
        connectWalletBtn.disabled = true;
        connectWalletBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>کیف پول یافت نشد</span>';
        showNotification('MetaMask یافت نشد! لطفاً MetaMask را نصب کنید.', 'error');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    refreshDataBtn.addEventListener('click', refreshData);
    
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Add view switching functionality here
        });
    });
    
    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length > 0) {
                userAccount = accounts[0];
                updateWalletUI();
                await loadUserInfo();
                showNotification('حساب کیف پول تغییر کرد', 'success');
            } else {
                handleDisconnect();
            }
        });
        
        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
        });
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        showLoading('در حال اتصال به کیف پول...');
        connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>در حال اتصال...</span>';
        connectWalletBtn.disabled = true;
        
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        userAccount = accounts[0];
        
        updateWalletUI();
        await loadUserInfo();
        
        showNotification('اتصال کیف پول با موفقیت انجام شد', 'success');
        
    } catch (error) {
        console.error('Wallet connection error:', error);
        let errorMessage = 'خطا در اتصال کیف پول';
        
        if (error.code === 4001) {
            errorMessage = 'اتصال توسط کاربر لغو شد';
        } else if (error.code === -32002) {
            errorMessage = 'درخواست اتصال در حال انجام است';
        }
        
        showNotification(errorMessage, 'error');
        connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i><span>اتصال کیف پول</span>';
        connectWalletBtn.disabled = false;
    } finally {
        hideLoading();
    }
}

// Handle Disconnect
function handleDisconnect() {
    userAccount = null;
    connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i><span>اتصال کیف پول</span>';
    connectWalletBtn.disabled = false;
    walletAddressSpan.innerHTML = '<i class="fas fa-plug"></i><span>اتصال برقرار نشده</span>';
    userInfoDiv.innerHTML = `
        <div class="empty-user-state">
            <i class="fas fa-wallet"></i>
            <p>لطفاً کیف پول خود را متصل کنید</p>
        </div>
    `;
    treeContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-network-wired"></i>
            </div>
            <h3>شبکه‌ای یافت نشد</h3>
            <p>پس از اتصال کیف پول، شبکه شما اینجا نمایش داده می‌شود</p>
        </div>
    `;
    resetStats();
    showNotification('اتصال کیف پول قطع شد', 'warning');
}

// Update Wallet UI
function updateWalletUI() {
    const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);
    walletAddressSpan.innerHTML = `<i class="fas fa-check-circle"></i><span>${shortAddress}</span>`;
    connectWalletBtn.innerHTML = '<i class="fas fa-check"></i><span>اتصال برقرار شد</span>';
    connectWalletBtn.disabled = true;
}

// Refresh Data
async function refreshData() {
    if (!userAccount) {
        showNotification('لطفاً ابتدا کیف پول خود را متصل کنید', 'warning');
        return;
    }
    
    try {
        refreshDataBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        await loadUserInfo();
        showNotification('اطلاعات با موفقیت به‌روزرسانی شد', 'success');
    } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('خطا در به‌روزرسانی اطلاعات', 'error');
    } finally {
        refreshDataBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    }
}

// Load User Info
async function loadUserInfo() {
    try {
        showLoading('در حال بارگذاری اطلاعات کاربر...');
        
        userInfoDiv.innerHTML = `
            <div class="info-item">
                <span class="info-label">در حال بارگذاری...</span>
                <span class="info-value">...</span>
            </div>
        `;
        
        const result = await contract.methods.getUserInfo(userAccount).call();
        
        userInfo = {
            id: Number(result.id),
            uplineId: Number(result.uplineId),
            leftCount: Number(result.leftCount),
            rightCount: Number(result.rightCount),
            saveLeft: Number(result.saveLeft),
            saveRight: Number(result.saveRight),
            balanceCount: Number(result.balanceCount),
            specialBalanceCount: Number(result.specialBalanceCount),
            totalMinerRewards: web3.utils.fromWei(result.totalMinerRewards, 'ether'),
            entryPrice: web3.utils.fromWei(result.entryPrice, 'ether'),
            isMiner: result.isMiner
        };
        
        displayUserInfo();
        currentUserIdSpan.textContent = userInfo.id;
        currentLevelSpan.textContent = '0'; // You might want to calculate this
        
        // Load network tree
        await loadCompleteNetwork();
        
        // Update stats
        await updateStats();
        
    } catch (error) {
        console.error('Error loading user info:', error);
        userInfoDiv.innerHTML = `
            <div class="empty-user-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>خطا در بارگذاری اطلاعات کاربر</p>
                <small>${error.message}</small>
            </div>
        `;
        showNotification('خطا در بارگذاری اطلاعات کاربر', 'error');
    } finally {
        hideLoading();
    }
}

// Display User Info
function displayUserInfo() {
    userInfoDiv.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">شناسه کاربری:</span>
                <span class="info-value">${userInfo.id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">شناسه آپلاین:</span>
                <span class="info-value">${userInfo.uplineId || '---'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">تعداد چپ:</span>
                <span class="info-value">${userInfo.leftCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">تعداد راست:</span>
                <span class="info-value">${userInfo.rightCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">ذخیره چپ:</span>
                <span class="info-value">${userInfo.saveLeft}</span>
            </div>
            <div class="info-item">
                <span class="info-label">ذخیره راست:</span>
                <span class="info-value">${userInfo.saveRight}</span>
            </div>
            <div class="info-item">
                <span class="info-label">تعداد بالانس:</span>
                <span class="info-value">${userInfo.balanceCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">بالانس ویژه:</span>
                <span class="info-value">${userInfo.specialBalanceCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">پاداش ماینر:</span>
                <span class="info-value">${parseFloat(userInfo.totalMinerRewards).toFixed(4)} MATIC</span>
            </div>
            <div class="info-item">
                <span class="info-label">قیمت ورود:</span>
                <span class="info-value">${parseFloat(userInfo.entryPrice).toFixed(4)} MATIC</span>
            </div>
            <div class="info-item">
                <span class="info-label">وضعیت ماینر:</span>
                <span class="info-value">${userInfo.isMiner ? '✅ فعال' : '❌ غیرفعال'}</span>
            </div>
        </div>
    `;
}

// Update Statistics
async function updateStats() {
    try {
        if (contract.methods.totalUsers) {
            const totalUsers = await contract.methods.totalUsers().call();
            totalUsersSpan.textContent = Number(totalUsers).toLocaleString();
        }
        
        // Calculate levels and nodes from current tree
        const levels = new Set();
        Object.values(currentTreeStructure).forEach(node => {
            levels.add(node.level);
        });
        
        totalLevelsSpan.textContent = levels.size;
        totalNodesSpan.textContent = Object.keys(currentTreeStructure).length;
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Load Complete Network
async function loadCompleteNetwork() {
    try {
        showLoading('در حال بارگذاری شبکه زیرمجموعه...');
        
        if (!userInfo.id) {
            throw new Error('User info not loaded');
        }

        currentTreeStructure = await buildCompleteTree(userInfo.id);
        renderCompleteTree(currentTreeStructure);
        
    } catch (error) {
        console.error('Error loading network:', error);
        treeContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>خطا در بارگذاری شبکه</h3>
                <p>${error.message}</p>
            </div>
        `;
        showNotification('خطا در بارگذاری شبکه', 'error');
    } finally {
        hideLoading();
    }
}

// Build Complete Tree
async function buildCompleteTree(rootId) {
    const queue = [];
    const tree = {};
    let processedCount = 0;
    const maxProcess = 1000;
    
    queue.push({ id: rootId, level: 0 });
    
    while (queue.length > 0 && processedCount < maxProcess) {
        const { id, level } = queue.shift();
        
        if (tree[id]) continue;
        
        try {
            const userAddress = await getAddressForUser(id);
            const userInfoData = await contract.methods.getUserInfo(userAddress).call();
            const directs = await contract.methods.getUserDirects(id).call();
            
            tree[id] = {
                id: Number(id),
                uplineId: Number(userInfoData.uplineId),
                leftId: Number(directs.leftId),
                rightId: Number(directs.rightId),
                isCurrentUser: id === userInfo.id,
                level: level,
                hasChildren: (directs.leftId > 0 || directs.rightId > 0),
                leftCount: Number(userInfoData.leftCount),
                rightCount: Number(userInfoData.rightCount)
            };
            
            processedCount++;
            
            if (directs.leftId > 0 && !tree[directs.leftId]) {
                queue.push({ id: directs.leftId, level: level + 1 });
            }
            if (directs.rightId > 0 && !tree[directs.rightId]) {
                queue.push({ id: directs.rightId, level: level + 1 });
            }
            
        } catch (error) {
            console.log(`Error loading user ${id}:`, error);
            tree[id] = {
                id: Number(id),
                uplineId: 0,
                leftId: 0,
                rightId: 0,
                isCurrentUser: id === userInfo.id,
                level: level,
                hasChildren: false,
                error: true
            };
        }
        
        if (processedCount % 10 === 0) {
            updateProgress(processedCount);
        }
    }
    
    console.log(`Total nodes processed: ${processedCount}`);
    return tree;
}

// Get Address for User
async function getAddressForUser(userId) {
    if (userId === userInfo.id) {
        return userAccount;
    }
    return '0x0000000000000000000000000000000000000000';
}

// Update Progress
function updateProgress(count) {
    const loadingElement = document.querySelector('.loading-content p');
    if (loadingElement) {
        loadingElement.textContent = `در حال بارگذاری... (${count} کاربر لود شد)`;
    }
}

// Render Complete Tree
function renderCompleteTree(treeStructure) {
    const treeElement = document.createElement('div');
    treeElement.className = 'binary-tree';
    
    // Group nodes by level
    const levels = {};
    Object.values(treeStructure).forEach(node => {
        if (!levels[node.level]) {
            levels[node.level] = [];
        }
        levels[node.level].push(node);
    });
    
    // Render levels in order
    const sortedLevels = Object.keys(levels).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
        // Create level
        const levelElement = document.createElement('div');
        levelElement.className = 'tree-level';
        levelElement.setAttribute('data-level', level);
        
        // Add level header
        const levelHeader = document.createElement('div');
        levelHeader.className = 'level-header';
        levelHeader.innerHTML = `<span class="level-badge">سطح ${level}</span>`;
        levelElement.appendChild(levelHeader);
        
        // Create container for nodes in this level
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'level-nodes';
        
        // Sort nodes by ID for organized display
        levels[level].sort((a, b) => a.id - b.id).forEach(node => {
            const nodeElement = createNodeElement(node);
            nodesContainer.appendChild(nodeElement);
        });
        
        levelElement.appendChild(nodesContainer);
        treeElement.appendChild(levelElement);
        
        // Add connector between levels
        if (level < sortedLevels[sortedLevels.length - 1]) {
            const connectorLevel = createConnectorLevel(levels[level], treeStructure);
            treeElement.appendChild(connectorLevel);
        }
    });
    
    treeContainer.innerHTML = '';
    treeContainer.appendChild(treeElement);
}

// Create Node Element
function createNodeElement(node) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.setAttribute('data-user-id', node.id);
    
    const nodeBox = document.createElement('div');
    nodeBox.className = `node-box ${node.isCurrentUser ? 'current-user' : ''} ${node.error ? 'error-node' : ''}`;
    
    const badges = [];
    if (node.isCurrentUser) badges.push('<span class="badge current-badge">شما</span>');
    if (node.error) badges.push('<span class="badge error-badge">خطا</span>');
    
    nodeBox.innerHTML = `
        <div class="node-header">
            <div class="node-id">${node.id}</div>
            <div class="node-badges">${badges.join('')}</div>
        </div>
        <div class="node-info">
            <div class="info-line">
                <span class="info-label">آپلاین:</span>
                <span class="info-value">${node.uplineId || '---'}</span>
            </div>
            <div class="info-line">
                <span class="info-label">چپ:</span>
                <span class="info-value">${node.leftId || '---'}</span>
            </div>
            <div class="info-line">
                <span class="info-label">راست:</span>
                <span class="info-value">${node.rightId || '---'}</span>
            </div>
        </div>
    `;
    
    nodeElement.appendChild(nodeBox);
    return nodeElement;
}

// Create Connector Level
function createConnectorLevel(parentNodes, treeStructure) {
    const connectorLevel = document.createElement('div');
    connectorLevel.className = 'connector-level';
    
    const connectorsContainer = document.createElement('div');
    connectorsContainer.className = 'connectors-container';
    
    parentNodes.forEach(parentNode => {
        if (!parentNode.hasChildren) return;
        
        const parentConnectors = document.createElement('div');
        parentConnectors.className = 'parent-connectors';
        parentConnectors.setAttribute('data-parent-id', parentNode.id);
        
        if (parentNode.leftId > 0 && treeStructure[parentNode.leftId]) {
            const leftConnector = document.createElement('div');
            leftConnector.className = 'branch-connector left-connector';
            leftConnector.innerHTML = `
                <div class="connector-line"></div>
                <div class="branch-label">👈 ${parentNode.leftId}</div>
            `;
            parentConnectors.appendChild(leftConnector);
        }
        
        if (parentNode.rightId > 0 && treeStructure[parentNode.rightId]) {
            const rightConnector = document.createElement('div');
            rightConnector.className = 'branch-connector right-connector';
            rightConnector.innerHTML = `
                <div class="connector-line"></div>
                <div class="branch-label">👉 ${parentNode.rightId}</div>
            `;
            parentConnectors.appendChild(rightConnector);
        }
        
        if (parentConnectors.children.length > 0) {
            connectorsContainer.appendChild(parentConnectors);
        }
    });
    
    connectorLevel.appendChild(connectorsContainer);
    return connectorLevel;
}

// Utility Functions
function showLoading(message = 'در حال بارگذاری...') {
    const loadingText = loadingOverlay.querySelector('p');
    loadingText.textContent = message;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles for notification
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 1001;
                transform: translateY(-100px);
                opacity: 0;
                transition: all 0.3s ease;
                border-right: 4px solid var(--primary);
            }
            .notification-success { border-right-color: var(--success); }
            .notification-error { border-right-color: var(--danger); }
            .notification-warning { border-right-color: var(--warning); }
            .notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
            }
            .notification-success i { color: var(--success); }
            .notification-error i { color: var(--danger); }
            .notification-warning i { color: var(--warning); }
            .notification-info i { color: var(--primary); }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function resetStats() {
    totalUsersSpan.textContent = '0';
    totalLevelsSpan.textContent = '0';
    totalNodesSpan.textContent = '0';
    currentLevelSpan.textContent = '0';
}

// Add click handlers for nodes
document.addEventListener('click', function(e) {
    const nodeBox = e.target.closest('.node-box');
    if (nodeBox) {
        const userId = nodeBox.closest('.tree-node').getAttribute('data-user-id');
        showNotification(`نود ${userId} انتخاب شد`, 'info');
    }
});