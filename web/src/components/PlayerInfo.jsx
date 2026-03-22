import { colors } from '../styles/theme';

export default function PlayerInfo({ playerState }) {
  if (!playerState) return null;

  return (
    <div style={styles.wrap}>
      <span style={styles.name}>{playerState.player_name}</span>
      <span style={styles.trophies}>🏆 {playerState.trophies || 0}</span>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    top: 90,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    pointerEvents: 'none',
    zIndex: 10,
  },
  name: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 700,
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
  },
  trophies: {
    color: '#ccc',
    fontSize: 14,
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
  },
};
