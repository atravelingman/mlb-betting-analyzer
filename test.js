// Mock DOM elements
const mockDOM = {
    elements: {
        'homeTeamSelect': {
            value: '108',
            innerHTML: '',
            style: {},
            addEventListener: () => {},
            options: [
                { text: 'Los Angeles Angels', value: '108' }
            ],
            selectedIndex: 0
        },
        'awayTeamSelect': {
            value: '109',
            innerHTML: '',
            style: {},
            addEventListener: () => {},
            options: [
                { text: 'Arizona Diamondbacks', value: '109' }
            ],
            selectedIndex: 0
        },
        'loading': {
            style: {},
            display: 'none'
        },
        'error': {
            style: {},
            textContent: '',
            display: 'none'
        },
        'updateHistory': {
            innerHTML: ''
        },
        'statsChangesBody': {
            innerHTML: ''
        },
        'homeAVG': { value: '0.000' },
        'homeOBP': { value: '0.000' },
        'homeSLG': { value: '0.000' },
        'homeISO': { value: '0.000' },
        'homeBABIP': { value: '0.000' },
        'homeERA': { value: '0.00' },
        'homeWHIP': { value: '0.00' },
        'homePitcherSelect': {
            innerHTML: '',
            value: '',
            options: [],
            addEventListener: () => {}
        },
        'homeStarterERA': { value: '0.00' },
        'homeStarterWHIP': { value: '0.00' },
        'homeStarterK9': { value: '0.0' },
        'homeStarterBB9': { value: '0.0' },
        'weather': { value: 'normal' },
        'marketSpread': { value: '0' },
        'marketTotal': { value: '8.5' },
        'results': { innerHTML: '' },
        'lastUpdate': { textContent: '' }
    },
    createElement: function(tag) {
        return {
            innerHTML: '',
            appendChild: () => {},
            addEventListener: () => {},
            style: {},
            value: '',
            options: [],
            selectedIndex: 0
        };
    },
    getElementById: function(id) {
        return this.elements[id] || this.createElement('div');
    }
};

// Mock fetch function
global.fetch = async (url) => {
    console.log('Fetching:', url);
    return {
        ok: true,
        json: async () => ({
            stats: [
                {
                    group: { displayName: 'hitting' },
                    splits: [{
                        stat: {
                            avg: '.285',
                            obp: '.350',
                            slg: '.450',
                            babip: '.300'
                        }
                    }]
                },
                {
                    group: { displayName: 'pitching' },
                    splits: [{
                        stat: {
                            era: '3.50',
                            whip: '1.20'
                        }
                    }]
                }
            ],
            roster: [
                {
                    person: { id: 1, fullName: 'Test Pitcher' },
                    position: { code: '1' }
                }
            ]
        })
    };
};

// Set up global document object
global.document = mockDOM;

// Import the MLBAnalyzer class
const { MLBAnalyzer } = require('./analyzer.js');

// Test function
async function runTests() {
    console.log('Starting tests...');
    
    try {
        // Initialize analyzer
        const analyzer = new MLBAnalyzer();
        console.log('Analyzer initialized');

        // Test team stats fetching
        console.log('\nTesting fetchTeamStats...');
        const homeStats = await analyzer.fetchTeamStats('home');
        console.log('Home team stats:', JSON.stringify(homeStats, null, 2));

        // Test pitcher stats
        if (homeStats && homeStats.pitchers) {
            console.log('\nTesting pitcher stats...');
            const pitcherStats = homeStats.pitchers;
            console.log('Pitcher stats:', JSON.stringify(pitcherStats, null, 2));
        }

        // Test team fields update
        console.log('\nTesting updateTeamFields...');
        await analyzer.updateTeamFields({ side: 'home', id: '108' }, homeStats);
        console.log('Team fields updated');

        // Test matchup analysis
        console.log('\nTesting analyzeMatchup...');
        await analyzer.analyzeMatchup();
        console.log('Matchup analyzed');

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the tests
runTests(); 