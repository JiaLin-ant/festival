class FestivalData {
    constructor() {
        // Festival data
        this.festivals = [
            {
                id: 1,
                name: "New Year's Day",
                date: "2023-01-01",
                location: "Global",
                latitude: 0,
                longitude: 0,
                category: "international",
                description: "New Year's Day is celebrated around the world to mark the beginning of a new calendar year."
            },
            {
                id: 2,
                name: "Chinese New Year",
                date: "2023-01-22",
                location: "China",
                latitude: 35.8617,
                longitude: 104.1954,
                category: "cultural",
                description: "Chinese New Year, also known as Spring Festival, is the most important traditional festival in China. It marks the beginning of the lunar new year."
            },
            {
                id: 3,
                name: "Valentine's Day",
                date: "2023-02-14",
                location: "Western Countries",
                latitude: 48.8566,
                longitude: 2.3522,
                category: "cultural",
                description: "Valentine's Day is a celebration of love and romance. People typically give flowers, chocolates, and cards to their loved ones."
            },
            {
                id: 4,
                name: "International Women's Day",
                date: "2023-03-08",
                location: "Global",
                latitude: 0,
                longitude: 0,
                category: "international",
                description: "International Women's Day celebrates women's achievements and raises awareness about gender equality and women's rights."
            },
            {
                id: 5,
                name: "Holi",
                date: "2023-03-08",
                location: "India",
                latitude: 20.5937,
                longitude: 78.9629,
                category: "cultural",
                description: "Holi is a Hindu festival known as the 'Festival of Colors'. People throw colored powders and water at each other in celebration."
            },
            {
                id: 6,
                name: "Earth Day",
                date: "2023-04-22",
                location: "Global",
                latitude: 0,
                longitude: 0,
                category: "international",
                description: "Earth Day is an annual event to demonstrate support for environmental protection. Activities include planting trees, cleaning up litter, and environmental education."
            },
            {
                id: 7,
                name: "Labor Day",
                date: "2023-05-01",
                location: "Many Countries",
                latitude: 51.5074,
                longitude: -0.1278,
                category: "national",
                description: "Labor Day, also known as International Workers' Day, celebrates the achievements of workers and labor movements."
            },
            {
                id: 8,
                name: "Independence Day",
                date: "2023-07-04",
                location: "United States",
                latitude: 37.0902,
                longitude: -95.7129,
                category: "national",
                description: "Independence Day commemorates the Declaration of Independence signed on July 4, 1776. Celebrations include fireworks, parades, barbecues, and patriotic activities."
            },
            {
                id: 9,
                name: "National Day of China",
                date: "2023-10-01",
                location: "China",
                latitude: 39.9042,
                longitude: 116.4074,
                category: "national",
                description: "National Day of China celebrates the founding of the People's Republic of China with nationwide holidays and celebrations."
            },
            {
                id: 10,
                name: "Halloween",
                date: "2023-10-31",
                location: "Western Countries",
                latitude: 53.1424,
                longitude: -7.6921,
                category: "cultural",
                description: "Halloween originated from ancient Celtic traditions and is now celebrated in many Western countries. People dress up in costumes, attend parties, and children go trick-or-treating."
            },
            {
                id: 11,
                name: "Christmas",
                date: "2023-12-25",
                location: "Many Countries",
                latitude: 51.5074,
                longitude: -0.1278,
                category: "religious",
                description: "Christmas is a Christian holiday celebrating the birth of Jesus Christ. Traditions include decorating Christmas trees, exchanging gifts, singing carols, and family gatherings."
            }
        ];
    }
    
    // Get festivals for a specific date
    getFestivalsByDate(date) {
        // Extract month and day parts from the full date (MM-DD)
        const dateParts = date.split('-');
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        const monthDay = `${month}-${day}`;
        
        // Find matching festivals
        return this.festivals.filter(festival => {
            // Extract month and day parts from the festival date
            const festivalDateParts = festival.date.split('-');
            const festivalMonth = festivalDateParts[1];
            const festivalDay = festivalDateParts[2];
            const festivalMonthDay = `${festivalMonth}-${festivalDay}`;
            
            return festivalMonthDay === monthDay;
        });
    }
    
    // Filter festivals by category
    filterByCategory(festivals, category) {
        if (category === 'all') return festivals;
        return festivals.filter(festival => festival.category === category);
    }
    
    // Filter festivals by region
    filterByRegion(festivals, region) {
        if (region === 'all') return festivals;
        
        // Simplified region mapping
        const regionMapping = {
            'asia': ['China', 'India'],
            'europe': ['France', 'United Kingdom'],
            'northamerica': ['United States'],
            'southamerica': ['Brazil'],
            'africa': [],
            'oceania': ['Australia']
        };
        
        return festivals.filter(festival => {
            if (festival.location === 'Global' || festival.location === 'Many Countries') return true;
            return regionMapping[region].some(country => festival.location.includes(country));
        });
    }
    
    // Get today's date (format: YYYY-MM-DD)
    getTodayDate() {
        return moment().format('YYYY-MM-DD');
    }
    
    // Get previous day
    getPreviousDay(date) {
        return moment(date).subtract(1, 'days').format('YYYY-MM-DD');
    }
    
    // Get next day
    getNextDay(date) {
        return moment(date).add(1, 'days').format('YYYY-MM-DD');
    }
    
    // Get country festivals by date
    getCountryFestivalsByDate(date) {
        // Extract month and day parts from the full date (MM-DD)
        const dateParts = date.split('-');
        const month = dateParts[1];
        const day = dateParts[2];
        const monthDay = `${month}-${day}`;
        
        // Store the date's festivals
        const countriesWithFestivals = [];
        
        // Iterate through all countries
        for (const countryName in globe.countries) {
            const country = globe.countries[countryName];
            
            // Check if the country has festivals on the date
            const hasFestival = country.festivals.some(festival => {
                return festival.date === monthDay;
            });
            
            if (hasFestival) {
                // Find the specific festival on the date
                const festivals = country.festivals.filter(festival => festival.date === monthDay);
                
                countriesWithFestivals.push({
                    name: countryName,
                    center: country.center,
                    festivals: festivals
                });
            }
        }
        
        return countriesWithFestivals;
    }
} 