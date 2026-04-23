import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';
import sharp from 'sharp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configure Cloudinary (Removed global config, strictly user-provided)
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: '50mb' }));

// --- API ROUTES ---

app.post('/api/process', upload.array('images'), async (req: any, res) => {
  try {
    const files = req.files as any[];
    const { 
      photoWidth, 
      photoHeight, 
      spacing, 
      margin, 
      borderSize, 
      totalCopies 
    } = req.body;

    const width = parseInt(photoWidth) || 35; // mm
    const height = parseInt(photoHeight) || 45; // mm
    const space = parseInt(spacing) || 5; // mm
    const pdfMargin = parseInt(margin) || 10; // mm
    const border = parseInt(borderSize) || 0; // mm
    const total = parseInt(totalCopies) || 8;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // A4 Dimensions at 300 DPI
    const A4_WIDTH = 595.28; // 210mm in points
    const A4_HEIGHT = 841.89; // 297mm in points
    const mmToPt = 2.83465;
    const itemWidthPt = width * mmToPt;
    const itemHeightPt = height * mmToPt;
    const spacePt = space * mmToPt;
    const marginPt = pdfMargin * mmToPt;
    const availableWidth = A4_WIDTH - 2 * marginPt;
    const availableHeight = A4_HEIGHT - 2 * marginPt;

    // Calculate how many fit per row and column to center the grid
    const cols = Math.floor((availableWidth + spacePt) / (itemWidthPt + spacePt));
    
    // Total width used by items + spaces
    const gridWidth = cols * itemWidthPt + (cols - 1) * spacePt;
    // Starting offset to center horizontally
    const startX = marginPt + (availableWidth - gridWidth) / 2;

    const doc = new PDFDocument({ size: 'A4', margin: pdfMargin * mmToPt });
    const stream = res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    let currentX = startX;
    let currentY = marginPt;
    let itemsInRow = 0;
    let itemsPlaced = 0;

    // Pre-process images sequentially to avoid repeating sharp logic too much
    const imageBuffers = [];
    for (const file of files) {
      const buffer = await sharp(file.buffer)
        .resize({
          width: Math.round(width * mmToPt * 2), 
          height: Math.round(height * mmToPt * 2),
          fit: 'cover',
        })
        .extend({
          top: border, bottom: border, left: border, right: border,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();
      imageBuffers.push(buffer);
    }

    while (itemsPlaced < total) {
      // Pick images sequentially if multiple are uploaded
      const buffer = imageBuffers[itemsPlaced % imageBuffers.length];

      // If row finished
      if (itemsInRow === cols) {
        itemsInRow = 0;
        currentX = startX;
        currentY += itemHeightPt + spacePt;
      }

      // If page finished
      if (currentY + itemHeightPt > A4_HEIGHT - marginPt) {
        doc.addPage();
        currentX = startX;
        currentY = marginPt;
        itemsInRow = 0;
      }

      doc.image(buffer, currentX, currentY, {
        width: itemWidthPt,
        height: itemHeightPt
      });

      currentX += itemWidthPt + spacePt;
      itemsInRow++;
      itemsPlaced++;
    }

    doc.end();
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Failed to process images' });
  }
});

app.post('/api/enhance', async (req: any, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // Use user-provided keys if available in headers
    const userCloudName = req.headers['x-user-cloud-name'];
    const userApiKey = req.headers['x-user-cloud-key'];
    const userApiSecret = req.headers['x-user-cloud-secret'];

    if (!userCloudName || !userApiKey || !userApiSecret) {
      return res.status(401).json({ error: 'Cloudinary credentials missing. Please configure them in Settings.', code: 'LIMIT_REACHED' });
    }

    const result = await new Promise((resolve, reject) => {
        // Pass configuration directly to the upload call to avoid singleton issues
        cloudinary.uploader.upload(`data:image/jpeg;base64,${image}`, {
            cloud_name: userCloudName,
            api_key: userApiKey,
            api_secret: userApiSecret,
            folder: 'yugal_passport',
            transformation: [{ effect: 'gen_restore' }]
        }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    }) as any;

    res.json({ url: result.secure_url });
  } catch (error: any) {
    console.error('Enhancement error:', error);
    const status = error.http_code || 500;
    res.status(status).json({ 
      error: 'AI Enhancement failed', 
      details: error.message || 'Check your Cloudinary credits and configuration.',
      code: status === 401 || status === 403 || status === 429 ? 'LIMIT_REACHED' : 'GENERIC_ERROR'
    });
  }
});

app.post('/api/remove-bg', async (req: any, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const userKey = req.headers['x-user-api-key'];
    const apiKey = userKey;

    if (!apiKey) {
      return res.status(401).json({ error: 'Remove.bg API key missing', code: 'LIMIT_REACHED' });
    }

    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      {
        image_file_b64: image,
        size: 'auto'
      },
      {
        headers: {
          'X-Api-Key': apiKey,
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error: any) {
    let details = error.message;
    if (error.response && error.response.data) {
      try {
          // remove.bg returns binary in some cases even for errors if not careful, 
          // but usually it's a JSON string if requested or error occurs
          const decoder = new TextDecoder("utf-8");
          const errorData = decoder.decode(error.response.data);
          details = errorData || error.message;
      } catch (e) {
          details = error.message;
      }
    }
    console.error('Background removal error:', details);
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: 'AI Background removal failed', 
      details: details,
      code: status === 429 || status === 401 || status === 403 ? 'LIMIT_REACHED' : 'GENERIC_ERROR'
    });
  }
});

// Fallback for API routes to prevent landing on HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// --- VITE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
