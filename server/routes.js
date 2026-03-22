const express = require('express');
const db = require('./db');

const router = express.Router();

// ---------- Auth Middleware ----------

function auth(req, res, next) {
  const token = req.headers['x-token'];
  if (!token) return res.status(401).json({ error: 'Missing x-token header' });
  const player = db.authenticatePlayer(token);
  if (!player) return res.status(401).json({ error: 'Invalid token' });
  req.player = player;
  next();
}

// ==================== PLAYERS ====================

// Register a new player
router.post('/players/register', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  try {
    const result = db.registerPlayer(name.trim());
    const state = db.getFullPlayerState(result.id);
    res.json({ ...state, token: result.token });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Name already taken' });
    }
    throw e;
  }
});

// Login (get state by token)
router.get('/players/me', auth, (req, res) => {
  const state = db.getFullPlayerState(req.player.id);
  res.json(state);
});

// ==================== RESOURCES ====================

// Get current resources
router.get('/resources', auth, (req, res) => {
  res.json(db.getResources(req.player.id));
});

// Add resources
router.post('/resources/add', auth, (req, res) => {
  const { gold = 0, wood = 0, ore = 0 } = req.body;
  if (typeof gold !== 'number' || typeof wood !== 'number' || typeof ore !== 'number') {
    return res.status(400).json({ error: 'gold, wood, ore must be numbers' });
  }
  if (gold < 0 || wood < 0 || ore < 0) {
    return res.status(400).json({ error: 'Values must be non-negative. Use /resources/subtract instead' });
  }
  const result = db.addResources(req.player.id, gold, wood, ore);
  res.json(result);
});

// Subtract resources
router.post('/resources/subtract', auth, (req, res) => {
  const { gold = 0, wood = 0, ore = 0 } = req.body;
  if (typeof gold !== 'number' || typeof wood !== 'number' || typeof ore !== 'number') {
    return res.status(400).json({ error: 'gold, wood, ore must be numbers' });
  }
  if (gold < 0 || wood < 0 || ore < 0) {
    return res.status(400).json({ error: 'Values must be non-negative' });
  }
  const result = db.subtractResources(req.player.id, gold, wood, ore);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// Set resources directly
router.post('/resources/set', auth, (req, res) => {
  const { gold, wood, ore } = req.body;
  const current = db.getResources(req.player.id);
  const newGold = typeof gold === 'number' ? Math.max(0, gold) : current.gold;
  const newWood = typeof wood === 'number' ? Math.max(0, wood) : current.wood;
  const newOre = typeof ore === 'number' ? Math.max(0, ore) : current.ore;
  const result = db.addResources(req.player.id,
    newGold - current.gold,
    newWood - current.wood,
    newOre - current.ore
  );
  res.json(result);
});

// ==================== BUILDINGS ====================

// List all player buildings
router.get('/buildings', auth, (req, res) => {
  res.json(db.getPlayerBuildings(req.player.id));
});

// Place a building
router.post('/buildings/place', auth, (req, res) => {
  const { type, grid_x, grid_z, grid_index = 0 } = req.body;
  if (!type || grid_x == null || grid_z == null) {
    return res.status(400).json({ error: 'type, grid_x, grid_z are required' });
  }
  if (!Number.isInteger(grid_x) || !Number.isInteger(grid_z)) {
    return res.status(400).json({ error: 'grid_x and grid_z must be integers' });
  }
  const result = db.placeBuilding(req.player.id, type, grid_x, grid_z, grid_index);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// Upgrade a building
router.post('/buildings/:id/upgrade', auth, (req, res) => {
  const buildingId = parseInt(req.params.id, 10);
  if (isNaN(buildingId)) return res.status(400).json({ error: 'Invalid building ID' });
  const result = db.upgradeBuilding(req.player.id, buildingId);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// Remove a building
router.delete('/buildings/:id', auth, (req, res) => {
  const buildingId = parseInt(req.params.id, 10);
  if (isNaN(buildingId)) return res.status(400).json({ error: 'Invalid building ID' });
  const result = db.removeBuilding(req.player.id, buildingId);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// ==================== TROOPS ====================

// Get troop levels
router.get('/troops', auth, (req, res) => {
  res.json(db.getTroopLevels(req.player.id));
});

// Upgrade a troop
router.post('/troops/:type/upgrade', auth, (req, res) => {
  const { type } = req.params;
  const result = db.upgradeTroop(req.player.id, type);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// ==================== MATCHMAKING ====================

// Find enemy with closest trophies
router.get('/find-enemy', auth, (req, res) => {
  const result = db.findEnemy(req.player.id);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

// ==================== TROPHIES ====================

// Get trophies
router.get('/trophies', auth, (req, res) => {
  res.json({ trophies: db.getTrophies(req.player.id) });
});

// Recalculate trophies from current buildings & troops
router.post('/trophies/recalculate', auth, (req, res) => {
  const result = db.recalculateTrophies(req.player.id);
  res.json(result);
});

// Get trophy table (what each building is worth)
router.get('/trophies/table', (req, res) => {
  res.json(db.TROPHY_TABLE);
});

// ==================== FULL STATE ====================

// Get full player state (resources + buildings + troops)
router.get('/state', auth, (req, res) => {
  const state = db.getFullPlayerState(req.player.id);
  if (!state) return res.status(404).json({ error: 'Player not found' });
  res.json(state);
});

module.exports = { router, auth };
