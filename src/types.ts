export type TileType = 'puppy' | 'ball' | 'bone';

export interface Tile {
  id: string;
  type: TileType;
  image: string; // URL to tile images
  isMoving?: boolean; // For animation
  isShuffle?: boolean; // For shuffle animation
}

export interface GameState {
  mainPile: Tile[];
  leftPile: Tile[];
  rightPile: Tile[];
  playerStack: Tile[];
  revealedTiles: Tile[]; // For removed/resurrected tiles
  score: number;
  matchesFound: number;
  stackLimit: number; // Maximum number of tiles in player stack
  isShuffling: boolean; // Flag for shuffle animation
}