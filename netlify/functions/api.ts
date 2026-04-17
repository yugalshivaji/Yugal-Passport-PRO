import { Handler } from '@netlify/functions';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

export const handler: Handler = async (event) => {
  const { path, httpMethod, body } = event;

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
      const payload = JSON.parse(body || '{}');
      const imageBase64 = payload.image;

      if (!imageBase64) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided' }) };
      }

      const response = await axios.post('https://api.remove.bg/v1.0/removebg', {
        image_file_b64: imageBase64,
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
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: 'Background removal failed',
          details: error.response?.data?.toString() || error.message 
        }) 
      };
    }
  }

  if (action === 'enhance') {
      const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
      const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
      const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
          return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary configuration missing' }) };
      }

      cloudinary.config({
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET
      });

      try {
          const payload = JSON.parse(body || '{}');
          const imageBase64 = payload.image;

          if (!imageBase64) {
              return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided' }) };
          }

          const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload(`data:image/jpeg;base64,${imageBase64}`, {
                  folder: 'yugal_passport',
                  transformation: [{ effect: 'gen_restore' }]
              }, (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
              });
          }) as any;

          return {
              statusCode: 200,
              body: JSON.stringify({ url: result.secure_url })
          };
      } catch (error: any) {
          console.error(error);
          return { statusCode: 500, body: JSON.stringify({ error: 'Enhancement failed' }) };
      }
  }

  return { statusCode: 404, body: 'Not Found' };
};
