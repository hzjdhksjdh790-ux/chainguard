/**
 * Yield Scanner Skill
 * Scans multi-chain DeFi protocols to find optimal yield pools
 * Returns APY rankings and opportunities
 * 
 * @module yieldScanner
 * @requires @okx-web3/onchainos-skills
 */

import { config, SUPPORTED_CHAINS } from '../config.js';

/**
 * Yield Scanner - DeFi yield opportunity discovery
 */
export const yieldScanner = {
  name: 'YieldScanner',
  version: '1.0.0',

  /**
   * Scan for yield opportunities across chains
   * @param {Object} params - Scan parameters
   * @returns {Object} Yield opportunities report
   */
  async scan(params = {}) {
    const {
      chains = SUPPORTED_CHAINS,
      minAPY = config.yield.minAPY,
      maxRisk = 'MEDIUM',
      limit = 20,
      protocols = null
    } = params;

    console.log(`[YieldScanner] Scanning ${chains.length} chains for yield > ${minAPY}%`);
    console.log(`[YieldScanner] Max risk level: ${maxRisk}`);

    const opportunities = [];
    
    // Scan each chain in parallel
    const chainResults = await Promise.all(
      chains.map(chain => scanChainForYields(chain, { minAPY, maxRisk, protocols }))
    );
    
    // Flatten and sort results
    for (const result of chainResults) {
      opportunities.push(...result.pools);
    }
    
    // Sort by APY (highest first)
    opportunities.sort((a, b) => b.apy - a.apy);
    
    // Apply limit
    const topPools = opportunities.slice(0, limit);
    const report = generateYieldReport(topPools, chains);

    console.log(`[YieldScanner] Found ${topPools.length} yield opportunities`);
    
    return report;
  },

  /**
   * Get the best yield opportunity for an asset
   * @param {string} asset - Asset symbol (ETH, USDC, etc.)
   * @param {Object} options - Filter options
   * @returns {Object} Best yield opportunity
   */
  async findBestYield(asset, options = {}) {
    console.log(`[YieldScanner] Finding best yield for ${asset}`);
    
    const report = await this.scan({
      ...options,
      limit: 50 // Get more to ensure best find
    });
    
    // Filter for pools that support the asset
    const compatiblePools = report.topPools.filter(pool => 
      pool.assets.includes(asset) || pool.assets.includes('*')
    );
    
    if (compatiblePools.length === 0) {
      return {
        asset,
        bestYield: null,
        message: `No yield opportunities found for ${asset}`
      };
    }
    
    const best = compatiblePools[0];
    
    return {
      asset,
      bestYield: best,
      alternatives: compatiblePools.slice(1, 4)
    };
  },

  /**
   * Compare yields across protocols for a specific pool
   * @param {string} pool - Pool identifier
   * @param {Array} chains - Chains to compare
   * @returns {Object} Comparison report
   */
  async compareYield(pool, chains = SUPPORTED_CHAINS) {
    console.log(`[YieldScanner] Comparing ${pool} across chains`);
    
    const comparisons = await Promise.all(
      chains.map(chain => getPoolYield(chain, pool))
    );
    
    return {
      pool,
      chains: comparisons.filter(c => c.available),
      recommendation: generateYieldRecommendation(comparisons)
    };
  },

  /**
   * Calculate optimal allocation based on yields and risk
   * @param {Object} params - Portfolio and preferences
   * @returns {Object} Optimal allocation plan
   */
  async calculateOptimalAllocation(params = {}) {
    const { 
      totalAmount,
      assets = ['USDC', 'ETH', 'BTC'],
      riskTolerance = 'MEDIUM',
      preferredChains = SUPPORTED_CHAINS
    } = params;

    console.log(`[YieldScanner] Calculating optimal allocation for ${totalAmount}`);

    const yieldReport = await this.scan({
      chains: preferredChains,
      maxRisk: riskTolerance,
      limit: 100
    });

    const allocation = optimizeAllocation(yieldReport.topPools, totalAmount, assets);

    return {
      totalAmount,
      riskTolerance,
      allocation,
      projectedAPY: calculateWeightedAPY(allocation),
      savings: calculateSavingsVsHolding(allocation, totalAmount)
    };
  }
};

/**
 * Scan a specific chain for yield opportunities
 */
async function scanChainForYields(chain, filters) {
  console.log(`[YieldScanner] Scanning ${chain}...`);
  
  try {
    // OnchainOS DeFi API integration
    const pools = await callOnchainOSAPI('defi', 'getYieldPools', {
      chain,
      ...filters
    });
    
    return { chain, pools: pools.filter(p => validatePool(p, filters)) };
  } catch (error) {
    console.error(`[YieldScanner] Error scanning ${chain}: ${error.message}`);
    return { chain, pools: getMockPools(chain) };
  }
}

/**
 * Get pool yield for a specific chain
 */
async function getPoolYield(chain, poolId) {
  try {
    const yieldData = await callOnchainOSAPI('defi', 'getPoolYield', {
      chain,
      poolId
    });
    
    return {
      chain,
      poolId,
      apy: yieldData.apy,
      tvl: yieldData.tvl,
      available: true
    };
  } catch {
    return { chain, poolId, available: false };
  }
}

/**
 * Validate pool against filters
 */
function validatePool(pool, filters) {
  if (pool.apy < filters.minAPY) return false;
  if (getRiskLevel(pool) > getRiskScore(filters.maxRisk)) return false;
  if (filters.protocols && !filters.protocols.includes(pool.protocol)) return false;
  return true;
}

/**
 * Get risk score from risk level string
 */
function getRiskScore(level) {
  const scores = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  return scores[level] || 2;
}

/**
 * Get risk level from pool data
 */
function getRiskLevel(pool) {
  // Calculate based on various factors
  const factors = {
    tvlWeight: pool.tvl > 10000000 ? 1 : pool.tvl > 1000000 ? 2 : 3,
    ageWeight: pool.age > 365 ? 1 : pool.age > 180 ? 2 : 3,
    auditWeight: pool.audited ? 1 : 3
  };
  
  const avgScore = (factors.tvlWeight + factors.ageWeight + factors.auditWeight) / 3;
  return avgScore <= 1.5 ? 'LOW' : avgScore <= 2.5 ? 'MEDIUM' : 'HIGH';
}

/**
 * Generate yield report
 */
function generateYieldReport(pools, scannedChains) {
  const byChain = {};
  for (const pool of pools) {
    if (!byChain[pool.chain]) byChain[pool.chain] = [];
    byChain[pool.chain].push(pool);
  }
  
  return {
    timestamp: new Date().toISOString(),
    source: 'OKX OnchainOS DeFi API',
    scannedChains,
    topPools: pools,
    byChain,
    summary: {
      totalPools: pools.length,
      avgAPY: pools.length > 0 ? pools.reduce((a, p) => a + p.apy, 0) / pools.length : 0,
      highestAPY: pools[0]?.apy || 0,
      safestHighYield: pools.find(p => getRiskLevel(p) === 'LOW')?.apy || 'N/A'
    },
    recommendations: generateRecommendations(pools)
  };
}

/**
 * Generate recommendations based on yield data
 */
function generateRecommendations(pools) {
  const recommendations = [];
  
  if (pools.length === 0) {
    recommendations.push('No yield opportunities meet your criteria. Consider adjusting filters.');
    return recommendations;
  }
  
  // Best overall
  recommendations.push(`Best yield: ${pools[0].name} on ${pools[0].chain} at ${pools[0].apy}% APY`);
  
  // Safest recommendation
  const safePools = pools.filter(p => getRiskLevel(p) === 'LOW');
  if (safePools.length > 0) {
    recommendations.push(`Safest option: ${safePools[0].name} at ${safePools[0].apy}% APY (LOW risk)`);
  }
  
  // TVL recommendation
  const highTVLPools = pools.filter(p => p.tvl > 10000000);
  if (highTVLPools.length > 0) {
    recommendations.push(`Most liquid: ${highTVLPools[0].name} with $${formatTVL(highTVLPools[0].tvl)} TVL`);
  }
  
  return recommendations;
}

/**
 * Generate yield recommendation from comparison data
 */
function generateYieldRecommendation(comparisons) {
  const available = comparisons.filter(c => c.available);
  if (available.length === 0) {
    return { action: 'NO_OPPORTUNITY', message: 'Pool not available on any specified chain' };
  }
  
  const best = available.sort((a, b) => b.apy - a.apy)[0];
  
  return {
    action: 'SWITCH_CHAIN',
    recommendation: `Move to ${best.chain} for ${best.apy}% APY (saving: ${calculateDifference(comparisons)}%)`,
    details: available
  };
}

/**
 * Optimize allocation across pools
 */
function optimizeAllocation(pools, totalAmount, assets) {
  // Simplified allocation algorithm
  const allocation = [];
  
  // 40% in stablecoin high-yield
  const stablePools = pools.filter(p => p.assets.some(a => ['USDC', 'USDT', 'DAI'].includes(a)));
  if (stablePools.length > 0) {
    const amount = totalAmount * 0.4;
    allocation.push({
      pool: stablePools[0],
      amount,
      percentage: 40,
      projectedYield: amount * (stablePools[0].apy / 100)
    });
  }
  
  // 40% in blue-chip DeFi
  const blueChipPools = pools.filter(p => 
    p.assets.includes('ETH') || p.assets.includes('BTC')
  );
  if (blueChipPools.length > 0) {
    const amount = totalAmount * 0.4;
    allocation.push({
      pool: blueChipPools[0],
      amount,
      percentage: 40,
      projectedYield: amount * (blueChipPools[0].apy / 100)
    });
  }
  
  // 20% in higher risk opportunities
  if (pools.length > 2) {
    const amount = totalAmount * 0.2;
    allocation.push({
      pool: pools[2],
      amount,
      percentage: 20,
      projectedYield: amount * (pools[2].apy / 100)
    });
  }
  
  return allocation;
}

/**
 * Calculate weighted APY for allocation
 */
function calculateWeightedAPY(allocation) {
  if (allocation.length === 0) return 0;
  
  const totalWeight = allocation.reduce((sum, a) => sum + a.percentage, 0);
  const weightedSum = allocation.reduce((sum, a) => 
    sum + (a.pool.apy * a.percentage), 0
  );
  
  return weightedSum / totalWeight;
}

/**
 * Calculate savings vs holding in wallet
 */
function calculateSavingsVsHolding(allocation, totalAmount) {
  const weightedAPY = calculateWeightedAPY(allocation);
  const yearlyYield = totalAmount * (weightedAPY / 100);
  
  return {
    yearly: yearlyYield,
    monthly: yearlyYield / 12,
    daily: yearlyYield / 365
  };
}

/**
 * Call OnchainOS API
 */
async function callOnchainOSAPI(module, endpoint, params) {
  console.log(`[OnchainOS] Calling ${module}.${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  // Return empty array for demo - will use mock pools
  return [];
}

/**
 * Get mock pools for demo
 */
function getMockPools(chain) {
  const mockPools = {
    'ethereum': [
      { name: 'Aave ETH', protocol: 'Aave', chain: 'ethereum', assets: ['ETH'], apy: 3.2, tvl: 15000000000, age: 730, audited: true },
      { name: 'Lido stETH', protocol: 'Lido', chain: 'ethereum', assets: ['ETH'], apy: 3.8, tvl: 12000000000, age: 1000, audited: true },
      { name: 'Curve ETH/USDC', protocol: 'Curve', chain: 'ethereum', assets: ['ETH', 'USDC'], apy: 5.2, tvl: 2000000000, age: 500, audited: true }
    ],
    'solana': [
      { name: 'Marinade stSOL', protocol: 'Marinade', chain: 'solana', assets: ['SOL'], apy: 7.2, tvl: 500000000, age: 400, audited: true },
      { name: 'Raydium SOL/USDC', protocol: 'Raydium', chain: 'solana', assets: ['SOL', 'USDC'], apy: 12.5, tvl: 100000000, age: 200, audited: true }
    ],
    'base': [
      { name: 'Aave Base USDC', protocol: 'Aave', chain: 'base', assets: ['USDC'], apy: 8.5, tvl: 200000000, age: 180, audited: true },
      { name: 'Uniswap Base ETH', protocol: 'Uniswap', chain: 'base', assets: ['ETH', 'USDC'], apy: 15.2, tvl: 50000000, age: 90, audited: false }
    ],
    'bnb': [
      { name: 'PancakeSwap BNB', protocol: 'PancakeSwap', chain: 'bnb', assets: ['BNB'], apy: 4.5, tvl: 800000000, age: 600, audited: true },
      { name: 'Venus BUSD', protocol: 'Venus', chain: 'bnb', assets: ['BUSD'], apy: 6.8, tvl: 300000000, age: 400, audited: true }
    ],
    'okt': [
      { name: 'Cherry USDT', protocol: 'Cherry', chain: 'okt', assets: ['USDT'], apy: 12.0, tvl: 10000000, age: 200, audited: true },
      { name: 'XP.NETWORK', protocol: 'XP.NETWORK', chain: 'okt', assets: ['OKT'], apy: 8.5, tvl: 5000000, age: 150, audited: false }
    ]
  };
  
  return mockPools[chain] || [];
}

/**
 * Helper functions
 */
function formatTVL(tvl) {
  if (tvl >= 1000000000) return (tvl / 1000000000).toFixed(1) + 'B';
  if (tvl >= 1000000) return (tvl / 1000000).toFixed(1) + 'M';
  if (tvl >= 1000) return (tvl / 1000).toFixed(1) + 'K';
  return tvl.toString();
}

function calculateDifference(comparisons) {
  const available = comparisons.filter(c => c.available);
  if (available.length < 2) return 0;
  const max = Math.max(...available.map(c => c.apy));
  const min = Math.min(...available.map(c => c.apy));
  return (max - min).toFixed(2);
}

export default yieldScanner;
