/* eslint-env node */
import axios from 'axios';
import { Buffer } from 'node:buffer';
import { getSalesforceToken } from './sfAuth.js';

export const handler = async (event) => {
  try {
    const token = await getSalesforceToken();
    const { SF_INSTANCE_URL } = process.env;
    
    // Determine the actual path using rawUrl which is 100% reliable
    const requestUrl = new URL(event.rawUrl);
    const path = requestUrl.pathname.replace('/api/dw/', '');
    
    const cleanInstanceUrl = SF_INSTANCE_URL.replace(/\/$/, '');
    const url = `${cleanInstanceUrl}/services/apexrest/dw/v1/${path}`;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (event.headers['x-dw-token']) {
      headers['x-dw-token'] = event.headers['x-dw-token'];
    }

    const { httpMethod, body, queryStringParameters } = event;

    // Send the request to Salesforce
    const config = {
      method: httpMethod,
      url: url,
      headers,
      params: queryStringParameters,
      validateStatus: () => true // Allow us to forward the exact status code
    };

    if (body) {
      if (event.isBase64Encoded) {
        config.data = Buffer.from(body, 'base64').toString('utf-8');
      } else {
        config.data = body;
      }
    }

    const response = await axios(config);

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('Proxy Error:', error.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: false, error: { code: 'SERVER_ERROR', message: error.stack || error.message } })
    };
  }
};
