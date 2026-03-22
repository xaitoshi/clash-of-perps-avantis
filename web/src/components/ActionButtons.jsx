import { colors } from '../styles/theme';

export default function ActionButtons({ enemyMode, sendToGodot }) {
  if (enemyMode.active) {
    return (
      <div style={styles.wrap}>
        <div style={styles.enemyInfo}>
          Attacking: {enemyMode.name} [{enemyMode.trophies} 🏆]
        </div>
        <button style={{ ...styles.btn, background: '#8b5e1a' }} onClick={() => sendToGodot('return_home')}>
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <button style={{ ...styles.btn, background: '#2a5a8a' }} onClick={() => sendToGodot('find_enemy')}>
        Find Enemy
      </button>
      <button style={{ ...styles.btn, background: '#8b2a2a' }} onClick={() => sendToGodot('attack')}>
        Attack
      </button>
      <button style={{ ...styles.btn, background: '#2a6db5' }} onClick={() => sendToGodot('open_shop')}>
        Build
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'all',
    zIndex: 10,
  },
  btn: {
    padding: '14px 32px',
    borderRadius: 12,
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: 160,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  enemyInfo: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    padding: '8px 0',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
  },
};
