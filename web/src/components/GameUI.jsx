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
          onClose={() => {
            setShopOpen(false);
            sendToGodot('close_shop');
          }}
        />
      )}

      {selectedBuilding && selectedBuilding.is_sawmill && !selectedBuilding.is_enemy ? (
        <BarracksPanel
          building={selectedBuilding}
          buildingDefs={buildingDefs}
          troopLevels={troopLevels}
          sendToGodot={sendToGodot}
          onClose={() => sendToGodot('deselect_building')}
        />
      ) : (
        <BuildingInfoPanel building={selectedBuilding} sendToGodot={sendToGodot} />
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
