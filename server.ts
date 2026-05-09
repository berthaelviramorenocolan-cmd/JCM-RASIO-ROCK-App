
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API proxy endpoint for radio info
  app.get('/api/radio-info', async (req, res) => {
    try {
      const response = await fetch('https://sp.aljania.com/cp/get_info.php?p=8120');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching radio info:', error);
      res.status(500).json({ error: 'Failed to fetch radio info' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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
