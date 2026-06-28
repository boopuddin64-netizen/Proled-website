/**
 * Vercel Speed Insights Initialization
 * Automatically tracks web vitals and performance metrics
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false, // Set to true for debugging in development
  sampleRate: 1, // Track 100% of page views (adjust as needed)
});
