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
    }
];

const CONTRACT_ADDRESS = "0x166dd205590240c90ca4e0e545ad69db47d8f22f";

// Global variables
let web3;
let contract;
let userAccount;
let userInfo = {};

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const walletAddressSpan = document.getElementById('walletAddress');
const userInfoDiv = document.getElementById('userInfo');
const treeContainer = document.getElementById('treeContainer');
const currentUserIdSpan = document.getElementById('currentUserId');
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Initialize
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
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
        connectWalletBtn.textContent = 'کیف پول یافت نشد';
    }

    // Navigation event listeners
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            switchPage(pageId);
        });
    });
});

// Switch between pages
function switchPage(pageId) {
    // Update active nav button
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });

    // Show active page
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId + 'Page') {
            page.classList.add('active');
        }
    });

    // Load genealogy if switching to that page
    if (pageId === 'genealogy' && userInfo.id) {
        loadBinaryTree();
    }
}

// Connect wallet
connectWalletBtn.addEventListener('click', async () => {
    try {
        connectWalletBtn.textContent = 'در حال اتصال...';
        connectWalletBtn.disabled = true;
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        
        updateWalletUI();
        await loadUserInfo();
        
    } catch (error) {
        alert('خطا در اتصال کیف پول');
        connectWalletBtn.textContent = '🔗 اتصال کیف پول';
        connectWalletBtn.disabled = false;
    }
});

// Update wallet UI
function updateWalletUI() {
    const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);
    walletAddressSpan.textContent = shortAddress;
    connectWalletBtn.textContent = 'اتصال برقرار شد';
    connectWalletBtn.disabled = true;
}

// Load user info
async function loadUserInfo() {
    try {
        userInfoDiv.innerHTML = '<div class="loading">در حال بارگذاری اطلاعات کاربر</div>';
        
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
        
    } catch (error) {
        console.error('Error loading user info:', error);
        userInfoDiv.innerHTML = '<p>خطا در بارگذاری اطلاعات کاربر</p>';
    }
}

// Display user info
function displayUserInfo() {
    userInfoDiv.innerHTML = `
        <div class="info-item">
            <span class="info-label">شناسه کاربری:</span>
            <span class="info-value">${userInfo.id}</span>
        </div>
        <div class="info-item">
            <span class="info-label">شناسه آپلاین:</span>
            <span class="info-value">${userInfo.uplineId}</span>
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
            <span class="info-value">${userInfo.totalMinerRewards} MATIC</span>
        </div>
        <div class="info-item">
            <span class="info-label">قیمت ورود:</span>
            <span class="info-value">${userInfo.entryPrice} MATIC</span>
        </div>
        <div class="info-item">
            <span class="info-label">وضعیت ماینر:</span>
            <span class="info-value">${userInfo.isMiner ? '✅ فعال' : '❌ غیرفعال'}</span>
        </div>
    `;
}

// Load binary tree
async function loadBinaryTree() {
    try {
        treeContainer.innerHTML = '<div class="loading">در حال بارگذاری ژنولوژی شبکه...</div>';
        
        if (!userInfo.id) {
            throw new Error('User info not loaded');
        }

        const rootNode = await createBinaryNode(userInfo.id, true);
        renderBinaryTree(rootNode);
        
    } catch (error) {
        console.error('Error loading binary tree:', error);
        treeContainer.innerHTML = '<p>خطا در بارگذاری ژنولوژی</p>';
    }
}

// Create binary node recursively
async function createBinaryNode(userId, isCurrentUser = false) {
    if (!userId || userId === 0) {
        return null;
    }
    
    try {
        const userAddress = await getAddressForUser(userId);
        const userInfoData = await contract.methods.getUserInfo(userAddress).call();
        const directs = await contract.methods.getUserDirects(userId).call();
        
        const node = {
            id: Number(userId),
            uplineId: Number(userInfoData.uplineId),
            leftId: Number(directs.leftId),
            rightId: Number(directs.rightId),
            isCurrentUser: isCurrentUser,
            left: null,
            right: null
        };
        
        // Load children recursively
        if (node.leftId > 0) {
            node.left = await createBinaryNode(node.leftId);
        }
        
        if (node.rightId > 0) {
            node.right = await createBinaryNode(node.rightId);
        }
        
        return node;
        
    } catch (error) {
        console.log(`Error loading node ${userId}:`, error);
        return {
            id: Number(userId),
            uplineId: 0,
            leftId: 0,
            rightId: 0,
            isCurrentUser: isCurrentUser,
            left: null,
            right: null,
            error: true
        };
    }
}

// Get user address
async function getAddressForUser(userId) {
    if (userId === userInfo.id) {
        return userAccount;
    }
    return '0x0000000000000000000000000000000000000000';
}

// Render binary tree
function renderBinaryTree(rootNode) {
    const treeElement = document.createElement('div');
    treeElement.className = 'binary-tree';
    
    // Render root level
    const rootLevel = document.createElement('div');
    rootLevel.className = 'tree-level';
    
    const rootTreeNode = document.createElement('div');
    rootTreeNode.className = 'tree-node';
    rootTreeNode.appendChild(createTreeNode(rootNode));
    rootLevel.appendChild(rootTreeNode);
    
    treeElement.appendChild(rootLevel);
    
    // Render children if root has any
    if (rootNode.left || rootNode.right) {
        const childrenLevel = document.createElement('div');
        childrenLevel.className = 'tree-level';
        
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';
        
        if (rootNode.left) {
            const leftChild = createChildNode('left', rootNode.left);
            childrenContainer.appendChild(leftChild);
        }
        
        if (rootNode.right) {
            const rightChild = createChildNode('right', rootNode.right);
            childrenContainer.appendChild(rightChild);
        }
        
        childrenLevel.appendChild(childrenContainer);
        treeElement.appendChild(childrenLevel);
    }
    
    treeContainer.innerHTML = '';
    treeContainer.appendChild(treeElement);
}

// Create tree node
function createTreeNode(node) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    
    const nodeContent = document.createElement('div');
    nodeContent.className = `node-box ${node.isCurrentUser ? 'current-user' : ''}`;
    nodeContent.innerHTML = createNodeHTML(node);
    
    nodeElement.appendChild(nodeContent);
    
    // Add connector for non-root nodes
    if (!node.isCurrentUser) {
        const connector = document.createElement('div');
        connector.className = 'connector vertical';
        nodeElement.appendChild(connector);
    }
    
    return nodeElement;
}

// Create child node
function createChildNode(side, childNode) {
    const childElement = document.createElement('div');
    childElement.className = 'child-node';
    
    // Add horizontal connector
    const horizontalConnector = document.createElement('div');
    horizontalConnector.className = `connector horizontal-${side}`;
    childElement.appendChild(horizontalConnector);
    
    // Add vertical connector
    const verticalConnector = document.createElement('div');
    verticalConnector.className = 'connector vertical';
    childElement.appendChild(verticalConnector);
    
    // Add label
    const label = document.createElement('div');
    label.className = 'branch-label';
    label.textContent = side === 'left' ? '👈 چپ' : '👉 راست';
    childElement.appendChild(label);
    
    // Add node content
    if (childNode) {
        childElement.appendChild(createTreeNode(childNode));
    }
    
    return childElement;
}

// Create node HTML content
function createNodeHTML(node) {
    const badges = [];
    if (node.isCurrentUser) badges.push('<span class="badge">شما</span>');
    
    return `
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
}