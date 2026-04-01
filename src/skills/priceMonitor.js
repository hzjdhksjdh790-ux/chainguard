/**
 * Price Monitor Skill
 * Monitors real-time prices of ETH, BTC, SOL and other assets
 * Triggers alerts when price drops exceed user-defined thresholds
 * 
 * @module priceMonitor
 * @requires @okx-web3/onchainos-skills
 */

import { config } from '../config.js';

/**
 * Price Monitor - Real-time price tracking and alerting
 */
export const priceMonitor = {
  name: 'PriceMonitor',
  version: '1.0.0',

  /**
   * Check prices for specified assets and generate alerts
   * @param {Object} params - Parameters including assets array and thresholds
   * @returns {Object} Price report with alerts
   */
  async checkPrices(params = {}) {
    const { 
      assets = ['ETH', 'BTC', 'SOL'],
      dropThreshold = config.alerts.priceDropThreshold,
      interval = config.alerts.checkInterval
    } = params;

    console.log(`[PriceMonitor] Checking prices for: ${assets.join(', ')}`);
    console.log(`[PriceMonitor] Alert threshold: ${dropThreshold}% drop`);

    const prices = await fetchPrices(assets);
    const alerts = detectAlerts(prices, dropThreshold);
    const report = generatePriceReport(prices, alerts);

    console.log(`[PriceMonitor] Found ${alerts.length} price alerts`);
    
    return report;
  },

  /**
   * Set up continuous price monitoring
   * @param {Object} params - Monitoring configuration
   * @returns {Function} Stop function to cancel monitoring
   */
  startMonitoring(params = {}) {
    const { assets, dropThreshold, onAlert } = params;
    const interval = params.interval || config.alerts.checkInterval;

    console.log(`[PriceMonitor] Starting continuous monitoring every ${interval}ms`);

    const monitorInterval = setInterval(async () => {
      const report = await this.checkPrices({ assets, dropThreshold });
      
      if (report.alerts.length > 0 && onAlert) {
        onAlert(report);
      }
    }, interval);

    // Return stop function
    return () => {
      console.log('[PriceMonitor] Stopping monitoring');
      clearInterval(monitorInterval);
    };
  },

  /**
   * Get price history for an asset
   * @param {string} asset - Asset symbol (ETH, BTC, SOL)
   * @param {number} hours - Number of hours of history
   * @returns {Object} Price history data
   */
  async getHistory(asset, hours = 24) {
    console.log(`[PriceMonitor] Fetching ${hours}h history for ${asset}`);
    
    // Using OnchainOS Market Data API
    const history = await fetchPriceHistory(asset, hours);
    
    return {
      asset,
      period: `${hours}h`,
      data: history,
      stats: calculateStats(history)
    };
  }
};

/**
 * Fetch current prices using OnchainOS Market Data API
 * @param {Array} assets - List of asset symbols
 * @returns {Array} Current price data
 */
async function fetchPrices(assets) {
  const prices = [];
  
  for (const asset of assets) {
    try {
      // OnchainOS Market Data API integration
      // Replace with actual API call when SDK is available
      const priceData = await callOnchainOSAPI('market', 'getPrice', {
        chain: getChainForAsset(asset),
        token: asset
      });

      prices.push({
        symbol: asset,
        price: priceData.price,
        change24h: priceData.change24h,
        volume24h: priceData.volume24h,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[PriceMonitor] Error fetching ${asset}: ${error.message}`);
      // Return mock data for demo
      prices.push(getMockPrice(asset));
    }
  }
  
  return prices;
}

/**
 * Detect price alerts based on thresholds
 */
function detectAlerts(prices, dropThreshold) {
  const alerts = [];
  
  for (const price of prices) {
    if (price.change24h < -dropThreshold) {
      alerts.push({
        symbol: price.symbol,
        type: 'PRICE_DROP',
        severity: price.change24h < -20 ? 'CRITICAL' : 'WARNING',
        message: `${price.symbol} dropped ${Math.abs(price.change24h).toFixed(2)}% in 24h`,
        price: price.price,
        change: price.change24h,
        recommendation: generateRecommendation(price.symbol, price.change24h)
      });
    }
    
    // Check for significant gains
    if (price.change24h > 10) {
      alerts.push({
        symbol: price.symbol,
        type: 'PRICE_SPIKE',
        severity: 'INFO',
        message: `${price.symbol} surged ${price.change24h.toFixed(2)}% in 24h`,
        price: price.price,
        change: price.change24h,
        recommendation: 'Consider taking profits'
      });
    }
  }
  
  return alerts;
}

/**
 * Generate price report
 */
function generatePriceReport(prices, alerts) {
  return {
    timestamp: new Date().toISOString(),
    source: 'OKX OnchainOS Market Data API',
    prices,
    alerts,
    summary: {
      totalAssets: prices.length,
      alertCount: alerts.length,
      worstPerformer: alerts.find(a => a.type === 'PRICE_DROP')?.symbol || 'None',
      bestPerformer: [...prices].sort((a, b) => b.change24h - a.change24h)[0]?.symbol || 'None'
    }
  };
}

/**
 * Fetch price history from OnchainOS
 */
async function fetchPriceHistory(asset, hours) {
  // OnchainOS API call
  const history = await callOnchainOSAPI('market', 'getHistory', {
    token: asset,
    period: hours
  });
  return history;
}

/**
 * Calculate statistics from price history
 */
function calculateStats(history) {
  if (!history || history.length === 0) return null;
  
  const prices = history.map(h => h.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  return { high, low, average: avg };
}

/**
 * Get chain identifier for an asset
 */
function getChainForAsset(asset) {
  const chainMap = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin',
    'SOL': 'solana',
    'OKB': 'okt',
    'XRP': 'xrp'
  };
  return chainMap[asset] || 'ethereum';
}

/**
 * Generate investment recommendation based on price change
 */
function generateRecommendation(symbol, change) {
  if (change < -20) {
    return `CRITICAL: ${symbol} dropped significantly. Consider moving to stablecoins for protection.`;
  } else if (change < -10) {
    return `WARNING: ${symbol} showing weakness. Monitor closely, consider reducing position.`;
  } else {
    return `HOLD: ${symbol} within acceptable range.`;
  }
}

/**
 * Mock price data for demo/testing
 */
function getMockPrice(asset) {
  const mockPrices = {
    'ETH': { price: 3245.67, change24h: -8.5, volume24h: '12.5B' },
    'BTC': { price: 67842.50, change24h: -3.2, volume24h: '28.3B' },
    'SOL': { price: 142.35, change24h: 5.8, volume24h: '2.1B' },
    'OKB': { price: 52.45, change24h: -1.2, volume24h: '450M' }
  };
  
  return {
    symbol: asset,
    ...mockPrices[asset] || { price: 100, change24h: 0, volume24h: '0' },
    timestamp: new Date().toISOString()
  };
}

/**
 * Call OnchainOS API
 * @param {string} module - API module (market, defi, wallet)
 * @param {string} endpoint - API endpoint
 * @param {Object} params - API parameters
 */
async function callOnchainOSAPI(module, endpoint, params) {
  // OnchainOS SDK integration point
  // This would use @okx-web3/onchainos-skills in production
  // For now, return mock data
  
  console.log(`[OnchainOS] Calling ${module}.${endpoint} with params:`, params);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock data based on module
  if (module === 'market') {
    return getMockPrice(params.token || 'ETH');
  }
  return {};
}

export default priceMonitor;
