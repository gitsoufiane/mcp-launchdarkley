// Load environment variables from .env file if present
import dotenv from 'dotenv';
dotenv.config();
// Environment variables or configuration for LaunchDarkly API
export const LD_API_KEY = process.env.LD_API_KEY;
export const LD_BASE_URL = process.env.LD_BASE_URL || 'https://app.launchdarkly.com/api/v2';
// Verify required environment variables
if (!LD_API_KEY) {
    console.error('Error: LD_API_KEY environment variable is required');
    process.exit(1);
}
