import { colors } from '../styles/theme';

export default function ResourceBar({ resources, sendToGodot }) {
  const items = [
    { key: 'gold', label: 'Gold', color: colors.gold },
    { key: 'wood', label: 'Wood', color: colors.wood },
    { key: 'ore', label: 'Ore', color: colors.ore },
  ];

  return (
    <div style={styles.bar}>
      {items.map(({ key, label, color }) => (
        <div key={key} style={{ ...styles.badge, borderColor: color + '55' }}>
          <span style={{ color, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
          <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
            {(resources[key] || 0).toLocaleString()}
          </span>
          <button
            style={{ ...styles.plusBtn, background: color + '33', borderColor: color + '66' }}
            onClick={() => sendToGodot('add_resources', { resource: key })}
          >+</button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 12,
    pointerEvents: 'all',
    zIndex: 10,
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '8px 16px',
    borderRadius: 12,
    border: '1.5px solid',
    background: 'rgba(15, 16, 30, 0.88)',
    backdropFilter: 'blur(8px)',
    minWidth: 100,
    position: 'relative',
  },
  plusBtn: {
    position: 'absolute',
    right: -14,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1.5px solid',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
};
