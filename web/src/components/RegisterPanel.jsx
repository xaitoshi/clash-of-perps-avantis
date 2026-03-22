import { useState } from 'react';
import { colors } from '../styles/theme';

export default function RegisterPanel({ sendToGodot }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      sendToGodot('register', { name: name.trim() });
    }
  };

  return (
    <div style={styles.overlay}>
      <form style={styles.panel} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Enter Your Name</h2>
        <input
          style={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Player name..."
          maxLength={20}
          autoFocus
        />
        <button type="submit" style={styles.btn}>PLAY</button>
      </form>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    pointerEvents: 'all',
  },
  panel: {
    background: 'rgba(15, 16, 30, 0.95)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: '28px 32px',
    width: 340,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    margin: 0,
    textAlign: 'center',
    fontSize: 24,
    color: colors.accent,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(30,32,55,0.9)',
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    outline: 'none',
  },
  btn: {
    padding: '14px 0',
    borderRadius: 12,
    border: 'none',
    background: colors.green,
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
