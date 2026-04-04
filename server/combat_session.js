/**
 * Replay-based combat verification.
 * Client records actions (place_ship, cannon_fire) with timestamps.
 * Server replays through simplified simulation and checks if victory is plausible.
 */

const {
  TROOP_STATS, DEFENSE_STATS, SKELETON_GUARD,
  MAX_SHIPS, TROOPS_PER_SHIP, TIME_LIMIT_SEC, SAIL_DELAY_SEC,
  CANNON_DAMAGE, CANNON_INITIAL_ENERGY, CANNON_ENERGY_PER_DESTROY,
  cannonShotCost, VALID_TROOP_TYPES,
} = require('./combat_defs');
const { BUILDING_DEFS } = require('./db');

// ---------- Helpers ----------

const TICK_DT = 0.1;         // 10 Hz simulation
const HP_TOLERANCE = 0.50;   // Accept victory if TH ≤50% HP in server sim

function dist2d(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function findNearest(entity, targets) {
  let best = null;
  let bestDist = Infinity;
  for (const t of targets) {
    if (t.hp <= 0) continue;
    const d = dist2d(entity, t);
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best ? { target: best, dist: bestDist } : null;
}

function moveToward(entity, tx, tz, speed, dt) {
  const dx = tx - entity.x;
  const dz = tz - entity.z;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 0.001) return;
  const step = Math.min(speed * dt, d);
  entity.x += (dx / d) * step;
  entity.z += (dz / d) * step;
}

// Convert grid coordinates to world coordinates (mirrors GDScript _grid_to_local + transform)
function gridToWorld(gridX, gridZ, sizeX, sizeZ, gc) {
  const halfX = gc.grid_extent_x / 2.0;
  const halfZ = gc.grid_extent_z / 2.0;
  const cs = gc.cell_size;
  // _grid_to_local equivalent + center offset for building footprint
  const localX = -halfX + gridX * cs + (sizeX * cs) / 2.0;
  const localZ = -halfZ + gridZ * cs + (sizeZ * cs) / 2.0;
  // Apply grid rotation
  const cosR = Math.cos(gc.grid_rotation);
  const sinR = Math.sin(gc.grid_rotation);
  return {
    x: gc.grid_center_x + localX * cosR - localZ * sinR,
    z: gc.grid_center_z + localX * sinR + localZ * cosR,
  };
}

// ---------- Replay Verifier ----------

function verifyReplay({ defenderBuildings, actions, claimedResult, gridConfig }) {
  // Validate grid config
  if (!gridConfig || !gridConfig.cell_size || gridConfig.cell_size <= 0) {
    return { valid: false, reason: 'Missing or invalid grid_config' };
  }

  // Validate actions
  if (!actions || !Array.isArray(actions)) {
    return { valid: false, reason: 'No actions' };
  }

  // Validate timestamps are monotonic
  for (let i = 1; i < actions.length; i++) {
    if (actions[i].t < actions[i - 1].t - 0.01) {
      return { valid: false, reason: 'Actions have non-monotonic timestamps' };
    }
  }

  // Init buildings with world coordinates
  const buildings = defenderBuildings.map(b => {
    const def = BUILDING_DEFS[b.type];
    const size = def?.size || [2, 2];
    const pos = gridToWorld(b.grid_x, b.grid_z, size[0], size[1], gridConfig);
    return {
      id: b.id, type: b.type, level: b.level,
      hp: b.hp, maxHp: b.max_hp,
      x: pos.x, z: pos.z,
    };
  });

  const troops = [];
  const guards = [];
  const defenses = [];
  let townHallId = null;
  let nextTroopId = 0;
  let shipsPlaced = 0;
  const pendingSpawns = []; // { time, troopType, troopLevel, x, z }

  // Cannon energy tracking
  let cannonEnergy = CANNON_INITIAL_ENERGY;
  let cannonShotsFired = 0;

  // Init defenses & guards
  for (const b of buildings) {
    if (b.type === 'town_hall') townHallId = b.id;

    if (b.type === 'turret') {
      const s = DEFENSE_STATS.turret[b.level] || DEFENSE_STATS.turret[1];
      defenses.push({ buildingId: b.id, damage: s.damage, fireRate: s.fireRate, detectRange: s.detectRange, x: b.x, z: b.z, timer: 0 });
    }
    if (b.type === 'archer_tower') {
      const s = DEFENSE_STATS.archer_tower[b.level] || DEFENSE_STATS.archer_tower[1];
      defenses.push({ buildingId: b.id, damage: s.damage, fireRate: s.fireRate, detectRange: s.detectRange, x: b.x, z: b.z, timer: 0 });
    }
    if (b.type === 'tombstone') {
      for (let i = 0; i < (b.level || 1); i++) {
        const angle = (Math.PI * 2 * i) / (b.level || 1);
        guards.push({
          hp: SKELETON_GUARD.hp, damage: SKELETON_GUARD.damage,
          atkSpeed: SKELETON_GUARD.atkSpeed, moveSpeed: SKELETON_GUARD.moveSpeed,
          detectionRadius: SKELETON_GUARD.detectionRadius, attackRange: SKELETON_GUARD.attackRange,
          x: b.x + Math.cos(angle) * 0.15, z: b.z + Math.sin(angle) * 0.15,
          targetId: null, atkTimer: 0,
        });
      }
    }
  }

  // Sort actions by time
  const sortedActions = [...actions].sort((a, b) => a.t - b.t);
  let actionIdx = 0;
  let time = 0;

  while (time < TIME_LIMIT_SEC) {
    // Process actions at current time
    while (actionIdx < sortedActions.length && sortedActions[actionIdx].t <= time) {
      const act = sortedActions[actionIdx++];

      if (act.type === 'place_ship' && shipsPlaced < MAX_SHIPS) {
        const troopType = act.troopType;
        if (!VALID_TROOP_TYPES.includes(troopType)) continue;
        // Queue troop spawn after sail delay
        const level = act.troopLevel || 1;
        pendingSpawns.push({ time: act.t + SAIL_DELAY_SEC, troopType, troopLevel: level, x: act.x, z: act.z });
        shipsPlaced++;
      }

      if (act.type === 'cannon_fire') {
        const cost = cannonShotCost(cannonShotsFired + 1);
        if (cannonEnergy < cost) {
          return { valid: false, reason: `Cannon fired without enough energy (had ${cannonEnergy}, needed ${cost})` };
        }
        cannonEnergy -= cost;
        cannonShotsFired++;
        const target = buildings.find(b => b.id === act.buildingId && b.hp > 0);
        if (target) {
          target.hp -= CANNON_DAMAGE;
          if (target.hp <= 0) cannonEnergy += CANNON_ENERGY_PER_DESTROY;
        }
      }
    }

    // Deploy pending troops
    for (let i = pendingSpawns.length - 1; i >= 0; i--) {
      if (pendingSpawns[i].time <= time) {
        const sp = pendingSpawns.splice(i, 1)[0];
        const stats = TROOP_STATS[sp.troopType]?.[sp.troopLevel] || TROOP_STATS[sp.troopType]?.[1];
        if (!stats) continue;
        for (let j = 0; j < TROOPS_PER_SHIP; j++) {
          troops.push({
            id: nextTroopId++, hp: stats.hp, damage: stats.damage,
            atkSpeed: stats.atkSpeed, moveSpeed: stats.moveSpeed, range: stats.range,
            x: sp.x + (j - 1) * 0.05, z: sp.z, atkTimer: 0,
          });
        }
      }
    }

    // Move troops toward nearest building/guard
    for (const t of troops) {
      if (t.hp <= 0) continue;
      const nearB = findNearest(t, buildings);
      const nearG = findNearest(t, guards);
      let target = null, targetDist = Infinity;
      if (nearB) { target = nearB.target; targetDist = nearB.dist; }
      if (nearG && nearG.dist < targetDist) { target = nearG.target; targetDist = nearG.dist; }
      if (!target) continue;
      if (targetDist <= t.range) {
        t.atkTimer += TICK_DT;
        if (t.atkTimer >= t.atkSpeed) {
          t.atkTimer -= t.atkSpeed;
          target.hp -= t.damage;
          if (target.hp <= 0) cannonEnergy += CANNON_ENERGY_PER_DESTROY;
        }
      } else {
        moveToward(t, target.x, target.z, t.moveSpeed, TICK_DT);
      }
    }

    // Defense attacks
    for (const d of defenses) {
      const bld = buildings.find(b => b.id === d.buildingId);
      if (!bld || bld.hp <= 0) continue;
      d.timer += TICK_DT;
      if (d.timer < d.fireRate) continue;
      const aliveTroops = troops.filter(t => t.hp > 0);
      const near = findNearest(d, aliveTroops);
      if (!near || near.dist > d.detectRange) continue;
      d.timer -= d.fireRate;
      near.target.hp -= d.damage;
    }

    // Guard AI
    for (const g of guards) {
      if (g.hp <= 0) continue;
      const aliveTroops = troops.filter(t => t.hp > 0);
      const near = findNearest(g, aliveTroops);
      if (!near || near.dist > g.detectionRadius) continue;
      if (near.dist <= g.attackRange) {
        g.atkTimer += TICK_DT;
        if (g.atkTimer >= g.atkSpeed) {
          g.atkTimer -= g.atkSpeed;
          near.target.hp -= g.damage;
        }
      } else {
        moveToward(g, near.target.x, near.target.z, g.moveSpeed, TICK_DT);
      }
    }

    // Check town hall
    const th = buildings.find(b => b.id === townHallId);
    if (th && th.hp <= 0) break;

    // Check all troops dead + no pending
    const anyAlive = troops.some(t => t.hp > 0);
    if (!anyAlive && pendingSpawns.length === 0 && actionIdx >= sortedActions.length) break;

    time += TICK_DT;
  }

  // Evaluate
  const th = buildings.find(b => b.id === townHallId);
  const townHallDestroyed = th ? th.hp <= 0 : false;
  const townHallHpPct = th ? Math.max(0, th.hp) / th.maxHp : 0;
  const buildingsDestroyed = buildings.filter(b => b.hp <= 0).length;

  if (claimedResult === 'victory') {
    if (townHallDestroyed || townHallHpPct <= HP_TOLERANCE) {
      return { valid: true, reason: 'Victory verified', townHallDestroyed: true, buildingsDestroyed, townHallHpPct };
    }
    return { valid: false, reason: `TH at ${Math.round(townHallHpPct * 100)}% HP in sim (need ≤${HP_TOLERANCE * 100}%)`, townHallDestroyed: false, buildingsDestroyed, townHallHpPct };
  }

  // Defeat always accepted
  return { valid: true, reason: 'Defeat accepted', townHallDestroyed: false, buildingsDestroyed, townHallHpPct };
}

module.exports = { verifyReplay };
