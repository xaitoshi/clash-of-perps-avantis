import { memo, useCallback } from 'react';
import { useSend, useUI } from '../hooks/useGodot';

import goldIcon from '../assets/resources/gold_bar.png';
import woodIcon from '../assets/resources/wood_bar.png';
import stoneIcon from '../assets/resources/stone_bar.png';

const RES_ICONS = { gold: goldIcon, wood: woodIcon, ore: stoneIcon };
const RES_COLORS = {
  gold: '#FFD700',
  wood: '#8BC34A',
  ore: '#90A4AE',
};

function CollectButtons() {
  const { sendToGodot } = useSend();
  const { collectibles } = useUI();

  const handleCollect = useCallback((serverId) => {
    sendToGodot('collect_resource', { server_id: serverId });
  }, [sendToGodot]);

  if (!collectibles || collectibles.length === 0) return null;

  return (
    <>
      {collectibles.map((c) => (
        <div
          key={c.server_id}
          style={{
            position: 'fixed',
            left: c.position.x - 24,
            top: c.position.y - 56,
            zIndex: 15,
            pointerEvents: 'all',
          }}
        >
          <button
            style={{
              ...styles.btn,
              borderColor: RES_COLORS[c.resource] || '#FFD700',
              boxShadow: `0 4px 12px ${RES_COLORS[c.resource] || '#FFD700'}66`,
            }}
            onClick={() => handleCollect(c.server_id)}
          >
            <img src={RES_ICONS[c.resource] || goldIcon} alt={c.resource} style={styles.icon} />
            <span style={styles.amount}>+{c.amount}</span>
          </button>
        </div>
      ))}
    </>
  );
}

const styles = {
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    background: 'rgba(0, 0, 0, 0.7)',
    border: '2px solid #FFD700',
    borderRadius: 14,
    padding: '6px 10px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    backdropFilter: 'blur(4px)',
  },
  icon: {
    width: 28,
    height: 28,
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
  amount: {
    fontSize: 12,
    fontWeight: 900,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
};

export default memo(CollectButtons);
