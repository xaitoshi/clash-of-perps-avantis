export const colors = {
  bg: 'rgba(20, 22, 40, 0.92)',
  bgSolid: '#141628',
  border: 'rgba(255, 255, 255, 0.12)',
  accent: '#e8b830',
  gold: '#e8b830',
  wood: '#6ab344',
  ore: '#8a9aaa',
  red: '#c0392b',
  green: '#27ae60',
  text: '#e0e0e0',
  textDim: '#888',
  danger: '#e74c3c',
};

export const panel = {
  background: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  padding: 16,
  color: colors.text,
  backdropFilter: 'blur(10px)',
};

export const button = (color = '#2a6db5') => ({
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: color,
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'filter 0.15s',
});
