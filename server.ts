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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

app.post('/api/enhance', upload.single('image'), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image provided' });

    // Upload to Cloudinary with restoration
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'yugal_passport',
          transformation: [{ effect: 'gen_restore' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    }) as any;

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

app.post('/api/remove-bg', upload.single('image'), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image provided' });

    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      {
        image_file_b64: file.buffer.toString('base64'),
        size: 'auto'
      },
      {
        headers: {
          'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Background removal error:', error);
    res.status(500).json({ error: 'Failed to remove background' });
  }
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
