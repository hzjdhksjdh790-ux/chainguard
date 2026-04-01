/**
 * ChainGuard Demo Script
 * Run this to see ChainGuard in action
 */

import { ChainGuard } from './src/index.js';
import { priceMonitor } from './src/skills/priceMonitor.js';
import { yieldScanner } from './src/skills/yieldScanner.js';
import { riskGuard } from './src/skills/riskGuard.js';

async function runDemo() {
  console.log('='.repeat(60));
  console.log('ChainGuard Demo - OKX OnchainOS AI Agent Skill');
  console.log('='.repeat(60));
  console.log('');

  // Initialize
  console.log('Initializing ChainGuard...');
  const guard = await ChainGuard.initialize();
  console.log(`   Status: ${guard.status}`);
  console.log('');

  // 1. Price Monitoring Demo
  console.log('-'.repeat(60));
  console.log('Price Monitor Demo');
  console.log('-'.repeat(60));
  const priceReport = await priceMonitor.checkPrices({
    assets: ['ETH', 'BTC', 'SOL', 'OKB'],
    dropThreshold: 10
  });
  console.log(`   Checked ${priceReport.summary.totalAssets} assets`);
  console.log(`   Alerts: ${priceReport.summary.alertCount}`);
  console.log(`   Worst: ${priceReport.summary.worstPerformer}`);
  console.log('');

  // 2. Yield Scanner Demo
  console.log('-'.repeat(60));
  console.log('Yield Scanner Demo');
  console.log('-'.repeat(60));
  const yieldReport = await yieldScanner.scan({
    chains: ['ethereum', 'solana', 'base', 'bnb', 'okt'],
    minAPY: 5,
    limit: 5
  });
  console.log(`   Found ${yieldReport.summary.totalPools} pools`);
  console.log(`   Highest APY: ${yieldReport.summary.highestAPY}%`);
  console.log(`   Average APY: ${yieldReport.summary.avgAPY.toFixed(2)}%`);
  console.log('   Top 3 pools:');
  yieldReport.topPools.slice(0, 3).forEach((pool, i) => {
    console.log(`     ${i + 1}. ${pool.name} on ${pool.chain}: ${pool.apy}% APY`);
  });
  console.log('');

  // 3. Risk Analysis Demo
  console.log('-'.repeat(60));
  console.log('Risk Guard Demo');
  console.log('-'.repeat(60));
  const riskReport = await riskGuard.analyze({
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f12345',
    chains: ['ethereum', 'solana', 'base', 'bnb', 'okt'],
    sensitivity: 'MEDIUM'
  });
  console.log(`   Risk Score: ${riskReport.riskScore.score}/100 (${riskReport.riskScore.level})`);
  console.log(`   Status: ${riskReport.overallStatus}`);
  console.log(`   Portfolio Value: $${riskReport.portfolio.totalValue.toLocaleString()}`);
  console.log(`   Exposures:`);
  console.log(`     - Volatile: ${riskReport.exposures.byType.volatile}`);
  console.log(`     - Stable: ${riskReport.exposures.byType.stable}`);
  console.log(`     - Yield-bearing: ${riskReport.exposures.byType.yieldBearing}`);
  console.log('');

  // 4. Full Audit Demo
  console.log('-'.repeat(60));
  console.log('Full Portfolio Audit');
  console.log('-'.repeat(60));
  const fullReport = await guard.runFullAudit({
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f12345'
  });
  console.log(`   Overall Health: ${fullReport.summary.overallHealth}`);
  console.log(`   Price Alerts: ${fullReport.summary.priceAlerts}`);
  console.log(`   Recommendations: ${fullReport.summary.recommendations.length}`);
  console.log('');

  console.log('='.repeat(60));
  console.log('Demo completed successfully!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. Set ONCHAINOS_API_KEY in .env for real data');
  console.log('2. Customize thresholds in src/config.js');
  console.log('3. Integrate with Claude Code or your AI agent');
}

runDemo().catch(console.error);
