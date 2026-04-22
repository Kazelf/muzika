import jsonServer from 'json-server';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as mm from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const uploadDir = path.join(__dirname, 'public', 'music');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

server.use(middlewares);

server.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  let extractedLyrics = '';
  try {
    const metadata = await mm.parseFile(req.file.path);
    if (metadata.common.lyrics && metadata.common.lyrics.length > 0) {
      extractedLyrics = metadata.common.lyrics.join('\n');
    }
  } catch (err) {
    console.error('Error parsing metadata:', err);
  }

  res.json({ 
    url: `/music/${req.file.filename}`,
    lyrics: extractedLyrics
  });
});

server.use(router);

server.listen(9999, () => {
  console.log('JSON Server with custom upload is running on port 9999');
});
