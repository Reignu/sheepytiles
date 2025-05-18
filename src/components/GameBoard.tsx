import React, { useState } from 'react';
import TileComponent from './Tile';
import { Tile } from '../types';
import { getLayerOffset } from '../heartStack';

interface GameBoardProps {
  mainPile: Tile[];
  leftPile: Tile[];
  rightPile: Tile[];
  playerStack: Tile[];
  revealedTiles: Tile[];
  isShuffling: boolean;
  onMainPileClick: (index: number) => void;
  onSidePileClick: (pile: 'left' | 'right', index: number) => void;
  onRevealedTileClick: (index: number) => void;
  onReorderStack: (fromIndex: number, toIndex: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  mainPile, 
  leftPile, 
  rightPile, 
  playerStack,
  revealedTiles,
  isShuffling,
  onMainPileClick,
  onSidePileClick,
  onRevealedTileClick,
  onReorderStack
}) => {
  const [dragTileIndex, setDragTileIndex] = useState<number | null>(null);
  const TILE_SIZE = 60;

  // Check if there are potential matches in the player stack
  const findPotentialMatches = () => {
    const matches: Record<number, boolean> = {};
    
    // Check for pairs that could become triplets
    const typeCounts: Record<string, number[]> = {};
    
    // Map indices by tile type
    playerStack.forEach((tile, index) => {
      if (!typeCounts[tile.type]) {
        typeCounts[tile.type] = [];
      }
      typeCounts[tile.type].push(index);
    });
    
    // Mark tiles that are part of a potential match (2 or more of same type)
    Object.entries(typeCounts).forEach(([type, indices]) => {
      if (indices.length >= 2) {
        indices.forEach(index => {
          matches[index] = true;
        });
      }
    });
    
    return matches;
  };

  // Determine player stack status based on capacity
  const getPlayerStackStatus = () => {
    const stackLimit = 8; // Assuming 8 is the limit as defined in App.tsx
    const currentCount = playerStack.length;
    
    if (currentCount >= stackLimit) {
      return 'full';
    } else if (currentCount >= stackLimit - 2) {
      return 'almost-full';
    }
    return '';
  };
  
  // Handlers for drag and drop functionality
  const handleDragStart = (index: number) => {
    setDragTileIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };
  
  const handleDrop = (targetIndex: number) => {
    if (dragTileIndex !== null && dragTileIndex !== targetIndex) {
      onReorderStack(dragTileIndex, targetIndex);
    }
    setDragTileIndex(null);
  };
  
  // Function to render a vertical stack of tiles for side piles
  const renderSidePile = (pile: Tile[], isPileLeft: boolean) => {
    if (pile.length === 0) {
      return <div className="empty-pile">Pile empty</div>;
    }
    return (
      <div className="side-pile-wrapper">
        <div className="pile-count">{pile.length}</div>
        <div className="stacked-tiles">
          {pile.slice(-8).map((tile, idx, arr) => {
            const isTop = idx === arr.length - 1;
            return (
              <div 
                key={tile.id} 
                className={`stacked-tile ${tile.isShuffle ? 'shuffling' : ''} ${isTop ? 'topmost' : ''}`}
                onClick={isTop ? () => onSidePileClick(isPileLeft ? 'left' : 'right', pile.length - 1) : undefined}
                style={{ cursor: isTop ? 'pointer' : 'default', opacity: isTop ? 1 : 0.7 }}
              >
                <TileComponent 
                  tile={tile} 
                  onClick={isTop ? () => onSidePileClick(isPileLeft ? 'left' : 'right', pile.length - 1) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Add this function to render player stack with type separators
  const renderPlayerStack = () => {
    if (playerStack.length === 0) {
      return <div className="empty-pile">Your stack is empty</div>;
    }

    const elements: React.ReactNode[] = [];
    let lastType: string | null = null;

    playerStack.forEach((tile, index) => {
      // Add a separator between different types
      if (lastType !== null && lastType !== tile.type) {
        elements.push(
          <div key={`separator-${index}`} className="tile-type-separator" />
        );
      }
      
      elements.push(
        <div 
          key={tile.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          className={`draggable-tile-wrapper ${tile.isMoving ? 'moving-tile' : ''}`}
        >
          <TileComponent 
            tile={tile} 
            isMatching={potentialMatches[index]}
          />
        </div>
      );
      
      lastType = tile.type;
    });

    return elements;
  };
  
  // Function to render revealed tiles area
  const renderRevealedTiles = () => {
    if (revealedTiles.length === 0) {
      return null;
    }
    
    return (
      <div className="revealed-tiles-area">
        {revealedTiles.map((tile, index) => (
          <div 
            key={tile.id}
            className={`draggable-tile-wrapper ${tile.isMoving ? 'moving-tile' : ''}`}
            onClick={() => onRevealedTileClick(index)}
          >
            <TileComponent 
              tile={tile} 
              onClick={() => onRevealedTileClick(index)}
            />
          </div>
        ))}
      </div>
    );
  };
  
  // Render the main pile as a grid, stacking tiles by z-index
  const renderMainPileGrid = () => {
    if (mainPile.length === 0) {
      return <div className="empty-pile">Main pile empty</div>;
    }
    // Group tiles by z (layer)
    const layers: Record<number, Tile[]> = {};
    mainPile.forEach(tile => {
      if (!layers[tile.z!]) layers[tile.z!] = [];
      layers[tile.z!].push(tile);
    });
    // Render each layer, stacking by z-index
    return (
      <div className="main-pile-grid" style={{ position: 'relative', width: 320, height: 400 }}>
        {Object.keys(layers).map(zStr => {
          const z = Number(zStr);
          const layerOffset = getLayerOffset(z);
          return layers[z].map(tile => (
            <div
              key={tile.id}
              className={`tile-wrapper main-pile-tile`}
              style={{
                position: 'absolute',
                left: (tile.x! + layerOffset.x) * TILE_SIZE,
                top: (tile.y! + layerOffset.y) * TILE_SIZE,
                zIndex: 1 + z,
                pointerEvents: tile.covered ? 'none' : 'auto',
                borderRadius: 8,
              }}
              onClick={tile.covered ? undefined : () => onMainPileClick(mainPile.findIndex(t => t.id === tile.id))}
            >
              <TileComponent tile={tile} />
              {tile.covered && (
                <div
                  className="tile-covered-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(60,60,60,0.65)',
                    borderRadius: 8,
                    zIndex: 10,
                    pointerEvents: 'none',
                    border: '2px solid #888',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ));
        })}
      </div>
    );
  };
  
  const potentialMatches = findPotentialMatches();
  const playerStackStatus = getPlayerStackStatus();
  
  return (
    <div className={`game-board ${isShuffling ? 'shuffling' : ''}`}>
      {/* Left Pile - Rendered vertically */}
      <div className="pile left-pile">
        {renderSidePile(leftPile, true)}
      </div>

      {/* Main pile grid only */}
      <div className="main-area">
        {renderMainPileGrid()}
      </div>

      {/* Right Pile - Rendered vertically */}
      <div className="pile right-pile">
        {renderSidePile(rightPile, false)}
      </div>

      {/* Second row: revealed tiles and player stack */}
      <div className="revealed-tiles-area">
        {renderRevealedTiles()}
      </div>
      <div 
        className={`pile player-stack ${playerStackStatus}`}
        onDragOver={handleDragOver}
      >
        {renderPlayerStack()}
      </div>
    </div>
  );
};

export default GameBoard;