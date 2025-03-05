document.addEventListener('DOMContentLoaded', function() {
    // 初始化主要内容
    initMainContent();
    
    // 延迟加载非关键资源
    setTimeout(function() {
        loadNonCriticalResources();
    }, 1000);
});

function loadNonCriticalResources() {
    // 加载额外的图像和资源
    const additionalResources = [
        'assets/textures/clouds.jpg',
        'assets/textures/bump.jpg'
    ];
    
    additionalResources.forEach(resource => {
        const preloadLink = document.createElement('link');
        preloadLink.href = resource;
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        document.head.appendChild(preloadLink);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 初始化地球仪
    const globe = new Globe('globe-container');
    
    // 确保在地球加载完成后添加标签
    setTimeout(() => {
        globe.addHTMLCountryLabels();
    }, 2000);
    
    // 添加关闭按钮事件
    const infoPanel = document.getElementById('festival-info');
    document.getElementById('close-info').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        infoPanel.classList.add('hidden');
    });
    
    // 添加 ESC 键关闭功能
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            infoPanel.classList.add('hidden');
        }
    });
    
    // 点击弹出框外部关闭
    infoPanel.addEventListener('click', (e) => {
        if (e.target === this) {
            infoPanel.classList.add('hidden');
        }
    });

    // 添加月份选择事件
    document.getElementById('month-picker').addEventListener('change', (e) => {
        const selectedMonth = e.target.value;
        if (selectedMonth) {
            globe.showMonthlyFestivals(selectedMonth);
        }
    });
});

// 添加按类别过滤功能
function filterByCategory(category) {
    document.title = `${category} Festivals Around the World - Global Festivals Explorer`;
    // 实现过滤逻辑
    console.log(`Filtering by ${category} festivals`);
    // 这里可以添加实际的过滤功能
}

// 更新页面标题函数
function updatePageTitle(country, festival) {
    if (country && festival) {
        document.title = `${festival} - ${country} Festival | Global Festivals Explorer`;
    } else {
        document.title = "Global Festivals Explorer - Discover Cultural Celebrations Worldwide";
    }
}

// 在显示节日信息时调用
function showFestivalInfo(country, festival) {
    // 现有代码...
    updatePageTitle(country, festival.name);
}

// 在页面加载完成后预加载常用节日页面
window.addEventListener('load', () => {
    // 等待主页面完全加载后再预加载
    setTimeout(() => {
        preloadFestivalPages();
    }, 3000);
});

// 预加载常用节日页面
function preloadFestivalPages() {
    const pagesToPreload = [
        'festivals/chinese-spring-festival.html',
        'festivals/diwali.html',
        'festivals/rio-carnival.html'
    ];
    
    pagesToPreload.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        console.log(`预加载页面: ${url}`);
    });
} 