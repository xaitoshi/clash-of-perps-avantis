import { useState, useEffect, useCallback, useMemo } from 'react';
import ResourceBar from './ResourceBar';
import PlayerInfo from './PlayerInfo';
import ActionButtons from './ActionButtons';
import ShopPanel from './ShopPanel';
import BuildingInfoPanel from './BuildingInfoPanel';
import BarracksPanel from './BarracksPanel';
import RegisterPanel from './RegisterPanel';
import ErrorToast from './ErrorToast';

export default function GameUI({
  ready, playerState, resources, buildingDefs, troopLevels,
  selectedBuilding, shopOpen, enemyMode, error, showRegister,
  sendToGodot, setShopOpen,
}) {
  const [showTroops, setShowTroops] = useState(false);

  // Reset troops panel when building is deselected
  useEffect(() => {
    if (!selectedBuilding) setShowTroops(false);
  }, [selectedBuilding]);

  const handleCloseShop = useCallback(() => {
    setShopOpen(false);
    sendToGodot('close_shop');
  }, [setShopOpen, sendToGodot]);

  const handleCloseTroops = useCallback(() => setShowTroops(false), []);
  const handleDeselectBuilding = useCallback(() => sendToGodot('deselect_building'), [sendToGodot]);
  const handleOpenTroops = useCallback(() => setShowTroops(true), []);

  const barnAsTroops = useMemo(() => {
    if (showTroops && selectedBuilding?.id === 'barn') {
      return { ...selectedBuilding, is_barracks: true };
    }
    return null;
  }, [showTroops, selectedBuilding]);

  if (!ready) return null;

  if (showRegister) {
    return <RegisterPanel sendToGodot={sendToGodot} />;
  }

  return (
    <div style={styles.overlay}>
      <ResourceBar resources={resources} sendToGodot={sendToGodot} />
      <PlayerInfo playerState={playerState} />
      <ActionButtons enemyMode={enemyMode} sendToGodot={sendToGodot} />
      <ErrorToast message={error} />

      {shopOpen && (
        <ShopPanel
          buildingDefs={buildingDefs}
          sendToGodot={sendToGodot}
          onClose={handleCloseShop}
        />
      )}

      {barnAsTroops ? (
        <BarracksPanel
          building={barnAsTroops}
          buildingDefs={buildingDefs}
          troopLevels={troopLevels}
          sendToGodot={sendToGodot}
          onClose={handleCloseTroops}
        />
      ) : selectedBuilding && selectedBuilding.is_barracks && !selectedBuilding.is_enemy ? (
        <BarracksPanel
          building={selectedBuilding}
          buildingDefs={buildingDefs}
          troopLevels={troopLevels}
          sendToGodot={sendToGodot}
          onClose={handleDeselectBuilding}
        />
      ) : (
        <BuildingInfoPanel
          building={selectedBuilding}
          sendToGodot={sendToGodot}
          onOpenTroops={handleOpenTroops}
        />
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 5,
  },
};
