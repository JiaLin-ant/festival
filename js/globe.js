class Globe {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.markers = [];
        this.markerObjects = [];
        this.countries = {};  // 存储国家数据
        
        this.init();
    }
    
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            45, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x121212);
        this.container.appendChild(this.renderer.domElement);
        
        // 添加控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 10;
        
        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);
        
        // 加载地球纹理
        const textureLoader = new THREE.TextureLoader();
        
        // 地球
        const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
        
        // 尝试加载纹理，如果失败则使用纯色
        textureLoader.load('assets/textures/earth.jpg', 
            // 成功加载
            earthTexture => {
                textureLoader.load('assets/textures/bump.jpg', 
                    // 成功加载凹凸纹理
                    bumpTexture => {
                        const earthMaterial = new THREE.MeshPhongMaterial({
                            map: earthTexture,
                            bumpMap: bumpTexture,
                            bumpScale: 0.05,
                            specular: new THREE.Color(0x333333),
                            shininess: 5
                        });
                        
                        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
                        this.scene.add(this.earth);
                        
                        // 添加云层
                        textureLoader.load('assets/textures/clouds.jpg', 
                            // 成功加载云层
                            cloudsTexture => {
                                const cloudsGeometry = new THREE.SphereGeometry(2.05, 64, 64);
                                const cloudsMaterial = new THREE.MeshPhongMaterial({
                                    map: cloudsTexture,
                                    transparent: true,
                                    opacity: 0.4
                                });
                                
                                this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
                                this.scene.add(this.clouds);
                                
                                // 加载国家数据
                                this.loadCountryData();
                            },
                            // 云层加载失败
                            undefined,
                            () => {
                                console.warn('无法加载云层纹理，使用无云层版本');
                                // 加载国家数据
                                this.loadCountryData();
                            }
                        );
                    },
                    // 凹凸纹理加载失败
                    undefined,
                    () => {
                        // 使用无凹凸纹理版本
                        const earthMaterial = new THREE.MeshPhongMaterial({
                            map: earthTexture,
                            specular: new THREE.Color(0x333333),
                            shininess: 5
                        });
                        
                        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
                        this.scene.add(this.earth);
                        
                        // 加载国家数据
                        this.loadCountryData();
                    }
                );
            },
            // 纹理加载进度
            undefined,
            // 纹理加载失败
            () => {
                console.warn('无法加载地球纹理，使用纯色替代');
                const earthMaterial = new THREE.MeshPhongMaterial({
                    color: 0x2233ff,
                    specular: new THREE.Color(0x333333),
                    shininess: 5
                });
                
                this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
                this.scene.add(this.earth);
                
                // 加载国家数据
                this.loadCountryData();
            }
        );
        
        // 添加星空背景
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05
        });
        
        const starsVertices = [];
        for (let i = 0; i < 5000; i++) {
            const x = THREE.MathUtils.randFloatSpread(200);
            const y = THREE.MathUtils.randFloatSpread(200);
            const z = THREE.MathUtils.randFloatSpread(200);
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
        
        // 响应窗口大小变化
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // 添加点击事件
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.renderer.domElement.addEventListener('click', this.onGlobeClick.bind(this));
        
        // 开始动画
        this.animate();
    }
    
    // 加载国家数据
    loadCountryData() {
        // 辅助函数：将日期字符串转换为可比较的数字
        const dateToNumber = (dateStr) => {
            const [month, day] = dateStr.split('-').map(Number);
            return month * 100 + day;
        };

        // 辅助函数：对节日数组进行排序
        const sortFestivals = (festivals) => {
            return festivals.sort((a, b) => dateToNumber(a.date) - dateToNumber(b.date));
        };

        this.countries = {
            "China": {
                center: { lat: 35.8617, lon: 104.1954 },
                bounds: { minLat: 18.0, maxLat: 53.5, minLon: 73.0, maxLon: 135.0 },
                festivals: sortFestivals([
                    { name: "Spring Festival", date: "01-22", category: "Cultural", description: "The most important traditional festival in China, celebrating lunar new year with family reunions" },
                    { name: "Lantern Festival", date: "02-15", category: "Traditional", description: "Marks the end of Spring Festival with lantern displays and riddles" },
                    { name: "Tomb Sweeping Day", date: "03-05", category: "Traditional", description: "Day to honor ancestors and visit family graves" },
                    { name: "Peach Blossom Festival", date: "04-03", category: "Cultural", description: "Celebration of spring and flowers blooming" },
                    { name: "Dragon Boat Festival", date: "05-22", category: "Cultural", description: "Commemorates Qu Yuan with dragon boat racing and rice dumplings" },
                    { name: "Summer Solstice", date: "06-21", category: "Traditional", description: "Traditional celebration of the longest day" },
                    { name: "Chinese Valentine's Day", date: "07-07", category: "Traditional", description: "Qixi Festival celebrating the meeting of the Cowherd and Weaver Girl" },
                    { name: "Ghost Festival", date: "08-15", category: "Religious", description: "Buddhist festival honoring ancestors and deceased family members" },
                    { name: "Mid-Autumn Festival", date: "09-15", category: "Traditional", description: "Moon viewing festival with mooncakes and family gatherings" },
                    { name: "National Day", date: "10-01", category: "National", description: "Celebrates the founding of the People's Republic of China" },
                    { name: "Double Eleven", date: "11-11", category: "Modern", description: "Modern shopping festival and singles' day celebration" },
                    { name: "Winter Solstice", date: "12-22", category: "Traditional", description: "Traditional festival celebrating the shortest day with family gatherings" }
                ])
            },
            "Japan": {
                center: { lat: 36.2048, lon: 138.2529 },
                bounds: { minLat: 24.0, maxLat: 45.5, minLon: 122.9, maxLon: 153.9 },
                festivals: sortFestivals([
                    { name: "Shogatsu", date: "01-01", category: "Cultural", description: "Japanese New Year celebration with shrine visits and special foods" },
                    { name: "Setsubun", date: "02-03", category: "Traditional", description: "Bean-throwing festival to drive away evil spirits" },
                    { name: "Hinamatsuri", date: "03-03", category: "Cultural", description: "Girls' Day festival with doll displays" },
                    { name: "Hanami", date: "04-01", category: "Cultural", description: "Cherry blossom viewing festival with outdoor parties" },
                    { name: "Children's Day", date: "05-05", category: "National", description: "Celebration of children with carp streamers" },
                    { name: "Tanabata", date: "06-07", category: "Cultural", description: "Star Festival with wishes written on colorful papers" },
                    { name: "Gion Festival", date: "07-17", category: "Traditional", description: "Month-long festival in Kyoto with grand processions" },
                    { name: "Obon", date: "08-15", category: "Religious", description: "Buddhist festival honoring ancestral spirits" },
                    { name: "Tsukimi", date: "09-15", category: "Traditional", description: "Moon viewing festival with special dumplings" },
                    { name: "Shichi-Go-San", date: "10-15", category: "Cultural", description: "Children's growth and health celebration" },
                    { name: "Labor Thanksgiving", date: "11-23", category: "National", description: "Celebrating labor and production" },
                    { name: "Emperor's Birthday", date: "12-23", category: "National", description: "National holiday celebrating the Emperor's birthday" }
                ])
            },
            "United States": {
                center: { lat: 37.0902, lon: -95.7129 },
                bounds: { minLat: 24.396308, maxLat: 49.384358, minLon: -125.000000, maxLon: -66.934570 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Celebration of the new year with parties and resolutions" },
                    { name: "Valentine's Day", date: "02-14", category: "Cultural", description: "Celebration of love and romance" },
                    { name: "St. Patrick's Day", date: "03-17", category: "Cultural", description: "Irish-American cultural celebration" },
                    { name: "Easter", date: "04-09", category: "Religious", description: "Christian celebration with egg hunts and family gatherings" },
                    { name: "Memorial Day", date: "05-30", category: "National", description: "Remembering those who died in military service" },
                    { name: "Juneteenth", date: "06-19", category: "National", description: "Commemorating the emancipation of enslaved African Americans" },
                    { name: "Independence Day", date: "07-04", category: "National", description: "Celebration of American independence with fireworks and parades" },
                    { name: "Labor Day", date: "08-01", category: "National", description: "Honoring the American labor movement" },
                    { name: "Hispanic Heritage Month", date: "09-15", category: "Cultural", description: "Celebrating Hispanic and Latino American culture" },
                    { name: "Halloween", date: "10-31", category: "Cultural", description: "Festival of costumes and trick-or-treating" },
                    { name: "Thanksgiving", date: "11-24", category: "Traditional", description: "Traditional harvest festival and family gathering" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Christian celebration and cultural holiday" }
                ])
            },
            "United Kingdom": {
                center: { lat: 55.3781, lon: -3.4360 },
                bounds: { minLat: 49.892485, maxLat: 60.856553, minLon: -7.641308, maxLon: 1.759000 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Welcoming the new year with celebrations" },
                    { name: "Pancake Day", date: "02-21", category: "Traditional", description: "Traditional feast day before Lent" },
                    { name: "St. Patrick's Day", date: "03-17", category: "Cultural", description: "Celebration of Irish heritage" },
                    { name: "Easter Monday", date: "04-10", category: "Religious", description: "Public holiday following Easter Sunday" },
                    { name: "May Day", date: "05-01", category: "Traditional", description: "Spring festival with maypole dancing" },
                    { name: "Queen's Birthday", date: "06-10", category: "National", description: "Official celebration of the monarch's birthday" },
                    { name: "Wimbledon", date: "07-03", category: "Cultural", description: "World's oldest tennis tournament" },
                    { name: "Edinburgh Festival", date: "08-05", category: "Cultural", description: "World's largest arts festival" },
                    { name: "Harvest Festival", date: "09-23", category: "Traditional", description: "Traditional celebration of the harvest" },
                    { name: "Halloween", date: "10-31", category: "Cultural", description: "Celtic tradition with costumes and treats" },
                    { name: "Guy Fawkes Night", date: "11-05", category: "Traditional", description: "Bonfire and fireworks celebrations" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Christian celebration and national holiday" }
                ])
            },
            "India": {
                center: { lat: 20.5937, lon: 78.9629 },
                bounds: { minLat: 8.4, maxLat: 37.6, minLon: 68.7, maxLon: 97.25 },
                festivals: sortFestivals([
                    { name: "Makar Sankranti", date: "01-14", category: "Traditional", description: "Harvest festival celebrated across India" },
                    { name: "Vasant Panchami", date: "02-16", category: "Religious", description: "Festival honoring Goddess Saraswati" },
                    { name: "Holi", date: "03-08", category: "Cultural", description: "Festival of colors and spring" },
                    { name: "Ram Navami", date: "04-10", category: "Religious", description: "Celebration of Lord Rama's birth" },
                    { name: "Buddha Purnima", date: "05-05", category: "Religious", description: "Buddha's birthday celebration" },
                    { name: "Rath Yatra", date: "06-20", category: "Religious", description: "Chariot festival of Lord Jagannath" },
                    { name: "Raksha Bandhan", date: "07-30", category: "Traditional", description: "Festival celebrating sibling bonds" },
                    { name: "Independence Day", date: "08-15", category: "National", description: "Celebration of Indian independence" },
                    { name: "Ganesh Chaturthi", date: "09-19", category: "Religious", description: "Festival honoring Lord Ganesha" },
                    { name: "Dussehra", date: "10-15", category: "Religious", description: "Celebration of good over evil" },
                    { name: "Diwali", date: "11-12", category: "Religious", description: "Festival of lights" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Christian celebration in India" }
                ])
            },
            "France": {
                center: { lat: 46.2276, lon: 2.2137 },
                bounds: { minLat: 41.3423, maxLat: 51.0891, minLon: -5.1389, maxLon: 9.5596 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Celebrating the new year with family and friends" },
                    { name: "Mardi Gras", date: "02-21", category: "Cultural", description: "Carnival celebrations before Lent" },
                    { name: "International Francophonie Day", date: "03-20", category: "Cultural", description: "Celebrating French language and culture" },
                    { name: "Easter Monday", date: "04-10", category: "Religious", description: "Christian celebration following Easter Sunday" },
                    { name: "Labor Day", date: "05-01", category: "National", description: "International Workers' Day" },
                    { name: "Music Festival", date: "06-21", category: "Cultural", description: "Nationwide celebration of music" },
                    { name: "Bastille Day", date: "07-14", category: "National", description: "French National Day with parades and fireworks" },
                    { name: "Assumption Day", date: "08-15", category: "Religious", description: "Catholic celebration of the Virgin Mary" },
                    { name: "Wine Harvest", date: "09-15", category: "Cultural", description: "Celebrating wine production across France" },
                    { name: "Nuit Blanche", date: "10-07", category: "Cultural", description: "All-night arts festival in Paris" },
                    { name: "Armistice Day", date: "11-11", category: "National", description: "Commemorating the end of WWI" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Christian celebration with festive markets" }
                ])
            },
            "Germany": {
                center: { lat: 51.1657, lon: 10.4515 },
                bounds: { minLat: 47.2701, maxLat: 55.0581, minLon: 5.8663, maxLon: 15.0419 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Celebrating the new year with fireworks" },
                    { name: "Carnival", date: "02-20", category: "Cultural", description: "Major carnival celebrations in many cities" },
                    { name: "Spring Festival", date: "03-20", category: "Cultural", description: "Celebrating the arrival of spring" },
                    { name: "Easter", date: "04-09", category: "Religious", description: "Christian celebration with Easter eggs and family gatherings" },
                    { name: "May Day", date: "05-01", category: "National", description: "Labor Day celebrations with maypoles" },
                    { name: "Bach Festival", date: "06-09", category: "Cultural", description: "Celebrating the music of Johann Sebastian Bach" },
                    { name: "Christopher Street Day", date: "07-22", category: "Cultural", description: "LGBTQ+ pride celebrations across Germany" },
                    { name: "Friedensfest", date: "08-08", category: "Religious", description: "Peace festival in Augsburg" },
                    { name: "Oktoberfest", date: "09-16", category: "Cultural", description: "World's largest beer festival in Munich" },
                    { name: "Day of German Unity", date: "10-03", category: "National", description: "Celebrating German reunification" },
                    { name: "St. Martin's Day", date: "11-11", category: "Traditional", description: "Children's lantern processions" },
                    { name: "Christmas Markets", date: "12-01", category: "Cultural", description: "Traditional Christmas markets begin" }
                ])
            },
            "Australia": {
                center: { lat: -25.2744, lon: 133.7751 },
                bounds: { minLat: -43.6345, maxLat: -10.6681, minLon: 113.3384, maxLon: 153.5696 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Summer celebrations and fireworks" },
                    { name: "Australia Day", date: "01-26", category: "National", description: "National day celebrations" },
                    { name: "Mardi Gras", date: "03-04", category: "Cultural", description: "LGBTQ+ pride celebration in Sydney" },
                    { name: "Easter", date: "04-09", category: "Religious", description: "Christian celebration with Easter Bilby" },
                    { name: "ANZAC Day", date: "04-25", category: "National", description: "War memorial day" },
                    { name: "Vivid Sydney", date: "05-26", category: "Cultural", description: "Festival of light, music and ideas" },
                    { name: "Queen's Birthday", date: "06-12", category: "National", description: "Public holiday honoring the monarch" },
                    { name: "NAIDOC Week", date: "07-02", category: "Cultural", description: "Celebrating Indigenous Australian culture" },
                    { name: "Darwin Festival", date: "08-10", category: "Cultural", description: "Arts and cultural festival" },
                    { name: "AFL Grand Final", date: "09-30", category: "Cultural", description: "Major sporting event" },
                    { name: "Melbourne Cup", date: "11-07", category: "Cultural", description: "Famous horse racing event" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Summer Christmas celebrations" }
                ])
            },
            "Brazil": {
                center: { lat: -14.2350, lon: -51.9253 },
                bounds: { minLat: -33.7683, maxLat: 5.2842, minLon: -73.9855, maxLon: -34.7299 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Beach celebrations and fireworks in Rio" },
                    { name: "Rio Carnival", date: "02-17", category: "Cultural", description: "World's biggest carnival with samba parades" },
                    { name: "Lollapalooza Brazil", date: "03-24", category: "Cultural", description: "Major music festival in São Paulo" },
                    { name: "Good Friday", date: "04-07", category: "Religious", description: "Christian observance with processions" },
                    { name: "Labor Day", date: "05-01", category: "National", description: "Workers' rights celebration" },
                    { name: "Festa Junina", date: "06-24", category: "Cultural", description: "Traditional winter harvest festival" },
                    { name: "Parintins Folklore Festival", date: "07-28", category: "Cultural", description: "Amazon's largest folklore festival" },
                    { name: "Bumba Meu Boi", date: "08-18", category: "Traditional", description: "Folk theatrical tradition in northeastern Brazil" },
                    { name: "Independence Day", date: "09-07", category: "National", description: "Brazilian independence celebrations" },
                    { name: "Our Lady of Aparecida", date: "10-12", category: "Religious", description: "Patroness of Brazil celebration" },
                    { name: "Republic Day", date: "11-15", category: "National", description: "Proclamation of the Republic" },
                    { name: "Reveillon", date: "12-31", category: "Cultural", description: "New Year's Eve beach celebrations" }
                ])
            },
            "Russia": {
                center: { lat: 61.5240, lon: 105.3188 },
                bounds: { minLat: 41.2, maxLat: 81.2, minLon: 19.9, maxLon: -169.1 },
                festivals: sortFestivals([
                    { name: "New Year", date: "01-01", category: "Cultural", description: "Major celebration with Ded Moroz" },
                    { name: "Maslenitsa", date: "02-26", category: "Traditional", description: "Pancake festival before Lent" },
                    { name: "Women's Day", date: "03-08", category: "Modern", description: "Celebrating women's achievements" },
                    { name: "Cosmonautics Day", date: "04-12", category: "National", description: "Celebrating space exploration achievements" },
                    { name: "Labor Day", date: "05-01", category: "National", description: "Spring and labor celebration" },
                    { name: "Russia Day", date: "06-12", category: "National", description: "National independence day" },
                    { name: "Ivan Kupala", date: "07-07", category: "Traditional", description: "Midsummer folk festival" },
                    { name: "Navy Day", date: "08-27", category: "National", description: "Celebrating the Russian Navy" },
                    { name: "Moscow City Day", date: "09-09", category: "Cultural", description: "Celebrating Moscow's founding" },
                    { name: "Unity Day", date: "11-04", category: "National", description: "National unity celebration" },
                    { name: "October Revolution Day", date: "10-25", category: "Historical", description: "Commemorating the 1917 revolution" },
                    { name: "New Year's Eve", date: "12-31", category: "Cultural", description: "Major celebration with fireworks" }
                ])
            },
            "Canada": {
                center: { lat: 56.1304, lon: -106.3468 },
                bounds: { minLat: 41.7, maxLat: 83.1, minLon: -141.0, maxLon: -52.6 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Winter celebrations across the country" },
                    { name: "Family Day", date: "02-20", category: "Modern", description: "Day celebrating family values" },
                    { name: "St. Patrick's Day", date: "03-17", category: "Cultural", description: "Irish heritage celebrations" },
                    { name: "Easter", date: "04-09", category: "Religious", description: "Christian spring celebration" },
                    { name: "Victoria Day", date: "05-22", category: "National", description: "Celebrating the monarchy" },
                    { name: "National Indigenous Peoples Day", date: "06-21", category: "Cultural", description: "Celebrating Indigenous cultures" },
                    { name: "Canada Day", date: "07-01", category: "National", description: "National day celebrations" },
                    { name: "Civic Holiday", date: "08-07", category: "Modern", description: "Summer long weekend" },
                    { name: "Labour Day", date: "09-04", category: "National", description: "Celebrating workers' rights" },
                    { name: "Thanksgiving", date: "10-09", category: "Traditional", description: "Harvest celebration" },
                    { name: "Remembrance Day", date: "11-11", category: "National", description: "War memorial day" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Winter holiday celebration" }
                ])
            },
            "Mexico": {
                center: { lat: 23.6345, lon: -102.5528 },
                bounds: { minLat: 14.5, maxLat: 32.7, minLon: -118.4, maxLon: -86.7 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Family celebrations and traditions" },
                    { name: "Candlemas", date: "02-02", category: "Religious", description: "Religious celebration with tamales" },
                    { name: "Benito Juárez Day", date: "03-21", category: "National", description: "Honoring former president" },
                    { name: "Holy Week", date: "04-06", category: "Religious", description: "Important religious observance" },
                    { name: "Cinco de Mayo", date: "05-05", category: "National", description: "Commemoration of the Battle of Puebla" },
                    { name: "Corpus Christi", date: "06-08", category: "Religious", description: "Religious celebration with processions" },
                    { name: "Guelaguetza", date: "07-24", category: "Cultural", description: "Indigenous cultural festival" },
                    { name: "Assumption Day", date: "08-15", category: "Religious", description: "Religious celebration of Virgin Mary" },
                    { name: "Independence Day", date: "09-16", category: "National", description: "Mexican independence celebrations" },
                    { name: "Day of the Race", date: "10-12", category: "Cultural", description: "Celebrating Mexico's indigenous heritage" },
                    { name: "Day of the Dead", date: "11-02", category: "Cultural", description: "Honoring deceased loved ones" },
                    { name: "Virgin of Guadalupe", date: "12-12", category: "Religious", description: "Major religious celebration" }
                ])
            },
            "South Korea": {
                center: { lat: 35.9078, lon: 127.7669 },
                bounds: { minLat: 33.0, maxLat: 38.6, minLon: 124.5, maxLon: 131.9 },
                festivals: sortFestivals([
                    { name: "Seollal", date: "01-22", category: "Traditional", description: "Korean New Year celebration with family gatherings" },
                    { name: "Jeongwol Daeboreum", date: "02-05", category: "Traditional", description: "First full moon of the lunar year celebration" },
                    { name: "Independence Movement Day", date: "03-01", category: "National", description: "Commemorating the 1919 independence movement" },
                    { name: "Cherry Blossom Festival", date: "04-01", category: "Cultural", description: "Celebrating spring and cherry blossoms" },
                    { name: "Buddha's Birthday", date: "05-08", category: "Religious", description: "Buddhist temples host lantern festivals" },
                    { name: "Memorial Day", date: "06-06", category: "National", description: "Honoring those who died for the country" },
                    { name: "Constitution Day", date: "07-17", category: "National", description: "Commemorating the constitution's establishment" },
                    { name: "Liberation Day", date: "08-15", category: "National", description: "Celebrating independence from Japanese rule" },
                    { name: "Chuseok", date: "09-29", category: "Traditional", description: "Major harvest festival with family reunions" },
                    { name: "National Foundation Day", date: "10-03", category: "National", description: "Celebrating Korea's founding" },
                    { name: "Pepero Day", date: "11-11", category: "Modern", description: "Modern celebration similar to Valentine's Day" },
                    { name: "Christmas", date: "12-25", category: "Religious", description: "Christian celebration and public holiday" }
                ])
            },
            "Egypt": {
                center: { lat: 26.8206, lon: 30.8025 },
                bounds: { minLat: 22.0, maxLat: 31.8, minLon: 24.7, maxLon: 36.9 },
                festivals: sortFestivals([
                    { name: "Coptic Christmas", date: "01-07", category: "Religious", description: "Egyptian Christian celebration" },
                    { name: "Cairo International Book Fair", date: "02-22", category: "Cultural", description: "One of the largest book fairs in the world" },
                    { name: "Sham El Nessim", date: "03-20", category: "Cultural", description: "Ancient spring festival" },
                    { name: "Sinai Liberation Day", date: "04-25", category: "National", description: "Commemorating Sinai's return" },
                    { name: "Labour Day", date: "05-01", category: "National", description: "Workers' rights celebration" },
                    { name: "Eid al-Adha", date: "06-28", category: "Religious", description: "Major Islamic festival" },
                    { name: "Revolution Day", date: "07-23", category: "National", description: "1952 Revolution anniversary" },
                    { name: "Islamic New Year", date: "08-19", category: "Religious", description: "Beginning of Islamic calendar" },
                    { name: "Prophet's Birthday", date: "09-27", category: "Religious", description: "Celebrating Prophet Muhammad's birth" },
                    { name: "Armed Forces Day", date: "10-06", category: "National", description: "Honoring military victory" },
                    { name: "Cairo International Film Festival", date: "11-15", category: "Cultural", description: "Major film festival in the Middle East" },
                    { name: "New Year's Eve", date: "12-31", category: "Cultural", description: "Year-end celebrations" }
                ])
            },
            "South Africa": {
                center: { lat: -30.5595, lon: 22.9375 },
                bounds: { minLat: -34.8, maxLat: -22.1, minLon: 16.3, maxLon: 32.9 },
                festivals: sortFestivals([
                    { name: "New Year's Day", date: "01-01", category: "Cultural", description: "Beginning of the year celebrations" },
                    { name: "Cape Town Minstrel Carnival", date: "02-15", category: "Cultural", description: "Colorful street parade and music" },
                    { name: "Human Rights Day", date: "03-21", category: "National", description: "Commemorating human rights" },
                    { name: "Freedom Day", date: "04-27", category: "National", description: "Celebrating first democratic elections" },
                    { name: "Workers' Day", date: "05-01", category: "National", description: "Labor rights celebration" },
                    { name: "Youth Day", date: "06-16", category: "National", description: "Commemorating Soweto uprising" },
                    { name: "Knysna Oyster Festival", date: "07-07", category: "Cultural", description: "Food and lifestyle festival" },
                    { name: "National Women's Day", date: "08-09", category: "National", description: "Celebrating women's contributions" },
                    { name: "Heritage Day", date: "09-24", category: "Cultural", description: "Celebrating cultural diversity" },
                    { name: "Johannesburg Arts Alive", date: "10-10", category: "Cultural", description: "International festival of arts" },
                    { name: "Day of Reconciliation", date: "12-16", category: "National", description: "Promoting national unity" },
                    { name: "Christmas Day", date: "12-25", category: "Religious", description: "Christian celebration" }
                ])
            }
        };
        
        // 在加载完国家数据后，为每个节日创建标记
        for (const countryName in this.countries) {
            const country = this.countries[countryName];
            const { lat, lon } = country.center;
            
            // 为每个节日创建标记
            country.festivals.forEach(festival => {
                // 计算节日位置（可以稍微偏移国家中心位置以避免重叠）
                const festivalLat = lat + (Math.random() - 0.5) * 5;
                const festivalLon = lon + (Math.random() - 0.5) * 5;
                
                // 添加标记
                this.addMarker(festivalLat, festivalLon, festival, countryName);
            });
        }
        
        // 只有当地球对象存在时才添加国家标记
        if (this.earth) {
            this.addCountryMarkers();
        }
    }
    
    // 修改 addCountryMarkers 方法
    addCountryMarkers() {
        // 清除现有标记
        this.markerObjects.forEach(marker => {
            if (marker.userData.country) {
                if (marker.parent) {
                    marker.parent.remove(marker);
                } else {
                    this.scene.remove(marker);
                }
            }
        });
        
        this.markerObjects = this.markerObjects.filter(marker => !marker.userData.country);
        
        // 添加国家标记
        for (const countryName in this.countries) {
            const country = this.countries[countryName];
            const position = this.latLongToVector3(country.center.lat, country.center.lon, 2.05);
            
            // 创建一个简单的球体作为标记
            const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(position);
            marker.userData = { 
                country: { name: countryName, ...country }
            };
            
            // 将标记添加到地球
            this.earth.add(marker);
            this.markerObjects.push(marker);
            
            // 添加高质量文本标签
            const canvas = document.createElement('canvas');
            canvas.width = 512; // 更高分辨率
            canvas.height = 128;
            const context = canvas.getContext('2d');
            
            // 绘制背景
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            context.lineWidth = 2;
            context.beginPath();
            context.roundRect(0, 0, canvas.width, canvas.height, 10);
            context.fill();
            context.stroke();
            
            // 绘制文本
            context.font = 'bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // 绘制文本阴影
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillText(countryName, canvas.width / 2 + 2, canvas.height / 2 + 2);
            
            // 绘制文本
            context.fillStyle = 'white';
            context.fillText(countryName, canvas.width / 2, canvas.height / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter; // 提高纹理质量
            texture.magFilter = THREE.LinearFilter;
            
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.position.multiplyScalar(1.05);
            sprite.scale.set(1.0, 0.25, 1); // 更大的标签
            sprite.userData = { 
                country: { name: countryName, ...country }
            };
            
            this.earth.add(sprite);
            this.markerObjects.push(sprite);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // 旋转地球
        if (this.earth) {
            this.earth.rotation.y += 0.0005;
            
            // 更新HTML标签位置
            if (this.updateHTMLLabels) {
                const labels = document.querySelectorAll('.country-label');
                labels.forEach(label => {
                    const lat = parseFloat(label.dataset.lat);
                    const lon = parseFloat(label.dataset.lon);
                    
                    // 计算标签在3D空间中的位置
                    const position = this.latLongToVector3(lat, lon, 2.05);
                    
                    // 应用地球的旋转
                    const rotatedPosition = position.clone();
                    rotatedPosition.applyMatrix4(this.earth.matrixWorld);
                    
                    // 将3D位置转换为屏幕坐标
                    const vector = rotatedPosition.clone();
                    vector.project(this.camera);
                    
                    // 转换为CSS坐标
                    const x = (vector.x * 0.5 + 0.5) * this.container.clientWidth;
                    const y = (-vector.y * 0.5 + 0.5) * this.container.clientHeight;
                    
                    // 检查标签是否在地球背面
                    if (vector.z < 0) {
                        // 计算标签的透明度，基于z值（越靠近边缘越透明）
                        const opacity = Math.min(1.0, Math.max(0.3, Math.abs(vector.z) * 2));
                        
                        label.style.display = 'block';
                        label.style.left = `${x}px`;
                        label.style.top = `${y}px`;
                        label.style.opacity = opacity.toString();
                        
                        // 调整标签大小，基于距离（越远越小）
                        const scale = Math.min(1.0, Math.max(0.7, Math.abs(vector.z) * 1.5));
                        label.style.transform = `scale(${scale})`;
                        label.style.transformOrigin = 'center center';
                        
                        // 根据位置调整z-index，使前面的标签覆盖后面的标签
                        const zIndex = Math.floor(1000 + (1 - vector.z) * 100);
                        label.style.zIndex = zIndex.toString();
                    } else {
                        label.style.display = 'none'; // 隐藏背面的标签
                    }
                });
            }
        }
        
        // 旋转云层（稍快一些）
        if (this.clouds) {
            this.clouds.rotation.y += 0.0007;
        }
        
        // 更新控制器
        this.controls.update();
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
    
    // 经纬度转换为3D坐标
    latLongToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    }
    
    // 添加节日标记
    addMarkers(festivals) {
        // 清除现有标记
        this.clearMarkers();
        
        festivals.forEach(festival => {
            const position = this.latLongToVector3(festival.latitude, festival.longitude, 2.05);
            
            // 创建标记
            const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: this.getCategoryColor(festival.category)
            });
            
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(position);
            marker.lookAt(0, 0, 0);
            marker.userData = { festival };
            
            this.scene.add(marker);
            this.markerObjects.push(marker);
        });
    }
    
    // 清除所有标记
    clearMarkers() {
        this.markerObjects.forEach(marker => {
            this.scene.remove(marker);
        });
        
        this.markerObjects = [];
    }
    
    // 根据类别获取颜色
    getCategoryColor(category) {
        switch(category) {
            case 'religious': return 0xff4d4d;
            case 'national': return 0x33cc33;
            case 'cultural': return 0xffcc00;
            case 'international': return 0x3399ff;
            default: return 0xffffff;
        }
    }
    
    // 修复 onGlobeClick 方法，保留国家点击功能
    onGlobeClick(event) {
        // 计算鼠标位置
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 设置射线
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 首先检查是否点击了节日标记
        const markerIntersects = this.raycaster.intersectObjects(this.markerObjects);
        if (markerIntersects.length > 0) {
            const marker = markerIntersects[0].object;
            if (marker.userData.festival) {
                // 调用标记点击处理方法
                this.onMarkerClick(marker, marker.userData.festival);
                return;
            }
        }
        
        // 如果没有点击节日标记，检查是否点击了国家标记或地球
        // 首先检查是否点击了节日标记或国家标记
        const allIntersects = this.raycaster.intersectObjects(this.scene.children, true);
        for (const intersect of allIntersects) {
            const object = intersect.object;
            
            if (object.userData.country) {
                // 显示国家节日信息
                console.log('Clicked country:', object.userData.country);
                this.showCountryFestivals(object.userData.country);
                return;
            }
        }
        
        // 如果没有点击标记，检查是否点击了地球
        if (this.earth) {
            const earthIntersects = this.raycaster.intersectObject(this.earth);
            if (earthIntersects.length > 0) {
                // 获取点击位置的经纬度
                const point = earthIntersects[0].point;
                const lat = 90 - (Math.acos(point.y / 2) * 180 / Math.PI);
                const lon = ((Math.atan2(point.z, point.x) * 180 / Math.PI) + 180) % 360 - 180;
                
                console.log(`点击位置: 纬度 ${lat.toFixed(2)}, 经度 ${lon.toFixed(2)}`);
                
                // 查找最近的国家（简化为只使用距离）
                let nearestCountry = null;
                let minDistance = Infinity;
                
                for (const countryName in this.countries) {
                    const country = this.countries[countryName];
                    const distance = this.calculateDistance(
                        lat, lon, 
                        country.center.lat, country.center.lon
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCountry = {
                            name: countryName,
                            ...country
                        };
                    }
                }
                
                // 使用更大的距离阈值，因为我们现在有视觉边界
                if (minDistance < 40) {
                    console.log(`找到国家: ${nearestCountry.name}, 距离: ${minDistance.toFixed(2)}`);
                    this.showCountryFestivals(nearestCountry);
                } else {
                    console.log('未找到国家');
                    this.showLocationInfo(lat, lon);
                }
            }
        }
    }
    
    // 恢复距离计算函数
    calculateDistance(lat1, lon1, lat2, lon2) {
        // 转换为弧度
        const lat1Rad = lat1 * Math.PI / 180;
        const lon1Rad = lon1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;
        const lon2Rad = lon2 * Math.PI / 180;
        
        // 哈弗辛公式
        const dLat = lat2Rad - lat1Rad;
        const dLon = lon2Rad - lon1Rad;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        // 地球半径（以度为单位）
        const R = 180 / Math.PI;
        return R * c;
    }
    
    // 显示国家节日信息
    showCountryFestivals(country) {
        console.log('Showing festivals for country:', country);
        
        // 获取元素
        const infoPanel = document.getElementById('festival-info');
        const titleElement = document.getElementById('festival-title');
        const dateElement = document.getElementById('festival-date');
        const locationElement = document.getElementById('festival-location');
        const categoryElement = document.getElementById('festival-category');
        const descriptionElement = document.getElementById('festival-description');
        
        // 设置内容
        titleElement.textContent = `Major Festivals in ${country.name}`;
        dateElement.textContent = '';
        locationElement.textContent = `Location: Longitude ${country.center.lon.toFixed(2)}, Latitude ${country.center.lat.toFixed(2)}`;
        categoryElement.textContent = '';
        
        // 显示所有节日
        let festivalsList = '';
        country.festivals.forEach(festival => {
            festivalsList += `<strong>${festival.name}</strong> (${festival.date}): ${festival.description}<br><br>`;
        });
        
        descriptionElement.innerHTML = festivalsList;
        
        // 显示面板
        infoPanel.classList.remove('hidden');
    }
    
    // 显示节日信息
    showFestivalInfo(festival) {
        const infoPanel = document.getElementById('festival-info');
        
        // 创建 slug 用于链接
        const festivalSlug = festival.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        
        infoPanel.innerHTML = `
            <div>
                <button id="close-info">&times;</button>
                <h2 id="festival-title">${festival.name}</h2>
                
                <div class="festival-info-grid">
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <div class="label">Date</div>
                            <div class="value">${festival.date}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <div class="label">Location</div>
                            <div class="value">${festival.location || 'Various locations'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="fas fa-tag"></i>
                        <div>
                            <div class="label">Category</div>
                            <div class="value">${festival.category}</div>
                        </div>
                    </div>
                </div>
                
                <div id="festival-description">
                    ${festival.description}
                </div>
                
                <div class="festival-actions">
                    <a href="festivals/${festivalSlug}.html" class="detail-link">
                        <i class="fas fa-external-link-alt"></i> View Full Details
                    </a>
                </div>
            </div>
        `;
        
        infoPanel.classList.remove('hidden');
        
        // 重新添加关闭事件监听
        document.getElementById('close-info').addEventListener('click', () => {
            infoPanel.classList.add('hidden');
        });
    }
    
    // 添加新方法：显示位置信息
    showLocationInfo(lat, lon) {
        const infoPanel = document.getElementById('festival-info');
        const titleElement = document.getElementById('festival-title');
        const dateElement = document.getElementById('festival-date');
        const locationElement = document.getElementById('festival-location');
        const categoryElement = document.getElementById('festival-category');
        const descriptionElement = document.getElementById('festival-description');
        
        titleElement.textContent = 'Location Information';
        dateElement.textContent = '';
        locationElement.textContent = `Latitude: ${lat.toFixed(2)}, Longitude: ${lon.toFixed(2)}`;
        categoryElement.textContent = '';
        descriptionElement.textContent = 'The location you clicked is not in our country database. Please try clicking on another area.';
        
        infoPanel.classList.remove('hidden');
    }
    
    // 修改 toggleCountryLabels 方法
    toggleCountryLabels(visible) {
        const labels = document.querySelectorAll('.country-label');
        labels.forEach(label => {
            if (visible) {
                label.style.display = ''; // 恢复默认显示状态
            } else {
                label.style.display = 'none'; // 隐藏所有标签
            }
        });
        
        // 控制是否更新标签位置
        this.updateHTMLLabels = visible;
    }
    
    // 添加到 Globe 类中
    addDebugGrid() {
        // 添加经纬度网格
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
        
        // 经线
        for (let lon = -180; lon <= 180; lon += 30) {
            const points = [];
            for (let lat = -90; lat <= 90; lat += 5) {
                const point = this.latLongToVector3(lat, lon, 2.01);
                points.push(point);
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.scene.add(line);
        }
        
        // 纬线
        for (let lat = -90; lat <= 90; lat += 30) {
            const points = [];
            for (let lon = -180; lon <= 180; lon += 5) {
                const point = this.latLongToVector3(lat, lon, 2.01);
                points.push(point);
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            this.scene.add(line);
        }
        
        // 添加国家边界框
        const boundaryMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
        
        for (const countryName in this.countries) {
            const country = this.countries[countryName];
            if (country.bounds) {
                const bounds = country.bounds;
                const points = [
                    this.latLongToVector3(bounds.minLat, bounds.minLon, 2.02),
                    this.latLongToVector3(bounds.minLat, bounds.maxLon, 2.02),
                    this.latLongToVector3(bounds.maxLat, bounds.maxLon, 2.02),
                    this.latLongToVector3(bounds.maxLat, bounds.minLon, 2.02),
                    this.latLongToVector3(bounds.minLat, bounds.minLon, 2.02)
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, boundaryMaterial);
                this.scene.add(line);
            }
        }
    }
    
    // 修改 addHTMLCountryLabels 方法
    addHTMLCountryLabels() {
        // 清除现有HTML标签
        const existingLabels = document.querySelectorAll('.country-label');
        existingLabels.forEach(label => label.remove());
        
        // 为每个国家创建HTML标签
        for (const countryName in this.countries) {
            const country = this.countries[countryName];
            
            const label = document.createElement('div');
            label.className = 'country-label';
            label.textContent = countryName;
            label.style.position = 'absolute';
            label.style.color = 'white';
            label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // 更深的背景色
            label.style.padding = '4px 10px';
            label.style.borderRadius = '4px';
            label.style.fontSize = '14px'; // 更大的字体
            label.style.fontWeight = 'bold';
            label.style.textShadow = '1px 1px 2px rgba(0,0,0,1), -1px -1px 2px rgba(0,0,0,1)';
            label.style.pointerEvents = 'auto';
            label.style.zIndex = '1000';
            label.style.transition = 'all 0.2s ease-in-out';
            label.style.border = '1px solid rgba(255,255,255,0.3)';
            label.style.letterSpacing = '0.5px';
            
            // 将标签添加到容器
            this.container.appendChild(label);
            
            // 存储国家数据
            label.dataset.country = countryName;
            label.dataset.lat = country.center.lat;
            label.dataset.lon = country.center.lon;
            
            // 使用闭包保存当前国家信息
            ((currentCountryName, currentCountry) => {
                label.addEventListener('click', (event) => {
                    event.stopPropagation();
                    console.log(`Clicked on country: ${currentCountryName}`);
                    this.showCountryFestivals({
                        name: currentCountryName,
                        ...currentCountry
                    });
                });
            })(countryName, country);
        }
        
        // 在动画循环中更新标签位置
        this.updateHTMLLabels = true;
        
        console.log(`Created ${Object.keys(this.countries).length} country labels`);
    }
    
    // 添加到 Globe 类中
    highlightCountries(countryNames) {
        // 清除之前的高亮
        if (this.highlightedCountries) {
            this.highlightedCountries.forEach(highlight => {
                if (highlight.parent) {
                    highlight.parent.remove(highlight);
                }
            });
        }
        
        this.highlightedCountries = [];
        
        // 高亮选定的国家
        countryNames.forEach(countryName => {
            if (this.countries[countryName]) {
                const country = this.countries[countryName];
                const position = this.latLongToVector3(country.center.lat, country.center.lon, 2.03);
                
                // 创建高亮标记
                const highlightGeometry = new THREE.SphereGeometry(0.08, 32, 32);
                const highlightMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.7
                });
                
                const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
                highlight.position.copy(position);
                
                this.earth.add(highlight);
                this.highlightedCountries.push(highlight);
                
                // 添加脉冲动画
                const pulse = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 32, 32),
                    new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        transparent: true,
                        opacity: 0.5
                    })
                );
                pulse.position.copy(position);
                this.earth.add(pulse);
                this.highlightedCountries.push(pulse);
                
                // 脉冲动画
                let scale = 1;
                let growing = true;
                
                const animate = () => {
                    if (growing) {
                        scale += 0.01;
                        if (scale >= 1.5) growing = false;
                    } else {
                        scale -= 0.01;
                        if (scale <= 1) growing = true;
                    }
                    
                    pulse.scale.set(scale, scale, scale);
                    requestAnimationFrame(animate);
                };
                
                animate();
            }
        });
    }
    
    // 添加到 Globe 类中
    showMonthlyFestivals(month) {
        const infoPanel = document.getElementById('festival-info');
        const titleElement = document.getElementById('festival-title');
        const descriptionElement = document.getElementById('festival-description');
        
        // 设置标题
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        titleElement.textContent = `Festivals in ${monthNames[parseInt(month) - 1]}`;
        
        // 收集所有国家在该月的节日
        let monthlyFestivals = '';
        for (const countryName in this.countries) {
            const country = this.countries[countryName];
            const festivals = country.festivals.filter(f => f.date.startsWith(month));
            
            if (festivals.length > 0) {
                monthlyFestivals += `
                    <div class="country-festivals">
                        <h3>${countryName}</h3>
                        ${festivals.map(f => `
                            <div class="festival-item">
                                <strong>${f.name}</strong> (${f.date})
                                <br>
                                <span class="category">${f.category}</span>
                                <br>
                                ${f.description}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
        
        if (monthlyFestivals) {
            descriptionElement.innerHTML = `<div class="monthly-view">${monthlyFestivals}</div>`;
            infoPanel.classList.remove('hidden');
        } else {
            descriptionElement.innerHTML = `<p>No festivals found in ${monthNames[parseInt(month) - 1]}.</p>`;
            infoPanel.classList.remove('hidden');
        }
    }
    
    // 添加截图功能
    captureGlobeImage() {
        // 创建一个截图并允许用户下载或分享
        const screenshot = this.renderer.domElement.toDataURL('image/png');
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = screenshot;
        downloadLink.download = 'worldwide-festivals-globe.png';
        downloadLink.textContent = 'Download Globe Image';
        
        // 显示下载链接
        const captureContainer = document.createElement('div');
        captureContainer.className = 'capture-container';
        captureContainer.appendChild(downloadLink);
        
        document.body.appendChild(captureContainer);
        
        // 添加社交分享选项
        // ...
    }
    
    // 添加地球旋转到特定区域的功能
    focusRegion(region) {
        let targetCoords;
        
        switch(region) {
            case 'Asia':
                targetCoords = { lat: 34.0479, lon: 100.6197 };
                break;
            case 'Europe':
                targetCoords = { lat: 54.5260, lon: 15.2551 };
                break;
            case 'Africa':
                targetCoords = { lat: 8.7832, lon: 34.5085 };
                break;
            case 'North America':
                targetCoords = { lat: 54.5260, lon: -105.2551 };
                break;
            case 'South America':
                targetCoords = { lat: -8.7832, lon: -55.4915 };
                break;
            case 'Oceania':
                targetCoords = { lat: -25.2744, lon: 133.7751 };
                break;
        }
        
        if (targetCoords) {
            this.rotateTo(targetCoords.lat, targetCoords.lon);
            
            // 更新页面标题以包含区域
            document.title = `${region} Festivals - Worldwide Festivals Explorer`;
            
            // 可选：显示该区域的节日摘要
            this.showRegionalFestivals(region);
        }
    }
    
    // 平滑旋转到指定坐标
    rotateTo(lat, lon) {
        // 将目标位置转换为3D坐标
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        
        const targetX = -Math.sin(phi) * Math.cos(theta) * 5;
        const targetY = Math.cos(phi) * 5;
        const targetZ = Math.sin(phi) * Math.sin(theta) * 5;
        
        // 动画旋转
        const duration = 1000; // 毫秒
        const start = Date.now();
        const startPos = this.camera.position.clone();
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - start) / duration);
            
            // 使用缓动函数使动画更平滑
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.camera.position.x = startPos.x + (targetX - startPos.x) * easeProgress;
            this.camera.position.y = startPos.y + (targetY - startPos.y) * easeProgress;
            this.camera.position.z = startPos.z + (targetZ - startPos.z) * easeProgress;
            
            this.camera.lookAt(0, 0, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // 修改标记点击事件，直接跳转到详情页面
    onMarkerClick(marker, festival) {
        // 创建 slug 用于链接
        const festivalSlug = festival.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        
        // 直接跳转到详情页面
        window.location.href = `festivals/${festivalSlug}.html`;
    }

    // 在 Globe 类中添加或修改 addMarker 方法
    addMarker(lat, lon, festival, countryName) {
        // 将经纬度转换为3D坐标
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        
        const x = -Math.sin(phi) * Math.cos(theta) * 2;
        const y = Math.cos(phi) * 2;
        const z = Math.sin(phi) * Math.sin(theta) * 2;
        
        // 创建标记几何体和材质
        const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        // 创建标记网格
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);
        
        // 存储标记相关信息
        marker.userData = {
            festival: festival,
            country: countryName
        };
        
        // 将标记添加到地球
        this.earth.add(marker);
        this.markerObjects.push(marker);
        
        // 返回标记对象
        return marker;
    }

    // 添加一个直接跳转到节日详情页的方法
    showFestivalDetails(festivalName, countryName) {
        // 在所有国家中查找指定的节日
        let festival = null;
        
        if (countryName && this.countries[countryName]) {
            // 如果指定了国家，只在该国家中查找
            festival = this.countries[countryName].festivals.find(f => 
                f.name.toLowerCase() === festivalName.toLowerCase()
            );
        } else {
            // 否则在所有国家中查找
            for (const country in this.countries) {
                const found = this.countries[country].festivals.find(f => 
                    f.name.toLowerCase() === festivalName.toLowerCase()
                );
                if (found) {
                    festival = found;
                    break;
                }
            }
        }
        
        if (festival) {
            // 创建 slug 用于链接
            const festivalSlug = festival.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            
            // 直接跳转到详情页面
            window.location.href = `festivals/${festivalSlug}.html`;
        }
    }
}

// 全局函数，用于从页面其他部分调用
function focusRegion(region) {
    // 获取globe实例并调用方法
    const globeInstance = document.querySelector('#globe-container').__globe;
    globeInstance.focusRegion(region);
}

function showFestival(country, festivalName) {
    const globeInstance = document.querySelector('#globe-container').__globe;
    globeInstance.showCountryFestival(country, festivalName);
    
    // 更新页面标题
    document.title = `${festivalName} in ${country} - Worldwide Festivals Explorer`;
}

// 添加到全局函数部分
function showFestivalDetails(festivalName, countryName) {
    const globeInstance = document.querySelector('#globe-container').__globe;
    globeInstance.showFestivalDetails(festivalName, countryName);
} 