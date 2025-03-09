import { MLBAnalyzer } from './analyzer.js';

// Initialize the analyzer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyzer = new MLBAnalyzer();
}); 