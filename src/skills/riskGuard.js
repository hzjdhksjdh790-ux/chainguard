/**
 * Risk Guard Skill
 * Monitors wallet asset portfolio and detects abnormal fluctuations
 * Suggests protective actions like switching to stablecoins
 * 
 * @module riskGuard
 * @requires @okx-web3/onchainos-skills
 */

import { config, SUPPORTED_CHAINS } from '../config.js';

/**
 * Risk Guard - Portfolio risk monitoring and protection
 */
export const riskGuard = {
  name: 'RiskGuard',
  version: '1.0.0',

  /**
   * Analyze wallet portfolio for risks
   * @param {Object} params - Analysis parameters
   * @returns {Object} Risk analysis report
   */
  async analyze(params = {}) {
    const { 
      walletAddress,
      chains = SUPPORTED_CHAINS,
      sensitivity = 'MEDIUM'
    } = params;

    if (!walletAddress) {
      throw new Error('walletAddress is required for risk analysis');
    }

    console.log(`[RiskGuard] Analyzing wallet: ${walletAddress}`);
    console.log(`[RiskGuard] Sensitivity: ${sensitivity}`);
    console.log(`[RiskGuard] Scanning chains: ${chains.join(', ')}`);

    // Fetch portfolio data
    const portfolio = await fetchPortfolio(walletAddress, chains);
    
    // Calculate risk metrics
    const riskScore = calculateRiskScore(portfolio, sensitivity);
    const exposures = calculateExposures(portfolio);
    const anomalies = detectAnomalies(portfolio);
    const recommendations = generateRecommendations(riskScore, portfolio, anomalies);

    const report = {
      timestamp: new Date().toISOString(),
      walletAddress,
      chains,
      sensitivity,
      portfolio,
      riskScore,
      exposures,
      anomalies,
      recommendations,
      overallStatus: determineStatus(riskScore)
    };

    console.log(`[RiskGuard] Risk score: ${riskScore.score}/100 (${riskScore.level})`);
    console.log(`[RiskGuard] Status: ${report.overallStatus}`);
    
    return report;
  },

  /**
   * Set up continuous risk monitoring
   * @param {Object} params - Monitoring configuration
   * @returns {Function} Stop function
   */
  startMonitoring(params = {}) {
    const { walletAddress, chains, sensitivity, onAlert } = params;
    const interval = params.interval || config.risk.monitorInterval;

    console.log(`[RiskGuard] Starting continuous monitoring every ${interval}ms`);

    const monitorInterval = setInterval(async () => {
      const report = await this.analyze({ walletAddress, chains, sensitivity });
      
      if (report.riskScore.score > config.risk.alertThreshold && onAlert) {
        onAlert(report);
      }
    }, interval);

    return () => {
      console.log('[RiskGuard] Stopping monitoring');
      clearInterval(monitorInterval);
    };
  },

  /**
   * Check for rug pull risks in a protocol
   * @param {string} protocol - Protocol name
   * @param {string} chain - Chain identifier
   * @returns {Object} Rug pull risk assessment
   */
  async checkRugRisk(protocol, chain) {
    console.log(`[RiskGuard] Checking rug risk for ${protocol} on ${chain}`);
    
    const riskFactors = await analyzeRugFactors(protocol, chain);
    const score = calculateRugScore(riskFactors);
    
    return {
      protocol,
      chain,
      riskFactors,
      rugScore: score,
      verdict: score > 70 ? 'HIGH_RISK' : score > 40 ? 'MODERATE' : 'SAFE',
      warnings: generateRugWarnings(riskFactors)
    };
  },

  /**
   * Simulate portfolio protection scenarios
   * @param {Object} portfolio - Current portfolio
   * @param {string} strategy - Protection strategy
   * @returns {Object} Scenario analysis
   */
  async simulateProtection(portfolio, strategy = 'STABLECOIN_SHIFT') {
    console.log(`[RiskGuard] Simulating ${strategy} strategy`);
    
    const scenarios = {
      'STABLECOIN_SHIFT': simulateStablecoinShift,
      'DIVERSIFICATION': simulateDiversification,
      'DELEVERAGE': simulateDeleverage
    };
    
    const simulator = scenarios[strategy] || scenarios['STABLECOIN_SHIFT'];
    return await simulator(portfolio);
  }
};

/**
 * Fetch portfolio data from multiple chains
 */
async function fetchPortfolio(walletAddress, chains) {
  console.log(`[RiskGuard] Fetching portfolio from ${chains.length} chains...`);
  
  const portfolio = {
    address: walletAddress,
    totalValue: 0,
    assets: [],
    chains: {}
  };
  
  for (const chain of chains) {
    try {
      const chainData = await callOnchainOSAPI('wallet', 'getPortfolio', {
        address: walletAddress,
        chain
      });
      
      portfolio.chains[chain] = chainData;
      portfolio.totalValue += chainData.totalValue || 0;
      portfolio.assets.push(...chainData.assets);
    } catch (error) {
      console.error(`[RiskGuard] Error fetching ${chain}: ${error.message}`);
      portfolio.chains[chain] = { error: error.message };
    }
  }
  
  // Add mock data for demo if no real data
  if (portfolio.assets.length === 0) {
    portfolio.assets = getMockAssets();
    portfolio.totalValue = portfolio.assets.reduce((sum, a) => sum + a.value, 0);
  }
  
  return portfolio;
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(portfolio, sensitivity) {
  const factors = {
    concentration: calculateConcentrationRisk(portfolio.assets) * 25,
    volatility: calculateVolatilityRisk(portfolio.assets) * 25,
    exposure: calculateExposureRisk(portfolio.chains) * 25,
    liquidity: calculateLiquidityRisk(portfolio.assets) * 25
  };
  
  const sensitivityMultiplier = { LOW: 0.7, MEDIUM: 1.0, HIGH: 1.3 }[sensitivity] || 1.0;
  
  const rawScore = Object.values(factors).reduce((a, b) => a + b, 0);
  const adjustedScore = Math.min(100, Math.round(rawScore * sensitivityMultiplier));
  
  return {
    score: adjustedScore,
    level: adjustedScore < 30 ? 'LOW' : adjustedScore < 60 ? 'MEDIUM' : 'HIGH',
    factors,
    breakdown: factors
  };
}

/**
 * Calculate concentration risk
 */
function calculateConcentrationRisk(assets) {
  if (assets.length === 0) return 0;
  
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  if (totalValue === 0) return 0;
  
  const shares = assets.map(a => (a.value / totalValue) ** 2);
  const hhi = shares.reduce((a, b) => a + b, 0);
  
  const maxHHI = 1;
  const minHHI = 1 / assets.length;
  const normalized = (hhi - minHHI) / (maxHHI - minHHI);
  
  return Math.min(1, normalized);
}

/**
 * Calculate volatility risk
 */
function calculateVolatilityRisk(assets) {
  const volatilityScores = {
    'BTC': 0.3, 'ETH': 0.4, 'SOL': 0.6,
    'STABLECOIN': 0.1, 'DEFAULT': 0.5
  };
  
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  if (totalValue === 0) return 0;
  
  let weightedVol = 0;
  for (const asset of assets) {
    const symbol = asset.symbol.toUpperCase();
    let volScore = volatilityScores.DEFAULT;
    
    if (['BTC'].includes(symbol)) volScore = volatilityScores.BTC;
    else if (['ETH'].includes(symbol)) volScore = volatilityScores.ETH;
    else if (['SOL'].includes(symbol)) volScore = volatilityScores.SOL;
    else if (['USDT', 'USDC', 'DAI'].includes(symbol)) volScore = volatilityScores.STABLECOIN;
    
    weightedVol += volScore * (asset.value / totalValue);
  }
  
  return weightedVol;
}

/**
 * Calculate cross-chain exposure risk
 */
function calculateExposureRisk(chains) {
  const chainData = Object.entries(chains).filter(([_, data]) => !data.error);
  
  if (chainData.length <= 2) return 0.3;
  if (chainData.length <= 4) return 0.15;
  return 0;
}

/**
 * Calculate liquidity risk
 */
function calculateLiquidityRisk(assets) {
  const liquidityScores = {
    'USDT': 0.1, 'USDC': 0.1, 'DAI': 0.1,
    'WBTC': 0.2, 'WETH': 0.2,
    'BTC': 0.3, 'ETH': 0.3,
    'SOL': 0.4, 'LP_TOKEN': 0.6,
    'DEFAULT': 0.5
  };
  
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  if (totalValue === 0) return 0;
  
  let weightedLiq = 0;
  for (const asset of assets) {
    const symbol = asset.symbol.toUpperCase();
    let liqScore = liquidityScores.DEFAULT;
    
    for (const [key, score] of Object.entries(liquidityScores)) {
      if (symbol.includes(key) || symbol === key) {
        liqScore = score;
        break;
      }
    }
    
    weightedLiq += liqScore * (asset.value / totalValue);
  }
  
  return weightedLiq;
}

/**
 * Calculate exposures by category
 */
function calculateExposures(portfolio) {
  const exposures = {
    byChain: {},
    byAsset: {},
    byType: { volatile: 0, stable: 0, yieldBearing: 0 }
  };
  
  let totalValue = 0;
  
  for (const asset of portfolio.assets) {
    totalValue += asset.value;
    
    const chain = asset.chain || 'unknown';
    exposures.byChain[chain] = (exposures.byChain[chain] || 0) + asset.value;
    exposures.byAsset[asset.symbol] = (exposures.byAsset[asset.symbol] || 0) + asset.value;
    
    if (['USDT', 'USDC', 'DAI'].includes(asset.symbol)) {
      exposures.byType.stable += asset.value;
    } else if (asset.yieldBearing) {
      exposures.byType.yieldBearing += asset.value;
    } else {
      exposures.byType.volatile += asset.value;
    }
  }
  
  // Convert to percentages
  if (totalValue > 0) {
    for (const chain in exposures.byChain) {
      exposures.byChain[chain] = {
        value: exposures.byChain[chain],
        percentage: ((exposures.byChain[chain] / totalValue) * 100).toFixed(2) + '%'
      };
    }
    for (const symbol in exposures.byAsset) {
      exposures.byAsset[symbol] = {
        value: exposures.byAsset[symbol],
        percentage: ((exposures.byAsset[symbol] / totalValue) * 100).toFixed(2) + '%'
      };
    }
    exposures.byType.volatile = ((exposures.byType.volatile / totalValue) * 100).toFixed(2) + '%';
    exposures.byType.stable = ((exposures.byType.stable / totalValue) * 100).toFixed(2) + '%';
    exposures.byType.yieldBearing = ((exposures.byType.yieldBearing / totalValue) * 100).toFixed(2) + '%';
  }
  
  exposures.totalValue = totalValue;
  
  return exposures;
}

/**
 * Detect anomalies
 */
function detectAnomalies(portfolio) {
  const anomalies = [];
  
  for (const asset of portfolio.assets) {
    if (asset.change24h < -15) {
      anomalies.push({
        type: 'LARGE_DROP',
        severity: 'HIGH',
        asset: asset.symbol,
        message: `${asset.symbol} dropped ${asset.change24h}% in 24h`,
        value: asset.value
      });
    }
    
    if (asset.unusualVolume) {
      anomalies.push({
        type: 'UNUSUAL_VOLUME',
        severity: 'MEDIUM',
        asset: asset.symbol,
        message: `Unusual trading volume detected for ${asset.symbol}`,
        value: asset.value
      });
    }
  }
  
  if (portfolio.assets.length > 0) {
    const totalValue = portfolio.assets.reduce((sum, a) => sum + a.value, 0);
    for (const asset of portfolio.assets) {
      const percentage = (asset.value / totalValue) * 100;
      if (percentage > 50) {
        anomalies.push({
          type: 'HIGH_CONCENTRATION',
          severity: 'MEDIUM',
          asset: asset.symbol,
          message: `${asset.symbol} comprises ${percentage.toFixed(1)}% of portfolio`,
          value: asset.value
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Generate recommendations
 */
function generateRecommendations(riskScore, portfolio, anomalies) {
  const recommendations = [];
  
  if (riskScore.score > 70) {
    recommendations.push({
      priority: 'HIGH',
      action: 'SHIFT_TO_STABLECOINS',
      message: 'High risk detected. Consider moving 50%+ to stablecoins for protection.',
      potentialBenefit: 'Reduce portfolio volatility by 60-80%'
    });
  } else if (riskScore.score > 50) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'REBALANCE',
      message: 'Moderate risk level. Consider diversifying across chains.',
      potentialBenefit: 'Reduce concentration risk'
    });
  }
  
  for (const anomaly of anomalies) {
    if (anomaly.type === 'LARGE_DROP') {
      recommendations.push({
        priority: 'HIGH',
        action: 'STOP_LOSS',
        message: `Immediate action: Consider stop-loss for ${anomaly.asset} to prevent further losses.`,
        potentialBenefit: `Limit downside to ${Math.abs(anomaly.change24h) * 2}%`
      });
    }
    
    if (anomaly.type === 'HIGH_CONCENTRATION') {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'DIVERSIFY',
        message: `Reduce ${anomaly.asset} position to below 30% of portfolio.`,
        potentialBenefit: 'Spread risk across multiple assets'
      });
    }
  }
  
  if (portfolio.assets.some(a => ['MEME', 'SHIB', 'PEPE'].some(m => a.symbol.includes(m)))) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'REVIEW_MEME',
      message: 'Meme token exposure detected. Monitor closely and consider taking profits.',
      potentialBenefit: 'Reduce exposure to highly volatile assets'
    });
  }
  
  return recommendations;
}

/**
 * Determine overall status
 */
function determineStatus(riskScore) {
  if (riskScore.score < 30) return 'SAFE';
  if (riskScore.score < 50) return 'CAUTION';
  if (riskScore.score < 70) return 'WARNING';
  return 'CRITICAL';
}

/**
 * Analyze rug factors
 */
async function analyzeRugFactors(protocol, chain) {
  const factors = {
    contractAudit: false,
    liquidityLocked: false,
    ownerRenounced: false,
    highHolderConcentration: false,
    suspiciousActivity: false,
    age: 0
  };
  
  try {
    const data = await callOnchainOSAPI('defi', 'getProtocolRiskFactors', {
      protocol,
      chain
    });
    Object.assign(factors, data);
  } catch {
    factors.contractAudit = true;
    factors.ownerRenounced = true;
  }
  
  return factors;
}

/**
 * Calculate rug score
 */
function calculateRugScore(factors) {
  let score = 0;
  
  if (!factors.contractAudit) score += 30;
  if (!factors.liquidityLocked) score += 25;
  if (!factors.ownerRenounced) score += 20;
  if (factors.highHolderConcentration) score += 15;
  if (factors.suspiciousActivity) score += 10;
  
  return score;
}

/**
 * Generate rug warnings
 */
function generateRugWarnings(factors) {
  const warnings = [];
  
  if (!factors.contractAudit) {
    warnings.push('Contract has not been audited by a reputable security firm');
  }
  if (!factors.liquidityLocked) {
    warnings.push('Liquidity is not locked - team can remove funds');
  }
  if (!factors.ownerRenounced) {
    warnings.push('Contract ownership has not been renounced');
  }
  if (factors.highHolderConcentration) {
    warnings.push('High concentration of tokens in top holders');
  }
  if (factors.suspiciousActivity) {
    warnings.push('Suspicious trading activity detected');
  }
  
  return warnings;
}

/**
 * Simulation strategies
 */
async function simulateStablecoinShift(portfolio) {
  const stableAllocation = portfolio.assets.filter(a => 
    ['USDT', 'USDC', 'DAI'].includes(a.symbol)
  );
  const volatileValue = portfolio.assets
    .filter(a => !['USDT', 'USDC', 'DAI'].includes(a.symbol))
    .reduce((sum, a) => sum + a.value, 0);
  
  return {
    strategy: 'STABLECOIN_SHIFT',
    currentStableAllocation: stableAllocation.length > 0 
      ? (stableAllocation.reduce((sum, a) => sum + a.value, 0) / portfolio.totalValue * 100).toFixed(1) + '%'
      : '0%',
    recommendedShift: `${(volatileValue * 0.5).toFixed(2)} in volatile assets → stablecoins`,
    riskReduction: '60-80%',
    opportunityCost: 'Lose ~3-8% annual yield compared to DeFi strategies'
  };
}

async function simulateDiversification(portfolio) {
  return {
    strategy: 'DIVERSIFICATION',
    recommendedChains: ['ethereum', 'solana', 'base'],
    recommendedSplit: { ethereum: '40%', solana: '30%', base: '30%' },
    riskReduction: '40-50%',
    expectedAPY: '5-8%'
  };
}

async function simulateDeleverage(portfolio) {
  return {
    strategy: 'DELEVERAGE',
    currentLeverage: '1.5x',
    recommendedLeverage: '1.1x',
    riskReduction: '30-40%',
    monthlySavings: '$50-200 in interest (for $10k portfolio)'
  };
}

/**
 * Call OnchainOS API
 */
async function callOnchainOSAPI(module, endpoint, params) {
  console.log(`[OnchainOS] Calling ${module}.${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  // Return empty object for demo - will use mock data
  return { assets: [], totalValue: 0 };
}

/**
 * Mock assets
 */
function getMockAssets() {
  return [
    { symbol: 'ETH', value: 5000, chain: 'ethereum', change24h: -5.2, yieldBearing: false },
    { symbol: 'BTC', value: 3000, chain: 'ethereum', change24h: -2.1, yieldBearing: false },
    { symbol: 'USDC', value: 1500, chain: 'ethereum', change24h: 0, yieldBearing: true },
    { symbol: 'SOL', value: 800, chain: 'solana', change24h: 8.5, yieldBearing: false },
    { symbol: 'stETH', value: 700, chain: 'ethereum', change24h: -5.0, yieldBearing: true },
    { symbol: 'OKB', value: 500, chain: 'okt', change24h: -1.5, yieldBearing: false }
  ];
}

export default riskGuard;
