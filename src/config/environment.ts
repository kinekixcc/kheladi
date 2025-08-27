// Environment configuration for development vs production
export const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
export const isProduction = process.env.NODE_ENV === 'production';

// Feature flags
export const showTestFeatures = isDevelopment;
export const showDebugInfo = isDevelopment;

// You can also set this manually for testing
// export const showTestFeatures = true; // Force show test features
// export const showTestFeatures = false; // Force hide test features

