/* eslint-env node */
import axios from 'axios';

// Simple in-memory cache for the Serverless function environment.
// Note: In a true lambda environment, this might be lost on cold starts but will rebuild correctly.
let cachedToken = null;
let tokenExpiry = 0;

export const getSalesforceToken = async () => {
  const now = Date.now();
  
  // Return cached token if valid for at least 60 more seconds
  if (cachedToken && tokenExpiry > now + 60000) {
    return cachedToken;
  }

  const { SF_INSTANCE_URL, SF_CONNECTED_APP_CLIENT_ID, SF_CONNECTED_APP_CLIENT_SECRET } = process.env;

  if (!SF_INSTANCE_URL || !SF_CONNECTED_APP_CLIENT_ID || !SF_CONNECTED_APP_CLIENT_SECRET) {
    throw new Error('Missing Salesforce environment variables.');
  }

  const cleanInstanceUrl = SF_INSTANCE_URL.replace(/\/$/, '');
  const tokenUrl = `${cleanInstanceUrl}/services/oauth2/token`;

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SF_CONNECTED_APP_CLIENT_ID,
      client_secret: SF_CONNECTED_APP_CLIENT_SECRET
    });

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, issued_at } = response.data;
    
    cachedToken = access_token;
    // Assuming token is valid for typically 2 hours (120 minutes x 60 x 1000 = 7,200,000 ms)
    // You can adjust TTL based on Salesforce org settings
    tokenExpiry = parseInt(issued_at, 10) + (120 * 60 * 1000); 

    return cachedToken;
  } catch (error) {
    const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error('Error fetching Salesforce token:', details);
    throw new Error(`Authentication with Salesforce failed: ${details}`);
  }
};
