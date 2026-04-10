import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { cartoonBtn } from '../styles/theme';

// ── Tutorial flags (bitmask) ──────────────────────────────────────
const FLAG_BASE = 1;    // welcome, TH, buildings, resources
const FLAG_ARMY = 2;    // port, ship, barracks, load troops
const FLAG_ATTACK = 4;  // first attack guide (cannon, energy, ships)
const FLAG_TRADE = 8;   // trading intro

// ── Step definitions ──────────────────────────────────────────────
const BASE_STEPS = [
  { title: 'Welcome, Commander!', text: 'Welcome to Clash of Perps! Build your island, train troops, and raid enemies. Let\'s get started.', icon: '⚔️' },
  { title: 'Town Hall', text: 'This is your Town Hall — the heart of your base. Upgrade it to unlock new buildings and increase your power.', icon: '🏰', target: 'town-hall' },
  { title: 'Build', text: 'Tap the Build button to construct new buildings. Start with a Mine and Sawmill to produce resources.', icon: '🔨', target: 'build-btn' },
  { title: 'Collect Resources', text: 'Your Mine produces Ore and Sawmill produces Wood. Tap the collect icons above buildings to gather resources.', icon: '💰' },
];

const ARMY_STEPS = [
  { title: 'Port & Ship', text: 'Build a Port and buy a Ship. Ships carry your troops into battle.', icon: '⛵', target: 'build-btn' },
  { title: 'Barracks', text: 'Open your Barracks (Barn) to view and upgrade your troops. Stronger troops = easier victories.', icon: '🛡️' },
  { title: 'Load Troops', text: 'Tap your Port → choose troops to load onto your ship. Each ship level adds a troop slot.', icon: '👥' },
];

const ATTACK_STEPS = [
  { title: 'Battle!', text: 'You\'re about to attack! Let\'s learn the basics.', icon: '⚔️' },
  { title: 'Place Ships', text: 'Tap the water near the enemy shore to deploy your ships. Troops will swim ashore and attack automatically.', icon: '⛵' },
  { title: 'Ship Cannon', text: 'You have a cannon with 10 energy. Fire it at buildings for massive damage! Each shot costs more energy.', icon: '💥' },
  { title: 'Destroy Town Hall', text: 'Destroy the enemy Town Hall to win! All remaining buildings will crumble after it falls.', icon: '🏆' },
  { title: 'Casualties', text: 'Troops lost in battle need to be reinforced. Tap the Reinforce button after returning home (50 gold per troop).', icon: '🩹' },
];

const TRADE_STEPS = [
  { title: 'Futures Trading', text: 'Trade crypto futures on Pacifica to earn Gold! Tap the Trade button to open the trading panel.', icon: '📈', target: 'trade-btn' },
  { title: 'Earn Gold', text: 'Every $1 traded earns you 0.2 Gold. First deposit bonus: 500 Gold! Daily trading bonus: 750 Gold!', icon: '💰' },
];

// ── Component ─────────────────────────────────────────────────────
function TutorialOverlay({ tutorialFlags, phase, onComplete, onSkip }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const overlayRef = useRef(null);

  const steps = phase === 'base' ? BASE_STEPS
    : phase === 'army' ? ARMY_STEPS
    : phase === 'attack' ? ATTACK_STEPS
    : phase === 'trade' ? TRADE_STEPS
    : [];

  const flag = phase === 'base' ? FLAG_BASE
    : phase === 'army' ? FLAG_ARMY
    : phase === 'attack' ? FLAG_ATTACK
    : phase === 'trade' ? FLAG_TRADE
    : 0;

  // Already completed this phase
  if ((tutorialFlags & flag) !== 0 || steps.length === 0) return null;

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  // Find spotlight target
  useEffect(() => {
    if (!step.target) { setSpotlightRect(null); return; }
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setSpotlightRect({ x: r.left - 8, y: r.top - 8, w: r.width + 16, h: r.height + 16 });
    } else {
      setSpotlightRect(null);
    }
  }, [stepIdx, step.target]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete(flag);
    } else {
      setStepIdx(s => s + 1);
    }
  }, [isLast, flag, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip(flag);
  }, [flag, onSkip]);

  // Clip-path for spotlight hole
  const clipPath = spotlightRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${spotlightRect.x}px ${spotlightRect.y}px,
        ${spotlightRect.x}px ${spotlightRect.y + spotlightRect.h}px,
        ${spotlightRect.x + spotlightRect.w}px ${spotlightRect.y + spotlightRect.h}px,
        ${spotlightRect.x + spotlightRect.w}px ${spotlightRect.y}px,
        ${spotlightRect.x}px ${spotlightRect.y}px
      )`
    : undefined;

  return (
    <div ref={overlayRef} style={{...S.overlay, clipPath}}>
      {/* Step indicator */}
      <div style={S.stepDots}>
        {steps.map((_, i) => (
          <div key={i} style={{...S.dot, ...(i === stepIdx ? S.dotActive : {})}} />
        ))}
      </div>

      {/* Card */}
      <div style={S.card}>
        <div style={S.iconCircle}>
          <span style={S.icon}>{step.icon}</span>
        </div>
        <h2 style={S.title}>{step.title}</h2>
        <p style={S.text}>{step.text}</p>
        <div style={S.buttons}>
          <button style={S.skipBtn} onClick={handleSkip}>Skip</button>
          <button style={S.nextBtn} onClick={handleNext}>
            {isLast ? 'Got it!' : 'Next'}
          </button>
        </div>
        <div style={S.counter}>{stepIdx + 1} / {steps.length}</div>
      </div>
    </div>
  );
}

export { FLAG_BASE, FLAG_ARMY, FLAG_ATTACK, FLAG_TRADE };
export default memo(TutorialOverlay);

// ── Styles ────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end',
    zIndex: 250, pointerEvents: 'all',
    paddingBottom: 20,
    animation: 'fadeIn 0.3s ease',
  },
  stepDots: {
    position: 'absolute', top: 16,
    display: 'flex', gap: 8, zIndex: 260,
  },
  dot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
    transition: 'all 0.2s',
  },
  dotActive: {
    background: '#FFD700',
    boxShadow: '0 0 8px rgba(255,215,0,0.6)',
    transform: 'scale(1.3)',
  },
  card: {
    background: 'linear-gradient(180deg, #3E2723 0%, #2C1B0E 100%)',
    border: '3px solid #6D4C2A',
    borderRadius: 20,
    padding: '20px 24px 16px',
    maxWidth: 360, width: 'calc(100% - 32px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    animation: 'panelRise 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(180deg, #FFD700, #C59600)',
    border: '3px solid #8B6914',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    marginTop: -44,
  },
  icon: { fontSize: 28, lineHeight: 1 },
  title: {
    margin: '12px 0 6px', fontSize: 20, fontWeight: 900,
    color: '#FFD700', textAlign: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
    fontFamily: '"Inter","Segoe UI",sans-serif',
  },
  text: {
    margin: '0 0 16px', fontSize: 14, fontWeight: 600,
    color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    lineHeight: 1.5, maxWidth: 300,
    fontFamily: '"Inter","Segoe UI",sans-serif',
  },
  buttons: {
    display: 'flex', gap: 12, width: '100%',
  },
  skipBtn: {
    flex: 1, padding: '10px 16px', borderRadius: 12,
    border: '2px solid #6D4C2A', background: 'transparent',
    color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 800,
    cursor: 'pointer', transition: 'all 0.1s',
  },
  nextBtn: {
    ...cartoonBtn('#FFD700', '#C59600'),
    flex: 2, padding: '10px 16px', fontSize: 15, textAlign: 'center',
  },
  counter: {
    marginTop: 10, fontSize: 11, fontWeight: 700,
    color: 'rgba(255,255,255,0.3)',
  },
};
