// utils/generateTiles.ts
import { Tile, TileType } from '../types';

// Map tile types to their image paths
const TILE_IMAGES: Record<TileType, string[]> = {
  puppy: ['/img/sheepy-sticker.jpg'],
  ball: [],
  bone: [],
  flamingo: [],
  elephant: [],
  snail: [],
  rhino: [],
  panda: [],
  monkey: [],
  toucan: [],
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