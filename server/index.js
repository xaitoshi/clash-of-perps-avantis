const express = require('express');
const cors = require('cors');
const http = require('http');
const { router } = require('./routes');
const { setupWebSocket, getOnlinePlayers } = require('./websocket');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url } = req;
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${method}\x1b[0m ${url} \x1b[90m${status} ${ms}ms\x1b[0m`);
  });
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Clash Multiplayer Server',
    version: '1.0.0',
    online_players: getOnlinePlayers().length,
  });
});

// Online players list
app.get('/api/online', (req, res) => {
  res.json(getOnlinePlayers());
});

// All game API routes
app.use('/api', router);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);

// WebSocket on same server
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Clash server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`API docs: POST /api/players/register, GET /api/players/me, ...`);
});
