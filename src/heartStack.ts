import { Tile } from './types';

// Define heart-shaped patterns for each layer and their offsets
const LAYER_PATTERNS = [
  // Top layer (z=0)
  { pattern: [
      [0,0,1,1,1,0,0],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
    ], offset: {x: 0, y: 0} },
  // Layer 1 (z=1)
  { pattern: [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
    ], offset: {x: 0.5, y: 0.5} },
  // Layer 2 (z=2)
  { pattern: [
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,0,1,1,0,0],
    ], offset: {x: 1, y: 1} },
  // Layer 3 (z=3)
  { pattern: [
      [1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,0,0,0],
    ], offset: {x: 1.5, y: 1.5} },
  // Layer 4 (z=4)
  { pattern: [
      [0,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
    ], offset: {x: 2, y: 2} },
  // Layer 5 (z=5)
  { pattern: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
    ], offset: {x: 2.5, y: 2.5} },
  // Layer 6 (z=6)
  { pattern: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
    ], offset: {x: 3, y: 3} },
];

export function getLayerOffset(z: number) {
  return LAYER_PATTERNS[z]?.offset || {x: 0, y: 0};
}

function tilesOverlap(tile1: any, tile2: any) {
  const overlapX = Math.abs(tile1.x - tile2.x) < 0.7;
  const overlapY = Math.abs(tile1.y - tile2.y) < 0.7;
  return overlapX && overlapY;
}

export function generateHeartStack(tiles: Tile[]): Tile[] {
  let id = 0;
  const stack: Tile[] = [];
  LAYER_PATTERNS.forEach((layer, z) => {
    layer.pattern.forEach((rowArr, y) => {
      rowArr.forEach((cell, x) => {
        if (cell && id < tiles.length) {
          stack.push({
            ...tiles[id],
            id: tiles[id].id,
            x: x, // integer grid position
            y: y, // integer grid position
            z,
            covered: false,
          });
          id++;
        }
      });
    });
  });

  // Calculate covered status
  stack.forEach(tile => {
    tile.covered = stack.some(
      t => t !== tile && t.z !== undefined && tile.z !== undefined && !t.covered && t.z > tile.z && tilesOverlap(tile, t)
    );
  });

  return stack;
} 