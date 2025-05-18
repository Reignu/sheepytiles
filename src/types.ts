export type TileType =
  | 'puppy'
  | 'ball'
  | 'bone'
  | 'flamingo'
  | 'elephant'
  | 'snail'
  | 'rhino'
  | 'panda'
  | 'monkey'
  | 'toucan';

export interface Tile {
  id: string;
  type: TileType;
  image: string; // URL to tile images
  isMoving?: boolean; // For animation
  isShuffle?: boolean; // For shuffle animation
  x?: number; // grid column
  y?: number; // grid row
  z?: number; // layer
  covered?: boolean;
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