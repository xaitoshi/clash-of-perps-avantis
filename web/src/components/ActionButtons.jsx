import { memo, useCallback } from 'react';
import { useSend, useUI } from '../hooks/useGodot';
import { cartoonBtn } from '../styles/theme';
import buildIcon from '../assets/resources/Gemini_Generated_Image_dl9plxdl9plxdl9p-removebg-preview.png';
import attackIcon from '../assets/resources/file_000000006858720a8f860ee8da33335a.png';
import chartIcon from '../assets/resources/chart.png';

function ActionButtons() {
  const { sendToGodot, setFuturesOpen } = useSend();
  const { enemyMode } = useUI();

  const handleReturnHome = useCallback(() => sendToGodot('return_home'), [sendToGodot]);
  const handleFindEnemy = useCallback(() => sendToGodot('find_enemy'), [sendToGodot]);
  const handleOpenShop = useCallback(() => sendToGodot('open_shop'), [sendToGodot]);
  const handleOpenTrade = useCallback(() => setFuturesOpen(true), [setFuturesOpen]);

  if (enemyMode.active) {
    return (
      <div style={styles.wrapRight}>
        <div style={styles.enemyBadge}>
          ⚔️ {enemyMode.name} • {enemyMode.trophies} 🏆
        </div>
        <button
          style={cartoonBtn('#FF8F00', '#E65100')}
          onClick={handleReturnHome}
        >
          🏠 Return Home
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={styles.wrapLeft}>
        <button
          style={styles.attackBtn}
          onClick={handleFindEnemy}
        >
          <img src={attackIcon} alt="attack" style={styles.attackIconImg} />
          <span style={styles.btnText}>ATTACK!</span>
        </button>
      </div>
      <div style={styles.wrapRight}>
        <button
          style={styles.tradeBtn}
          onClick={handleOpenTrade}
        >
          <div style={styles.notificationBadge}>14</div>
          <img src={chartIcon} alt="trade" style={styles.chartIconImg} />
          <span style={styles.btnText}>TRADE</span>
        </button>
        <button
          style={styles.buildBtn}
          onClick={handleOpenShop}
        >
          <div style={styles.notificationBadge}>!</div>
          <img src={buildIcon} alt="build" style={styles.buildIconImg} />
          <span style={styles.btnText}>BUILD</span>
        </button>
      </div>
    </>
  );
}

export default memo(ActionButtons);

const base = {
  position: 'fixed',
  bottom: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  pointerEvents: 'all',
  zIndex: 10,
};

const clashBtnBase = {
  borderRadius: 16,
  border: '1.5px solid #0b1a2e',
  background: 'linear-gradient(180deg, #5A8BD1 0%, #3465A1 30%, #204C87 75%, #183966 100%)',
  boxShadow: 'inset 0px 3px 3px 0px rgba(255, 255, 255, 0.5), inset 0px -6px 0px 0px #142F55, inset 0px -8px 12px 1px rgba(0, 0, 0, 0.35), 0px 6px 10px 0px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.1s, filter 0.1s',
  userSelect: 'none',
  padding: 0,
  outline: 'none',
  position: 'relative',
};

// Use an active state in standard CSS instead of inline pseudo-classes for scale effect, 
// but since we are using inline styles throughout, we just rely on standard transition.

const styles = {
  wrapLeft: { ...base, left: 20 },
  wrapRight: { ...base, right: 20 },
  buildBtn: {
    ...clashBtnBase,
    width: 120,
    height: 110,
  },
  attackBtn: {
    ...clashBtnBase,
    width: 120,
    height: 110,
  },
  tradeBtn: {
    ...clashBtnBase,
    width: 120,
    height: 110,
  },
  buildIconImg: {
    width: 115,
    height: 115,
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.4))',
    marginBottom: -25,
    marginTop: -10,
    marginLeft: -10,
    transform: 'translate(-4px, -6px)',
  },
  attackIconImg: {
    width: 140,
    height: 140,
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))',
    marginBottom: -30,
    marginTop: -35,
  },
  chartIconImg: {
    width: 110,
    height: 110,
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))',
    marginBottom: -20,
    marginTop: -10,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 900,
    WebkitTextStroke: '2px #0f2342',
    textShadow: '0px 3px 0px #0b1a2e, 0px 4px 6px rgba(0,0,0,0.6)',
    letterSpacing: '0.8px',
    zIndex: 2,
    position: 'relative',
    pointerEvents: 'none',
    textTransform: 'uppercase',
  },
  btnTextSmall: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 900,
    WebkitTextStroke: '0.5px #001A3B',
    textShadow: '0 2px 0 #001A3B',
    letterSpacing: '0.5px',
    zIndex: 2,
    position: 'relative',
    pointerEvents: 'none',
    textTransform: 'uppercase',
  },
  enemyBadge: {
    background: 'linear-gradient(180deg, #B71C1C, #7F0000)',
    border: '3px solid #E53935',
    borderRadius: 16,
    padding: '8px 16px',
    color: '#fff',
    fontSize: 15,
    fontWeight: 800,
    textAlign: 'center',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
    boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: '#E63946',
    color: '#fff',
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
    zIndex: 5,
  },
  starsContainer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 2,
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
    zIndex: 5,
  },
  star: {
    color: '#FFD700',
    fontSize: 16,
    WebkitTextStroke: '1px #B8860B',
  }
};
