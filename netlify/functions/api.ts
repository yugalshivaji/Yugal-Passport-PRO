import { Handler } from '@netlify/functions';
import axios from 'axios';

export const handler: Handler = async (event, context) => {
  const { path, httpMethod, body, isBase64Encoded } = event;

  // Only allow POST to /api/process
  if (httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const action = path.split('/').pop();

  if (action === 'remove-bg') {
    const REMOVE_BG_API_KEY = event.headers['x-user-api-key'] || process.env.REMOVE_BG_API_KEY;
    if (!REMOVE_BG_API_KEY) {
      return { statusCode: 400, body: JSON.stringify({ error: 'API key missing', code: 'LIMIT_REACHED' }) };
    }

    try {
      // Body should be base64 image data
      const response = await axios.post('https://api.remove.bg/v1.0/removebg', {
        image_file_b64: body,
        size: 'auto'
      }, {
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        responseType: 'arraybuffer'
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'image/png' },
        body: Buffer.from(response.data).toString('base64'),
        isBase64Encoded: true
      };
    } catch (error: any) {
      console.error(error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Background removal failed' }) };
    }
  }

  if (action === 'enhance') {
      // Cloudinary implementation would go here
      return { statusCode: 501, body: 'Enhance not implemented yet' };
  }

  return { statusCode: 404, body: 'Not Found' };
};
