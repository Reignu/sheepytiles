// utils/generateTiles.ts
import { Tile, TileType } from '../types';

// Map tile types to their image paths
const TILE_IMAGES: Record<TileType, string[]> = {
  puppy: [
    '/img/sheepy-sticker.jpg',
    '/img/puppy-2.jpg',
    '/img/puppy-3.jpg' // Add all your puppy images
  ],
  ball: ['/img/ball-1.jpg'],
  bone: ['/img/bone-1.jpg']
};

export function generateTiles(): Tile[] {
  const tiles: Tile[] = [];
  let id = 1;

  // Create 3 instances of each tile variation
  (Object.keys(TILE_IMAGES) as TileType[]).forEach(type => {
    TILE_IMAGES[type].forEach(imagePath => {
      for (let i = 0; i < 3; i++) {
        tiles.push({
          id: `tile-${id++}`,
          type,
          image: imagePath
        });
      }
    });
  });

  return tiles;
}