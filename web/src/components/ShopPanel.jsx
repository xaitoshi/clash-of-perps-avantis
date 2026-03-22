import { colors, panel } from '../styles/theme';

export default function ShopPanel({ buildingDefs, sendToGodot, onClose }) {
  const buildings = buildingDefs?.buildings || {};

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Build</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.list}>
          {Object.entries(buildings).map(([id, def]) => (
            <button
              key={id}
              style={styles.item}
              onClick={() => sendToGodot('start_placement', { building_id: id })}
            >
              <div style={styles.itemHeader}>
                <span style={styles.itemName}>{def.name}</span>
                <span style={styles.itemSize}>{def.cells[0]}×{def.cells[1]}</span>
              </div>
              <div style={styles.costRow}>
                {Object.entries(def.cost || {}).map(([res, amount]) => (
                  amount > 0 && (
                    <span key={res} style={{ color: colors[res] || '#fff', fontSize: 13 }}>
                      {res}: {amount}
                    </span>
                  )
                ))}
                {Object.keys(def.cost || {}).length === 0 && (
                  <span style={{ color: colors.green, fontSize: 13 }}>Free</span>
                )}
              </div>
            </button>
          ))}
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
    width: 340,
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 22,
    color: colors.accent,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: 20,
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflowY: 'auto',
  },
  item: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(30, 32, 55, 0.9)',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#fff',
    transition: 'background 0.15s',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 600,
  },
  itemSize: {
    fontSize: 12,
    color: '#999',
  },
  costRow: {
    display: 'flex',
    gap: 12,
  },
};
