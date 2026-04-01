/**
 * ChainGuard Configuration
 * Central configuration for supported chains, API settings, and alert thresholds
 * 
 * @module config
 */

// Supported blockchain networks
export const SUPPORTED_CHAINS = [
  'ethereum',    // Ethereum Mainnet
  'solana',      // Solana
  'base',        // Base (Coinbase L2)
  'bnb',         // BNB Smart Chain
  'okt'          // X Layer (OKT)
];

// Chain metadata
export const CHAIN_INFO = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    explorer: 'https://etherscan.io',
    icon: '🔷',
    rpc: process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com'
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    chainId: 'mainnet-beta',
    explorer: 'https://solscan.io',
    icon: '☀️',
    rpc: process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
  },
  base: {
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    explorer: 'https://basescan.org',
    icon: '🔵',
    rpc: process.env.BASE_RPC || 'https://mainnet.base.org'
  },
  bnb: {
    name: 'BNB Chain',
    symbol: 'BNB',
    chainId: 56,
    explorer: 'https://bscscan.com',
    icon: '🟡',
    rpc: process.env.BNB_RPC || 'https://bsc-dataseed.binance.org'
  },
  okt: {
    name: 'X Layer',
    symbol: 'OKB',
    chainId: 66,
    explorer: 'https://www.oklink.com/oktc',
    icon: '🟠',
    rpc: process.env.OKT_RPC || 'https://rpc.oktc.link'
  }
};

// Default configuration
export const config = {
  // API Configuration
  api: {
    // OKX OnchainOS API settings
    onchainos: {
      baseUrl: process.env.ONCHAINOS_BASE_URL || 'https://onchainos.okx.com/api/v1',
      apiKey: process.env.ONCHAINOS_API_KEY || '',
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000 // 1 second
    },
    
    // Market Data API
    market: {
      baseUrl: process.env.MARKET_API_URL || 'https://www.okx.com/api/v5',
      rateLimit: {
        requestsPerSecond: 10,
        burst: 20
      }
    },
    
    // Wallet API
    wallet: {
      baseUrl: process.env.WALLET_API_URL || 'https://www.okx.com/api/v5',
      supportedWallets: ['MetaMask', 'OKX Wallet', 'WalletConnect', 'Coinbase Wallet']
    }
  },

  // Alert Configuration
  alerts: {
    // Price drop threshold percentage
    priceDropThreshold: 10, // 10% drop triggers alert
    
    // Check interval in milliseconds
    checkInterval: 60000, // 1 minute
    
    // Alert channels
    channels: {
      telegram: {
        enabled: false,
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || ''
      },
      email: {
        enabled: false,
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: parseInt(process.env.SMTP_PORT) || 587,
        email: process.env.ALERT_EMAIL || '',
        password: process.env.ALERT_PASSWORD || ''
      },
      webhook: {
        enabled: false,
        url: process.env.ALERT_WEBHOOK_URL || ''
      }
    },
    
    // Quiet hours (no alerts)
    quietHours: {
      enabled: false,
      start: '22:00', // 10 PM
      end: '08:00'    // 8 AM
    }
  },

  // Yield Scanner Configuration
  yield: {
    // Minimum APY threshold
    minAPY: 5, // 5%
    
    // Maximum risk level
    maxRisk: 'MEDIUM',
    
    // Protocol whitelist (empty = all allowed)
    whitelistedProtocols: [
      'Aave',
      'Lido',
      'Curve',
      'Uniswap',
      'PancakeSwap',
      'Venus',
      'Marinade',
      'Raydium',
      'Cherry'
    ],
    
    // Blacklisted protocols
    blacklistedProtocols: [],
    
    // Refresh interval for yield data
    refreshInterval: 300000, // 5 minutes
  },

  // Risk Guard Configuration
  risk: {
    // Risk score threshold for alerts (0-100)
    alertThreshold: 70,
    
    // Monitoring interval
    monitorInterval: 60000, // 1 minute
    
    // Sensitivity levels
    sensitivity: {
      LOW: {
        priceDropThreshold: 20,
        volatilityWeight: 0.5
      },
      MEDIUM: {
        priceDropThreshold: 10,
        volatilityWeight: 1.0
      },
      HIGH: {
        priceDropThreshold: 5,
        volatilityWeight: 1.5
      }
    },
    
    // Max portfolio concentration per asset
    maxConcentration: 50, // percentage
    
    // Meme token exposure warning threshold
    memeTokenWarning: 10 // percentage
  },

  // Agentic Wallet Configuration
  agenticWallet: {
    // Enable autonomous trading
    enabled: false,
    
    // Maximum transaction value (USD)
    maxTxValue: 100,
    
    // Require user confirmation for trades
    requireConfirmation: true,
    
    // Approved actions (empty = all allowed)
    approvedActions: [],
    
    // Slippage tolerance
    slippageTolerance: 0.5, // 0.5%
    
    // Gas price strategy
    gasStrategy: 'ECO', // 'FAST', 'ECO', 'INSTANT'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
    format: 'json', // 'json', 'text'
    destination: 'console', // 'console', 'file', 'both'
    file: {
      path: './logs/chainguard.log',
      maxSize: '10m',
      maxFiles: 5
    }
  },

  // Feature Flags
  features: {
    // Enable/disable specific features
    priceMonitoring: true,
    yieldScanning: true,
    riskAnalysis: true,
    rugPullDetection: true,
    autoProtection: false,
    agenticTrading: false
  }
};

/**
 * Get configuration for a specific chain
 * @param {string} chain - Chain identifier
 * @returns {Object} Chain configuration
 */
export function getChainConfig(chain) {
  return CHAIN_INFO[chain] || null;
}

/**
 * Check if a chain is supported
 * @param {string} chain - Chain identifier
 * @returns {boolean}
 */
export function isChainSupported(chain) {
  return SUPPORTED_CHAINS.includes(chain);
}

/**
 * Get API configuration for OnchainOS
 * @returns {Object} OnchainOS API config
 */
export function getOnchainOSConfig() {
  return {
    ...config.api.onchainos,
    baseUrl: config.api.onchainos.baseUrl
  };
}

/**
 * Merge user configuration with defaults
 * @param {Object} userConfig - User configuration overrides
 * @returns {Object} Merged configuration
 */
export function mergeConfig(userConfig) {
  return deepMerge(config, userConfig);
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
export function validateConfig() {
  const errors = [];
  
  // Check required environment variables
  if (!process.env.ONCHAINOS_API_KEY) {
    errors.push('ONCHAINOS_API_KEY is not set');
  }
  
  // Check chain support
  for (const chain of config.api.onchainos.supportedChains || []) {
    if (!isChainSupported(chain)) {
      errors.push(`Unsupported chain: ${chain}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default config;
