import { colors } from '../styles/theme';

export default function BuildingInfoPanel({ building, sendToGodot }) {
  if (!building || building.is_sawmill) return null;

  const ratio = building.max_hp > 0 ? building.hp / building.max_hp : 1;
  const isMaxLevel = building.level >= building.max_level;
  const barColor = ratio > 0.5 ? colors.green : ratio > 0.25 ? colors.gold : colors.danger;

  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <div style={styles.title}>{building.name} (Lv. {building.level})</div>

        <div style={styles.barBg}>
          <div style={{ ...styles.barFill, width: `${ratio * 100}%`, background: barColor }} />
        </div>
        <div style={styles.hpText}>HP: {building.hp} / {building.max_hp}</div>

        {!building.is_enemy && (
          <>
            {isMaxLevel ? (
              <div style={styles.maxLevel}>MAX LEVEL</div>
            ) : (
              <>
                <div style={styles.cost}>
                  {Object.entries(building.upgrade_cost || {}).map(([res, amount]) => (
                    <span key={res} style={{ color: colors[res] || '#fff' }}>
                      {res}: {amount}
                    </span>
                  ))}
                </div>
                <button style={styles.upgradeBtn} onClick={() => sendToGodot('upgrade_building')}>
                  Upgrade
                </button>
              </>
            )}
          </>
        )}

        <button style={styles.closeBtn} onClick={() => sendToGodot('deselect_building')}>✕</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'all',
    zIndex: 10,
  },
  panel: {
    background: 'rgba(15, 16, 30, 0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '14px 20px',
    color: '#fff',
    minWidth: 260,
    position: 'relative',
    backdropFilter: 'blur(8px)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.accent,
    marginBottom: 8,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
  hpText: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 8,
  },
  cost: {
    display: 'flex',
    gap: 12,
    fontSize: 13,
    marginBottom: 8,
  },
  maxLevel: {
    color: colors.green,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  upgradeBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: colors.green,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 10,
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 16,
    cursor: 'pointer',
  },
};
