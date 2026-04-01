/**
 * ChainGuard - OKX OnchainOS AI Agent Skill
 * Main entry point for the on-chain asset protection system
 * 
 * @module ChainGuard
 * @description Provides real-time price monitoring, yield scanning, and risk management
 *              for multi-chain DeFi portfolios through OKX OnchainOS
 */

import { priceMonitor } from './skills/priceMonitor.js';
import { yieldScanner } from './skills/yieldScanner.js';
import { riskGuard } from './skills/riskGuard.js';
import { config, SUPPORTED_CHAINS } from './config.js';

/**
 * ChainGuard Skill - Main export
 * An AI Agent Skill for OKX OnchainOS that provides comprehensive on-chain asset protection
 */
export const ChainGuard = {
  name: 'ChainGuard',
  version: '1.0.0',
  description: 'On-chain asset protection with real-time monitoring, yield optimization, and risk management',
  
  // Skill metadata for OnchainOS
  metadata: {
    author: 'ChainGuard Team',
    supportedChains: SUPPORTED_CHAINS,
    capabilities: [
      'price_monitoring',
      'yield_scanning', 
      'risk_detection',
      'wallet_analysis',
      'alert_notification'
    ],
    apiVersion: '2024.1'
  },

  /**
   * Initialize ChainGuard with user configuration
   * @param {Object} userConfig - User configuration overrides
   * @returns {Object} Initialized ChainGuard instance
   */
  async initialize(userConfig = {}) {
    console.log('[ChainGuard] Initializing...');
    console.log(`[ChainGuard] Supported chains: ${SUPPORTED_CHAINS.join(', ')}`);
    
    const mergedConfig = { ...config, ...userConfig };
    
    return {
      config: mergedConfig,
      skills: {
        priceMonitor,
        yieldScanner,
        riskGuard
      },
      status: 'ready',
      // Include methods directly
      execute: ChainGuard.execute.bind(ChainGuard),
      runFullAudit: ChainGuard.runFullAudit.bind(ChainGuard)
    };
  },

  /**
   * Execute ChainGuard based on user intent
   * @param {string} intent - User's intent (price_alert, yield_scan, risk_check)
   * @param {Object} params - Parameters for the intent
   * @returns {Object} Execution result
   */
  async execute(intent, params = {}) {
    console.log(`[ChainGuard] Executing intent: ${intent}`);
    
    switch (intent) {
      case 'price_alert':
        return await priceMonitor.checkPrices(params);
      
      case 'yield_scan':
        return await yieldScanner.scan(params);
      
      case 'risk_check':
        return await riskGuard.analyze(params);
      
      case 'full_audit':
        return await this.runFullAudit(params);
      
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  },

  /**
   * Run a comprehensive portfolio audit
   * @param {Object} params - Portfolio wallet address and options
   * @returns {Object} Full audit report
   */
  async runFullAudit(params = {}) {
    console.log('[ChainGuard] Running full portfolio audit...');
    
    const { walletAddress, chains = SUPPORTED_CHAINS } = params;
    
    // Run all checks in parallel
    const [priceReport, yieldReport, riskReport] = await Promise.all([
      priceMonitor.checkPrices({ assets: ['ETH', 'BTC', 'SOL'] }),
      yieldScanner.scan({ chains, limit: 10 }),
      riskGuard.analyze({ walletAddress, chains })
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      walletAddress,
      reports: {
        prices: priceReport,
        yields: yieldReport,
        risk: riskReport
      },
      summary: this.generateSummary(priceReport, yieldReport, riskReport)
    };
  },

  /**
   * Generate a human-readable summary from all reports
   */
  generateSummary(priceReport, yieldReport, riskReport) {
    return {
      overallHealth: riskReport.riskScore < 50 ? 'GOOD' : 'WARNING',
      bestYield: yieldReport.topPools?.[0]?.apy || 'N/A',
      priceAlerts: priceReport.alerts?.length || 0,
      recommendations: [
        ...(riskReport.recommendations || []),
        ...(yieldReport.recommendations || [])
      ]
    };
  }
};

// MCP Protocol Integration for OKX OnchainOS
export const chainguardMCPTool = {
  name: 'chainguard_analyze',
  description: 'Comprehensive on-chain asset protection analysis using ChainGuard',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['price_alert', 'yield_scan', 'risk_check', 'full_audit'],
        description: 'The type of analysis to perform'
      },
      walletAddress: {
        type: 'string',
        description: 'Wallet address to analyze (for risk_check and full_audit)'
      },
      assets: {
        type: 'array',
        items: { type: 'string' },
        description: 'Assets to monitor (for price_alert)'
      },
      chains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Chains to scan (for yield_scan)'
      }
    },
    required: ['action']
  },
  
  async handler(params) {
    const chainGuard = await ChainGuard.initialize();
    return await chainGuard.execute(params.action, params);
  }
};

// Default export
export default ChainGuard;
