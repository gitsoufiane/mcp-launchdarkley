import { ldRequest } from './api.js';
import { LD_API_KEY, LD_BASE_URL } from './config.js';
async function testLaunchDarkly() {
    console.log('Starting testLaunchDarkly function');
    console.log(`LD_API_KEY (first 5 chars): ${LD_API_KEY?.substring(0, 5)}...`);
    console.log(`LD_BASE_URL: ${LD_BASE_URL}`);
    try {
        console.log('Preparing to make API request');
        const projectKey = 'default';
        const environmentKey = 'production';
        console.log(`Making request for project: ${projectKey}, environment: ${environmentKey}`);
        const response = await ldRequest(`/projects/${projectKey}/environments/${environmentKey}/experiments`, 'GET', undefined, true);
        console.log('API request completed');
        console.log('API Response:', response);
    }
    catch (error) {
        console.error('Error occurred during API request:', error);
    }
    console.log('testLaunchDarkly function completed');
}
console.log('Script started');
testLaunchDarkly().then(() => console.log('Script finished')).catch(error => console.error('Unhandled error:', error));
