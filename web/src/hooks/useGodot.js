import { useEffect, useState, useCallback } from 'react';

export function useGodot() {
  const [ready, setReady] = useState(false);
  const [playerState, setPlayerState] = useState(null);
  const [resources, setResources] = useState({ gold: 0, wood: 0, ore: 0 });
  const [buildingDefs, setBuildingDefs] = useState({ buildings: {}, troops: {} });
  const [troopLevels, setTroopLevels] = useState({});
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [enemyMode, setEnemyMode] = useState({ active: false });
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    window.onGodotMessage = (msg) => {
      const { action, data } = msg;
      switch (action) {
        case 'godot_ready':
          setReady(true);
          break;
        case 'state':
          setPlayerState(data);
          break;
        case 'resources':
          setResources(data);
          break;
        case 'building_defs':
          setBuildingDefs(data);
          break;
        case 'troop_levels':
          setTroopLevels(data);
          break;
        case 'building_selected':
          setSelectedBuilding(data);
          break;
        case 'building_deselected':
          setSelectedBuilding(null);
          break;
        case 'shop_toggled':
          setShopOpen(data.open);
          break;
        case 'enemy_mode':
          setEnemyMode(data);
          if (!data.active) setSelectedBuilding(null);
          break;
        case 'error':
          setError(data.message);
          setTimeout(() => setError(null), 3000);
          break;
        case 'show_register':
          setShowRegister(true);
          break;
        case 'registered':
          if (data.success) setShowRegister(false);
          break;
        case 'placement_started':
          setShopOpen(false);
          break;
      }
    };
    return () => { window.onGodotMessage = null; };
  }, []);

  const sendToGodot = useCallback((action, data = {}) => {
    if (window.godotBridge) {
      window.godotBridge(JSON.stringify({ action, data }));
    }
  }, []);

  return {
    ready, playerState, resources, buildingDefs, troopLevels,
    selectedBuilding, shopOpen, enemyMode, error, showRegister,
    sendToGodot, setShopOpen, setSelectedBuilding,
  };
}
