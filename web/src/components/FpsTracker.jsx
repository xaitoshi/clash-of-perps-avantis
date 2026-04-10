import { useEffect, useRef, memo } from 'react';

function FpsTracker() {
  const ref = useRef(null);

  useEffect(() => {
    function onPerf(e) {
      // Direct DOM update — no React re-render needed for a number display
      if (ref.current && e.detail) {
        const fps = e.detail.fps;
        ref.current.textContent = fps;
        ref.current.style.color = fps >= 55 ? '#44ff44'
          : fps >= 40 ? '#aaff44'
          : fps >= 25 ? '#ffaa00'
          : '#ff4444';
      }
    }
    window.addEventListener('godot-perf', onPerf);
    return () => window.removeEventListener('godot-perf', onPerf);
  }, []);

  return (
    <div style={styles.container}>
      <span ref={ref} style={styles.fpsNumber}>--</span>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '50%',
    left: 8,
    transform: 'translateY(-50%)',
    zIndex: 100,
    pointerEvents: 'none',
    fontFamily: 'monospace',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpsNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    opacity: 0.8,
    color: '#44ff44',
  },
};

export default memo(FpsTracker);
