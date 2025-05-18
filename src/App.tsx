import React, { useState, useEffect, useRef } from 'react';
import GameBoard from './components/GameBoard';
import { Tile, TileType, GameState } from './types';
import './App.css';
import { generateHeartStack } from './heartStack';

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const TILE_TYPES: TileType[] = [
  'puppy',
  'ball',
  'bone',
  'flamingo',
  'elephant',
  'snail',
  'rhino',
  'panda',
  'monkey',
  'toucan',
];

const GRID_LAYERS = 9;
const GRID_ROWS = 6;
const GRID_COLS = 5;
const MAIN_PILE_SIZE = GRID_LAYERS * GRID_ROWS * GRID_COLS; // 270
const SIDE_PILE_SIZE = 15;

const generateTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  // 30 of each type
  TILE_TYPES.forEach((type) => {
  for (let i = 0; i < 30; i++) {
    tiles.push({
        id: `${type}-${i}`,
      type,
        image: '',
      });
    }
  });
  return shuffleArray(tiles);
};

const STACK_LIMIT = 8; // Maximum tiles in player stack

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    mainPile: [],
    leftPile: [],
    rightPile: [],
    playerStack: [],
    revealedTiles: [],
    score: 0,
    matchesFound: 0,
    stackLimit: STACK_LIMIT,
    isShuffling: false
  });

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [powerups, setPowerups] = useState({
    undo: 1,
    resurrect: 1,
    shuffle: 1,
    remove: 1
  });

  // Track game history for undo
  const [history, setHistory] = useState<GameState[]>([]);

  // Initialize the game
  useEffect(() => {
    startNewGame();
  }, []);

  // Start a new game
  const startNewGame = () => {
    const tiles = generateTiles();
    const mainPileHeart = generateHeartStack(tiles);
    const initialState: GameState = {
      mainPile: mainPileHeart,
      leftPile: tiles.slice(mainPileHeart.length, mainPileHeart.length + SIDE_PILE_SIZE),
      rightPile: tiles.slice(mainPileHeart.length + SIDE_PILE_SIZE, mainPileHeart.length + 2 * SIDE_PILE_SIZE),
      playerStack: [],
      revealedTiles: [],
      score: 0,
      matchesFound: 0,
      stackLimit: STACK_LIMIT,
      isShuffling: false
    };
    
    setGameState(initialState);
    setHistory([initialState]);
    setGameOver(false);
    setGameWon(false);
    setPowerups({
      undo: 1,
      resurrect: 1,
      shuffle: 1,
      remove: 1
    });
  };

  // Save current state to history
  const saveToHistory = (state: GameState) => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(state))]);
  };

  // Add this function to automatically arrange matching tiles together
  const autoArrangePlayerStack = (stack: Tile[]): Tile[] => {
    // Group tiles by type
    const tilesByType: Record<string, Tile[]> = {};
    
    // First pass: group tiles by their type
    stack.forEach(tile => {
      if (!tilesByType[tile.type]) {
        tilesByType[tile.type] = [];
      }
      tilesByType[tile.type].push(tile);
    });

    // Create a new stack with tiles grouped by type
    // Sort by groups with most tiles first to prioritize potential matches
    const sortedTypes = Object.keys(tilesByType).sort(
      (a, b) => tilesByType[b].length - tilesByType[a].length
    );
    
    // Rebuild stack with tiles grouped by type
    return sortedTypes.flatMap(type => tilesByType[type]);
  };

  // Helper function to add animation to a tile
  const animateTileMovement = (tile: Tile): Tile => {
    return { ...tile, isMoving: true };
  };

  // Geometric overlap detection for covered logic
  const updateCoveredStatus = (mainPile: Tile[]): Tile[] => {
    return mainPile.map(tile => ({
      ...tile,
      covered: mainPile.some(
        t =>
          t !== tile &&
          t.z! < tile.z! &&
          Math.abs(t.x! - tile.x!) <= 1 &&
          Math.abs(t.y! - tile.y!) <= 1
      ),
    }));
  };

  // Handle tile click from main pile with animation
  const handleMainPileClick = (index: number) => {
    if (gameState.mainPile.length === 0 || gameOver) return;
    
    // Check if player stack is full
    if (gameState.playerStack.length >= gameState.stackLimit) {
      setGameOver(true);
      return;
    }
    
    // Save current state before changes
    saveToHistory({...gameState});
    
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    const clickedTile = newState.mainPile[index];
    
    // Add movement animation to clicked tile
    clickedTile.isMoving = true;
    
    // Remove the tile from main pile
    newState.mainPile.splice(index, 1);
    
    // Add to player stack
    newState.playerStack.push(clickedTile);
    
    // Auto-arrange the player stack to group matching tiles
    newState.playerStack = autoArrangePlayerStack(newState.playerStack);
    
    // Check for matches
    checkForMatches(newState);
    
    // Check win condition
    if (newState.mainPile.length === 0 && 
        newState.leftPile.length === 0 && 
        newState.rightPile.length === 0 &&
        newState.revealedTiles.length === 0) {
      setGameWon(true);
    }
    
    // Update covered status for all main pile tiles
    newState.mainPile = updateCoveredStatus(newState.mainPile);
    
    setGameState(newState);
    
    // Clear animation flags after a delay
    setTimeout(() => {
      setGameState(prevState => {
        const updatedState = JSON.parse(JSON.stringify(prevState)) as GameState;
        updatedState.playerStack = updatedState.playerStack.map(tile => ({...tile, isMoving: false}));
        updatedState.mainPile = updatedState.mainPile.map(tile => ({...tile, isShuffle: false}));
        return updatedState;
      });
    }, 500);
  };

  // Handle tile click from side piles with animation
  const handleSidePileClick = (pile: 'left' | 'right', index: number) => {
    if (gameOver) return;
    
    // Check if player stack is full
    if (gameState.playerStack.length >= gameState.stackLimit) {
      setGameOver(true);
      return;
    }
    
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    const sourcePile = pile === 'left' ? newState.leftPile : newState.rightPile;
    
    if (sourcePile.length === 0) return;
    
    // Save current state before changes
    saveToHistory({...gameState});
    
    // Take the top tile (last in array)
    const clickedTile = sourcePile.pop()!;
    
    // Add movement animation
    clickedTile.isMoving = true;
    
    // Add to player stack
    newState.playerStack.push(clickedTile);
    
    // Auto-arrange the player stack to group matching tiles
    newState.playerStack = autoArrangePlayerStack(newState.playerStack);
    
    // Check for matches
    checkForMatches(newState);
    
    // Check win condition
    if (newState.mainPile.length === 0 && 
        newState.leftPile.length === 0 && 
        newState.rightPile.length === 0 &&
        newState.revealedTiles.length === 0) {
      setGameWon(true);
    }
    
    // Update covered status for all main pile tiles
    newState.mainPile = updateCoveredStatus(newState.mainPile);
    
    setGameState(newState);
    
    // Clear animation flags after a delay
    setTimeout(() => {
      setGameState(prevState => {
        const updatedState = JSON.parse(JSON.stringify(prevState)) as GameState;
        updatedState.playerStack = updatedState.playerStack.map(tile => ({...tile, isMoving: false}));
        updatedState.mainPile = updatedState.mainPile.map(tile => ({...tile, isShuffle: false}));
        return updatedState;
      });
    }, 500);
  };

  // Handle clicking a revealed tile
  const handleRevealedTileClick = (index: number) => {
    if (gameOver) return;
    
    // Check if player stack is full
    if (gameState.playerStack.length >= gameState.stackLimit) {
      setGameOver(true);
      return;
    }
    
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    
    // Save current state before changes
    saveToHistory({...gameState});
    
    // Get the clicked tile
    const clickedTile = newState.revealedTiles[index];
    
    // Remove the tile from revealed tiles
    newState.revealedTiles.splice(index, 1);
    
    // Add animation
    clickedTile.isMoving = true;
    
    // Add to player stack
    newState.playerStack.push(clickedTile);
    
    // Auto-arrange the player stack to group matching tiles
    newState.playerStack = autoArrangePlayerStack(newState.playerStack);
    
    // Check for matches
    checkForMatches(newState);
    
    // Update covered status for all main pile tiles
    newState.mainPile = updateCoveredStatus(newState.mainPile);
    
    setGameState(newState);
    
    // Clear animation flags after a delay
    setTimeout(() => {
      setGameState(prevState => {
        const updatedState = JSON.parse(JSON.stringify(prevState)) as GameState;
        updatedState.playerStack = updatedState.playerStack.map(tile => ({...tile, isMoving: false}));
        updatedState.mainPile = updatedState.mainPile.map(tile => ({...tile, isShuffle: false}));
        return updatedState;
      });
    }, 500);
  };

  // Check for 3 identical tiles in the player stack
  const checkForMatches = (state: GameState) => {
    const { playerStack } = state;
    
    // Need at least 3 tiles to have a match
    if (playerStack.length < 3) return;
    
    // Check for matches of 3 consecutive tiles anywhere in the stack
    let matchFound = false;
    
    // Go through the stack looking for consecutive matches
    // Start from the end to prioritize removing recently added tiles
    for (let i = playerStack.length - 1; i >= 2; i--) {
      // Check if this is the start of 3 consecutive matching tiles
      if (
        playerStack[i].type === playerStack[i-1].type && 
        playerStack[i-1].type === playerStack[i-2].type
      ) {
        // Found a match, remove these 3 tiles
        const beforeMatch = playerStack.slice(0, i-2);
        const afterMatch = playerStack.slice(i+1);
        state.playerStack = [...beforeMatch, ...afterMatch];
        
        // Update score
        state.score += 10;
        state.matchesFound += 1;
        
        matchFound = true;
        break; // Remove one match at a time, then re-check
      }
    }
    
    // If we found and removed a match, check again for more matches
    if (matchFound) {
      checkForMatches(state);
    }
  };

  // Power-up: Undo last move
  const handleUndo = () => {
    if (powerups.undo <= 0 || history.length <= 1) return;
    
    // Remove current state and go back to previous state
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    
    setGameState({...previousState});
    setHistory(newHistory);
    setPowerups(prev => ({ ...prev, undo: prev.undo - 1 }));
    setGameOver(false);
  };

  // Power-up: Resurrect (continue after game over) - only available when game is over
  const handleResurrect = () => {
    if (powerups.resurrect <= 0 || !gameOver) return;
    
    const newState = {...gameState};
    
    // Remove 3 random tiles from player stack
    if (newState.playerStack.length >= 3) {
      // Shuffle the stack for randomness
      const playerStackCopy = [...newState.playerStack];
      const shuffledStack = shuffleArray(playerStackCopy);
      
      // Remove 3 tiles and move them to revealed tiles
      const removedTiles = shuffledStack.slice(0, 3);
      newState.playerStack = shuffledStack.slice(3);
      
      // Add to revealed tiles
      newState.revealedTiles = [...newState.revealedTiles, ...removedTiles];
      
      // Auto-arrange remaining tiles
      newState.playerStack = autoArrangePlayerStack(newState.playerStack);
    } else {
      // If fewer than 3 tiles, clear the stack
      newState.revealedTiles = [...newState.revealedTiles, ...newState.playerStack];
      newState.playerStack = [];
    }
    
    // Update covered status for all main pile tiles
    newState.mainPile = updateCoveredStatus(newState.mainPile);
    
    setGameState(newState);
    setGameOver(false);
    setPowerups(prev => ({ ...prev, resurrect: prev.resurrect - 1 }));
  };

  // Power-up: Shuffle all remaining tiles, maintaining pile sizes
  const handleShuffle = () => {
    if (powerups.shuffle <= 0) return;
    
    // Start shuffle animation
    setGameState(prev => ({...prev, isShuffling: true}));
    
    // Perform the shuffle after animation starts
    setTimeout(() => {
      const newState = {...gameState, isShuffling: true};
      
      // Get pile sizes before shuffling
      const mainPileSize = newState.mainPile.length;
      const leftPileSize = newState.leftPile.length;
      const rightPileSize = newState.rightPile.length;
      
      // Combine all tiles and reshuffle
      let allTiles = [
        ...newState.mainPile,
        ...newState.leftPile,
        ...newState.rightPile
      ];
      
      allTiles = shuffleArray(allTiles);
      
      // Redistribute with the same pile sizes
      newState.mainPile = allTiles.slice(0, mainPileSize);
      newState.leftPile = allTiles.slice(mainPileSize, mainPileSize + leftPileSize);
      newState.rightPile = allTiles.slice(mainPileSize + leftPileSize);
      
      // Set shuffle animation on tiles
      newState.mainPile = newState.mainPile.map(tile => ({...tile, isShuffle: true}));
      newState.leftPile = newState.leftPile.map(tile => ({...tile, isShuffle: true}));
      newState.rightPile = newState.rightPile.map(tile => ({...tile, isShuffle: true}));
      
      // Update covered status for all main pile tiles
      newState.mainPile = updateCoveredStatus(newState.mainPile);
      
      setGameState(newState);
      setPowerups(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
      
      // End animation after delay
      setTimeout(() => {
        setGameState(prev => {
          const updated = JSON.parse(JSON.stringify(prev)) as GameState;
          updated.isShuffling = false;
          updated.mainPile = updated.mainPile.map(tile => ({...tile, isShuffle: false}));
          updated.leftPile = updated.leftPile.map(tile => ({...tile, isShuffle: false}));
          updated.rightPile = updated.rightPile.map(tile => ({...tile, isShuffle: false}));
          return updated;
        });
      }, 800);
    }, 100);
  };

  // Power-up: Remove 3 tiles from player stack to revealed area
  const handleRemove = () => {
    if (powerups.remove <= 0 || gameState.playerStack.length === 0) return;
    
    const newState = {...gameState};
    
    // Remove up to 3 tiles from the end of the player stack
    const removeCount = Math.min(3, newState.playerStack.length);
    const removedTiles = newState.playerStack.slice(newState.playerStack.length - removeCount);
    newState.playerStack = newState.playerStack.slice(0, newState.playerStack.length - removeCount);
    
    // Add removed tiles to revealed tiles area
    newState.revealedTiles = [...newState.revealedTiles, ...removedTiles];
    
    // Auto-arrange the remaining tiles
    newState.playerStack = autoArrangePlayerStack(newState.playerStack);
    
    // Update covered status for all main pile tiles
    newState.mainPile = updateCoveredStatus(newState.mainPile);
    
    setGameState(newState);
    setPowerups(prev => ({ ...prev, remove: prev.remove - 1 }));
  };

  // Add this handler for moving tiles within the player stack
  const handleReorderStack = (fromIndex: number, toIndex: number) => {
    // Don't allow reordering if game is over
    if (gameOver) return;
    
    const newState = {...gameState};
    const { playerStack } = newState;
    
    // Save to history
    saveToHistory(newState);
    
    // Remove the tile from its original position
    const [movedTile] = playerStack.splice(fromIndex, 1);
    
    // Insert it at the target position
    playerStack.splice(toIndex, 0, movedTile);
    
    // Auto-arrange the stack after manual reordering
    // This ensures that even manual intervention leads to proper grouping
    newState.playerStack = autoArrangePlayerStack(newState.playerStack);
    
    // Check for matches
    checkForMatches(newState);
    
    // Update covered status for all main pile tiles
    newState.mainPile = updateCoveredStatus(newState.mainPile);
    
    setGameState(newState);
  };

  return (
    <div className="app">
      <h1>Puppy Tile Match</h1>
      
      <div className="game-instructions">
        <h3>How to Play:</h3>
        <ul>
          <li>Click tiles in the main pile to add them to your player stack (limit: {STACK_LIMIT})</li>
          <li>Take tiles from side piles when you need them</li>
          <li>Match 3 identical tiles to remove them</li>
          <li>Clear all tiles without filling your stack to win!</li>
        </ul>
      </div>
      
      {!gameWon && !gameOver && (
        <div className="score-board" style={{ visibility: 'hidden' }}>
          <div>Score: {gameState.score}</div>
          <div>Stack: {gameState.playerStack.length}/{gameState.stackLimit}</div>
          <div>Matches: {gameState.matchesFound}</div>
        </div>
      )}
      
      {gameOver && !gameWon && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Your stack is full.</p>
          <p>Triplets cleared: {gameState.matchesFound} ({Math.round((gameState.matchesFound / 100) * 100)}%)</p>
          {powerups.resurrect > 0 && (
            <button 
              className="resurrect-button" 
              onClick={handleResurrect}
              style={{ marginRight: '10px' }}
            >
              Use Resurrect
            </button>
          )}
          <button onClick={startNewGame}>New Game</button>
        </div>
      )}
      
      {gameWon && (
        <div className="game-won">
          <h2>You Win!</h2>
          <p>Triplets cleared: {gameState.matchesFound} ({Math.round((gameState.matchesFound / 100) * 100)}%)</p>
          <button onClick={startNewGame}>Play Again</button>
        </div>
      )}
      
      <GameBoard 
        mainPile={gameState.mainPile}
        leftPile={gameState.leftPile}
        rightPile={gameState.rightPile}
        playerStack={gameState.playerStack}
        revealedTiles={gameState.revealedTiles}
        isShuffling={gameState.isShuffling}
        onMainPileClick={handleMainPileClick}
        onSidePileClick={handleSidePileClick}
        onRevealedTileClick={handleRevealedTileClick}
        onReorderStack={handleReorderStack}
      />
      
      <div className="powerups">
        <button 
          className="powerup-button"
          onClick={handleUndo}
          disabled={powerups.undo <= 0 || history.length <= 1}
        >
          Undo ({powerups.undo})
        </button>
        <button 
          className="powerup-button"
          onClick={handleResurrect}
          disabled={powerups.resurrect <= 0 || !gameOver}
        >
          Resurrect ({powerups.resurrect})
        </button>
        <button 
          className="powerup-button"
          onClick={handleShuffle}
          disabled={powerups.shuffle <= 0}
        >
          Shuffle ({powerups.shuffle})
        </button>
        <button 
          className="powerup-button"
          onClick={handleRemove}
          disabled={powerups.remove <= 0 || gameState.playerStack.length === 0}
        >
          Remove ({powerups.remove})
        </button>
      </div>
    </div>
  );
};

export default App;