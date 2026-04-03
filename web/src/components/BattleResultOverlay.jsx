import { memo } from 'react';

import goldIcon from '../assets/resources/gold_bar.png';
import woodIcon from '../assets/resources/wood_bar.png';
import stoneIcon from '../assets/resources/stone_bar.png';

const fmt = (n) => (n || 0).toLocaleString().replace(/,/g, ' ');

function BattleResultOverlay({ result, onClose }) {
  if (!result) return null;

  const isVictory = result.type === 'victory';

  return (
    <div style={styles.backdrop}>
      <div style={styles.content}>
        
        {/* Title Group */}
        <div style={styles.titleGroup}>
          <div style={styles.glowBackground}></div>
          <div style={styles.titleText}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div style={styles.subtitleText}>
            {isVictory ? 'This village is free once again!' : 'All troops were lost!'}
          </div>
        </div>

        {/* Loot Panel */}
        {isVictory && result.loot && (
          <div style={styles.panel}>
            <div style={styles.panelTitle}>You received</div>
            <div style={styles.resourceRow}>
               <LootItem icon={goldIcon} value={result.loot.gold} />
               <LootItem icon={woodIcon} value={result.loot.wood} />
               <LootItem icon={stoneIcon} value={result.loot.ore} />
            </div>
          </div>
        )}

        {/* Defeat Panel */}
        {!isVictory && (
           <div style={styles.panel}>
            <div style={styles.panelTitle}>Better luck next time!</div>
            <div style={styles.subtitleText}>
              Upgrade your troops and try again.
            </div>
           </div>
        )}

        {/* Return Button */}
        <div style={styles.btnWrap} onClick={onClose}>
          <span style={styles.btnText}>Return</span>
        </div>
      </div>
    </div>
  );
}

function LootItem({ icon, value }) {
  if (!value) return null;
  return (
    <div style={styles.lootItem}>
      <img src={icon} alt="" style={styles.lootIcon} />
      <span style={styles.lootValue}>{fmt(value)}</span>
    </div>
  );
}

const textOutline = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 3px 6px rgba(0,0,0,0.8)';

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'all',
    animation: 'fadeIn 0.3s ease-out',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 640,
    gap: 20,
    padding: '0 20px',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  glowBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 300,
    height: 100,
    background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)',
    opacity: 0.8,
    zIndex: -1,
    filter: 'blur(16px)',
  },
  titleText: {
    fontSize: 56,
    fontWeight: 900,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontStyle: 'italic',
    WebkitTextStroke: '2px #0a0a0a',
    textShadow: '0 4px 0 #0a0a0a, 0 8px 16px rgba(0,0,0,0.8)',
    lineHeight: 1,
    zIndex: 2,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: 900,
    color: '#fff',
    textShadow: textOutline,
    marginTop: 8,
    textAlign: 'center',
  },
  panel: {
    width: '100%',
    background: '#3c453c', // Dark greenish-grey
    borderRadius: 12,
    padding: '16px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -4px 0 rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.5)',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: '#fff',
    textShadow: textOutline,
  },
  resourceRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 36,
  },
  lootItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  lootIcon: {
    width: 52,
    height: 52,
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
    transform: 'translateY(0)',
    transition: 'transform 0.2s',
  },
  lootValue: {
    fontSize: 16,
    fontWeight: 900,
    color: '#fff',
    textShadow: textOutline,
  },
  btnWrap: {
    background: 'linear-gradient(180deg, #74c4ff 0%, #3ba4f4 100%)',
    borderRadius: 6,
    padding: '12px 48px',
    cursor: 'pointer',
    marginTop: 12,
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -4px 0 #1e70b3, 0 8px 16px rgba(0,0,0,0.3)',
    border: '2px solid #0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 900,
    textShadow: textOutline,
    letterSpacing: '0.5px',
    transform: 'translateY(-1px)',
  }
};

export default memo(BattleResultOverlay);
