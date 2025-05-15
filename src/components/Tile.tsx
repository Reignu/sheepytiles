// components/Tile.tsx
import React, { useState } from 'react';
import { Tile, TileType } from '../types';

interface TileComponentProps {
  tile: Tile;
  onClick?: () => void;
  isMatching?: boolean;
}

const TileComponent: React.FC<TileComponentProps> = ({ tile, onClick, isMatching = false }) => {
  const [imageError, setImageError] = useState(false);
  
  // Create a color based on the tile type for consistent tiles
  const getTileColor = () => {
    switch(tile.type) {
      case 'puppy': return '#f8f9fa';
      case 'ball': return '#e8f5e9';
      case 'bone': return '#efebe9';
      default: return '#f5f5f5';
    }
  };

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
        backgroundColor: getTileColor(),
        boxShadow: isMatching 
          ? '0 4px 12px rgba(76, 175, 80, 0.5)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        transform: isMatching 
          ? 'translateY(-5px)' 
          : (onClick ? 'scale(1)' : 'none'),
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
      {!imageError && tile.image && tile.image.includes('sheepy-sticker.jpg') ? (
        <img 
          src={tile.image} 
          alt={tile.type}
          style={{
            maxWidth: '95%',
            maxHeight: '95%',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
          onError={(e) => {
            console.error('Failed to load:', tile.image);
            setImageError(true);
          }}
        />
      ) : (
        <div className={`tile-placeholder ${tile.type}`}>
          {tile.type}
        </div>
      )}
    </div>
  );
};

export default TileComponent;