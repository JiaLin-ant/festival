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

// 添加页面标题动态更新，强化关键词
function updatePageTitle(country, festival) {
    if (country && festival) {
        document.title = `${festival} in ${country} - Worldwide Festivals Explorer`;
    } else {
        document.title = "Worldwide Festivals - Explore Cultural Celebrations Around the Globe";
    }
}

// 在显示节日信息时调用
function showFestivalInfo(country, festival) {
    // 现有代码...
    updatePageTitle(country, festival.name);
} 