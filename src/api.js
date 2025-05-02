import fetch from 'node-fetch';
import { LD_API_KEY, LD_BASE_URL } from './config.js';
// Log the first 5 characters of the API key to verify it's loaded
console.log(`LD_API_KEY (first 5 chars): ${LD_API_KEY?.substring(0, 5)}...`);
console.log(`LD_BASE_URL: ${LD_BASE_URL}`);
// Helper function to make authenticated requests to LaunchDarkly API
export async function ldRequest(endpoint, method = 'GET', body, rawResponse = false) {
    const headers = {
        'Authorization': `${LD_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const url = `${LD_BASE_URL}${endpoint}`;
    console.log(`Sending request to: ${url}`);
    console.log('Request options:', JSON.stringify({ ...options, headers: { ...options.headers, Authorization: '***' } }, null, 2));
    try {
        const response = await fetch(url, options);
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        const responseText = await response.text();
        console.log('Response body:', responseText);
        if (!response.ok) {
            console.error(`LaunchDarkly API error (${response.status} ${response.statusText}):`, responseText);
            throw new Error(`LaunchDarkly API error: ${response.status} ${response.statusText}`);
        }
        if (rawResponse) {
            return responseText;
        }
        try {
            return JSON.parse(responseText);
        }
        catch (parseError) {
            console.error('Error parsing JSON response:', responseText);
            throw new Error('Invalid JSON response from LaunchDarkly API');
        }
    }
    catch (error) {
        console.error('Error calling LaunchDarkly API:', error);
        throw error;
    }
}
