import { colors, panel } from '../styles/theme';

export default function BarracksPanel({ building, buildingDefs, troopLevels, sendToGodot, onClose }) {
  if (!building || !building.is_sawmill) return null;

  const troops = buildingDefs?.troops || {};

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Barracks (Lv. {building.level})</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!building.is_enemy && building.level < building.max_level && (
          <button style={styles.upgradeBtn} onClick={() => sendToGodot('upgrade_building')}>
            Upgrade Barracks
          </button>
        )}

        <div style={styles.sep} />
        <h3 style={styles.troopsTitle}>Troops</h3>

        <div style={styles.troopList}>
          {Object.entries(troops).map(([name, tdef]) => {
            const lvl = troopLevels[name] || 1;
            const isMax = lvl >= 3;
            const nextCost = !isMax && tdef.costs?.[String(lvl + 1)];

            return (
              <div key={name} style={styles.troopCard}>
                <div style={styles.troopHeader}>
                  <span style={styles.troopName}>{tdef.display}</span>
                  <span style={styles.troopLvl}>LVL {lvl}</span>
                </div>
                {building.is_enemy ? null : isMax ? (
                  <span style={styles.maxLvl}>MAX</span>
                ) : (
                  <div style={styles.troopActions}>
                    <span style={styles.troopCost}>
                      {nextCost && Object.entries(nextCost).map(([res, amt]) => (
                        amt > 0 && <span key={res} style={{ color: colors[res] }}>{res}: {amt}  </span>
                      ))}
                    </span>
                    <button
                      style={styles.troopBtn}
                      onClick={() => sendToGodot('upgrade_troop', { troop_name: name })}
                    >
                      {lvl === 0 ? 'Train' : 'Upgrade'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'all',
  },
  panel: {
    ...panel,
    width: 360,
    maxHeight: '75vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { margin: 0, fontSize: 20, color: colors.accent },
  closeBtn: { background: 'none', border: 'none', color: '#999', fontSize: 20, cursor: 'pointer' },
  upgradeBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: colors.green,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 8,
  },
  sep: { height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' },
  troopsTitle: { margin: '0 0 8px', fontSize: 16, color: '#ccc' },
  troopList: { display: 'flex', flexDirection: 'column', gap: 8 },
  troopCard: {
    padding: '10px 14px',
    borderRadius: 10,
    background: 'rgba(30, 32, 55, 0.9)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  troopHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  troopName: { fontSize: 14, fontWeight: 600, color: '#fff' },
  troopLvl: { fontSize: 12, color: colors.accent },
  troopActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  troopCost: { fontSize: 12 },
  troopBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#2a6db5',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  maxLvl: { color: colors.green, fontSize: 13, fontWeight: 600 },
};
