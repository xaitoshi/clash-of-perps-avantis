import GodotCanvas from './components/GodotCanvas';
import GameUI from './components/GameUI';
import { useGodot } from './hooks/useGodot';
import './index.css';

export default function App() {
  const godot = useGodot();

  return (
    <div style={styles.container}>
      <GodotCanvas />
      <GameUI {...godot} />
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    background: '#0a0b1a',
  },
};
