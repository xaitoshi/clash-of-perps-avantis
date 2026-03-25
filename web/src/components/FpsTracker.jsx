import { useEffect, useRef, useState, memo } from 'react';

const FPS_DROP_THRESHOLD = 40;
const FPS_CRITICAL_THRESHOLD = 25;
const HISTORY_SIZE = 120;

function FpsTracker() {
  const [perf, setPerf] = useState(null);
  const historyRef = useRef([]);
  const prevPerfRef = useRef(null);
  const lastDropLogRef = useRef(0);
  const [sparkPoints, setSparkPoints] = useState('');

  useEffect(() => {
    function onPerf(e) {
      const data = e.detail;
      setPerf(data);

      // Update sparkline history
      const hist = historyRef.current;
      hist.push(data.fps);
      if (hist.length > HISTORY_SIZE) hist.shift();
      setSparkPoints(buildSparkline(hist));

      // Log FPS drops to console with full context
      const now = Date.now();
      if (data.fps < FPS_DROP_THRESHOLD && now - lastDropLogRef.current > 2000) {
        lastDropLogRef.current = now;
        const prev = prevPerfRef.current;
        const severity = data.fps < FPS_CRITICAL_THRESHOLD ? 'CRITICAL' : 'WARNING';
        const style = data.fps < FPS_CRITICAL_THRESHOLD
          ? 'color: #ff4444; font-weight: bold; font-size: 14px'
          : 'color: #ffaa00; font-weight: bold; font-size: 13px';

        console.groupCollapsed(`%c[FPS ${severity}] ${data.fps} FPS`, style);
        console.log(`State: ${data.state}`);
        console.log(`Troops: ${data.troops} | Guards: ${data.guards}`);
        console.log(`Turrets: ${data.turrets} | Bullets: ${data.bullets} | Projectiles: ${data.projectiles}`);
        console.log(`Buildings: ${data.buildings} | Ships: ${data.ships}`);
        console.log(`Draw calls: ${data.draw_calls} | Objects: ${data.objects} | Nodes: ${data.nodes}`);
        if (prev) {
          const changes = [];
          const d = (key, label) => {
            const delta = data[key] - prev[key];
            if (delta !== 0) changes.push(`${label} ${delta > 0 ? '+' : ''}${delta}`);
          };
          d('troops', 'troops');
          d('guards', 'guards');
          d('bullets', 'bullets');
          d('projectiles', 'projectiles');
          d('draw_calls', 'draw_calls');
          d('nodes', 'nodes');
          if (changes.length > 0) {
            console.log(`Changes: ${changes.join(', ')}`);
          }
        }
        console.groupEnd();
      }
      prevPerfRef.current = data;
    }

    window.addEventListener('godot-perf', onPerf);
    return () => window.removeEventListener('godot-perf', onPerf);
  }, []);

  if (!perf) return null;

  const fpsColor = perf.fps >= 55 ? '#44ff44'
    : perf.fps >= FPS_DROP_THRESHOLD ? '#aaff44'
    : perf.fps >= FPS_CRITICAL_THRESHOLD ? '#ffaa00'
    : '#ff4444';

  return (
    <div style={styles.container}>
      <div style={styles.fpsRow}>
        <span style={{ ...styles.fpsNumber, color: fpsColor }}>{perf.fps}</span>
        <span style={styles.fpsLabel}>FPS</span>
      </div>
      {sparkPoints && (
        <svg width="100" height="24" style={styles.sparkline}>
          <polyline
            points={sparkPoints}
            fill="none"
            stroke={fpsColor}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line
            x1="0" y1={24 - (FPS_DROP_THRESHOLD / 60) * 24}
            x2="100" y2={24 - (FPS_DROP_THRESHOLD / 60) * 24}
            stroke="#ff444466" strokeWidth="0.5" strokeDasharray="3,3"
          />
        </svg>
      )}
      <div style={styles.statsGrid}>
        <Stat label="U" val={perf.troops} />
        <Stat label="G" val={perf.guards} />
        <Stat label="T" val={perf.turrets} />
        <Stat label="B" val={perf.bullets + perf.projectiles} />
        <Stat label="D" val={perf.draw_calls} />
        <Stat label="N" val={perf.nodes} />
      </div>
      <div style={styles.state}>{perf.state}</div>
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div style={styles.statItem}>
      <span style={styles.statIcon}>{label}</span>
      <span style={styles.statVal}>{val}</span>
    </div>
  );
}

function buildSparkline(history) {
  const len = history.length;
  if (len < 2) return '';
  const step = 100 / (len - 1);
  return history.map((fps, i) => {
    const x = i * step;
    const y = 24 - Math.min(fps / 60, 1) * 24;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

const styles = {
  container: {
    position: 'fixed',
    top: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    background: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 10,
    padding: '6px 12px',
    pointerEvents: 'auto',
    fontFamily: 'monospace',
    color: '#fff',
    fontSize: 11,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    minWidth: 120,
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  fpsRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  fpsNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 1,
  },
  fpsLabel: {
    fontSize: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  sparkline: {
    display: 'block',
    marginTop: 2,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px 8px',
    marginTop: 2,
  },
  statItem: {
    display: 'flex',
    gap: 3,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 9,
    opacity: 0.5,
    fontWeight: 'bold',
  },
  statVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  state: {
    fontSize: 9,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
};

export default memo(FpsTracker);
