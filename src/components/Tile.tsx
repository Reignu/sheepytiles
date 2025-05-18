// components/Tile.tsx
import React, { useState } from 'react';
import { Tile, TileType } from '../types';

interface TileComponentProps {
  tile: Tile;
  onClick?: () => void;
  isMatching?: boolean;
}

const getTileColor = (type: TileType) => {
  switch (type) {
    case 'puppy': return '#f8f9fa';
    case 'ball': return '#ffe082';
    case 'bone': return '#d7ccc8';
    case 'flamingo': return '#ffb6b9';
    case 'elephant': return '#b0bec5';
    case 'snail': return '#c5e1a5';
    case 'rhino': return '#bdbdbd';
    case 'panda': return '#e0e0e0';
    case 'monkey': return '#bcaaa4';
    case 'toucan': return '#b2dfdb';
    default: return '#f5f5f5';
  }
};

const TileComponent: React.FC<TileComponentProps> = ({ tile, onClick, isMatching = false }) => {
  const [imageError, setImageError] = useState(false);
  
  // Determine animation classes
  const getAnimationClasses = () => {
    const classes = [];
    if (isMatching) classes.push('matching');
    if (tile.isMoving) classes.push('moving-tile');
    if (tile.isShuffle) classes.push('shuffling');
    return classes.join(' ');
  };

  return (
    <div 
      className={`tile ${getAnimationClasses()}`} 
      onClick={onClick}
      style={{ 
        border: isMatching ? '2px solid #4caf50' : '1px solid #ccc',
        borderRadius: '8px',
        margin: '5px',
        padding: '5px',
        cursor: onClick ? 'pointer' : 'default',
        width: '80px',
        height: '80px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: tile.image && !imageError ? undefined : getTileColor(tile.type),
        boxShadow: isMatching 
          ? '0 4px 12px rgba(76, 175, 80, 0.5)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        transform: isMatching 
          ? 'translateY(-5px)' 
          : onClick
          ? 'scale(1)'
          : 'none',
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = isMatching ? 'translateY(-5px)' : 'scale(1)';
          e.currentTarget.style.boxShadow = isMatching 
            ? '0 4px 12px rgba(76, 175, 80, 0.5)' 
            : '0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
    >
      {tile.image && !imageError ? (
        <img 
          src={tile.image} 
          alt={tile.type}
          style={{
            maxWidth: '95%',
            maxHeight: '95%',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`tile-placeholder ${tile.type}`} style={{ fontWeight: 600, fontSize: 16, color: '#333', textTransform: 'capitalize' }}>
          {tile.type.replace('_', ' ')}
        </div>
      )}
    </div>
  );
};

export default TileComponent;