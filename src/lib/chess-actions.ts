import { Chess, Square } from 'chess.js';
import { ActionEffect, GameState, PieceColor } from '@/types/chess';

// Helper functions
const getSquareDistance = (sq1: Square, sq2: Square): number => {
  const file1 = sq1.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank1 = parseInt(sq1[1]) - 1;
  const file2 = sq2.charCodeAt(0) - 97;
  const rank2 = parseInt(sq2[1]) - 1;
  return Math.abs(file1 - file2) + Math.abs(rank1 - rank2); // Manhattan distance
};

const getOpponentColor = (color: PieceColor): PieceColor => color === 'w' ? 'b' : 'w';

const getPiecesOfColor = (chess: Chess, color: PieceColor) => {
  const pieces = [];
  for (let rank = 1; rank <= 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = String.fromCharCode(97 + file) + rank as Square;
      const piece = chess.get(square);
      if (piece && piece.color === color) {
        pieces.push({ piece, square });
      }
    }
  }
  return pieces;
};

const getEmptySquares = (chess: Chess): Square[] => {
  const squares: Square[] = [];
  for (let rank = 1; rank <= 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = String.fromCharCode(97 + file) + rank as Square;
      if (!chess.get(square)) {
        squares.push(square);
      }
    }
  }
  return squares;
};

// Creative Actions Implementation
export const creativeActions: ActionEffect[] = [
  {
    id: 'snip',
    name: 'Snip',
    icon: '✂️',
    description: 'Remove any one enemy Pawn instantly.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      const piece = gameState.chess.get(targetSquare);
      return piece?.type === 'p' && piece.color !== gameState.currentPlayer;
    },
    execute: (gameState: GameState, targetSquare: Square) => {
      const newChess = new Chess(gameState.chess.fen());
      newChess.remove(targetSquare);
      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'rubberBand',
    name: 'Rubber-Band Shot',
    icon: '🎯',
    description: 'Immobilize one enemy piece for 1 turn.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      const piece = gameState.chess.get(targetSquare);
      return piece?.color !== gameState.currentPlayer;
    },
    execute: (gameState: GameState, targetSquare: Square) => {
      // Mark piece as frozen for 1 turn - would need status tracking
      return gameState; // Simplified for now
    }
  },

  {
    id: 'nuke',
    name: 'Nuke',
    icon: '☢️',
    description: 'Select a contiguous 2×2 block; remove up to 4 opponent pieces within that block.',
    used: false,
    needsTarget: true,
    targetType: 'area',
    validateTarget: (gameState: GameState, centerSquare: Square) => {
      // Validate that it's a valid 2x2 area
      const file = centerSquare.charCodeAt(0) - 97;
      const rank = parseInt(centerSquare[1]) - 1;
      return file >= 0 && file <= 6 && rank >= 0 && rank <= 6;
    },
    execute: (gameState: GameState, centerSquare: Square) => {
      const newChess = new Chess(gameState.chess.fen());
      const file = centerSquare.charCodeAt(0) - 97;
      const rank = parseInt(centerSquare[1]) - 1;
      
      // Remove opponent pieces in 2x2 area
      for (let f = file; f <= file + 1; f++) {
        for (let r = rank; r <= rank + 1; r++) {
          const square = String.fromCharCode(97 + f) + (r + 1) as Square;
          const piece = newChess.get(square);
          if (piece && piece.color !== gameState.currentPlayer) {
            newChess.remove(square);
          }
        }
      }
      
      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'jobApplication',
    name: 'Job Application',
    icon: '💼',
    description: 'Remove one of your pieces permanently; then choose any other action to grant it +2 extra uses.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      const piece = gameState.chess.get(targetSquare);
      return piece?.color === gameState.currentPlayer;
    },
    execute: (gameState: GameState, targetSquare: Square, actionToBoost: string) => {
      const newChess = new Chess(gameState.chess.fen());
      newChess.remove(targetSquare);
      // Would need to track action uses
      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'robotProxy',
    name: 'Robot Proxy',
    icon: '🤖',
    description: 'Choose one of your pieces to pilot a robot. The robot removes an enemy piece of the same type.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      const piece = gameState.chess.get(targetSquare);
      return piece?.color === gameState.currentPlayer;
    },
    execute: (gameState: GameState, targetSquare: Square) => {
      const newChess = new Chess(gameState.chess.fen());
      const pilotPiece = newChess.get(targetSquare);
      if (!pilotPiece) return gameState;

      // Find enemy piece of same type
      const opponentPieces = getPiecesOfColor(newChess, getOpponentColor(pilotPiece.color));
      const targetPiece = opponentPieces.find(p => p.piece.type === pilotPiece.type);
      
      if (targetPiece) {
        newChess.remove(targetPiece.square);
      } else {
        // Fallback: Pawn → Queen → King
        const fallbackOrder = ['p', 'q', 'k'];
        for (const type of fallbackOrder) {
          const fallbackTarget = opponentPieces.find(p => p.piece.type === type);
          if (fallbackTarget) {
            newChess.remove(fallbackTarget.square);
            break;
          }
        }
      }

      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'swapPlaces',
    name: 'Swap Places',
    icon: '🔄',
    description: 'Swap positions of any two of your pieces (King excluded).',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, square1: Square, square2: Square) => {
      const piece1 = gameState.chess.get(square1);
      const piece2 = gameState.chess.get(square2);
      return piece1?.color === gameState.currentPlayer &&
             piece2?.color === gameState.currentPlayer &&
             piece1.type !== 'k' && piece2.type !== 'k';
    },
    execute: (gameState: GameState, square1: Square, square2: Square) => {
      const newChess = new Chess(gameState.chess.fen());
      const piece1 = newChess.get(square1);
      const piece2 = newChess.get(square2);
      
      if (piece1 && piece2) {
        newChess.remove(square1);
        newChess.remove(square2);
        newChess.put(piece1, square2);
        newChess.put(piece2, square1);
      }

      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'shield',
    name: 'Shield',
    icon: '🛡️',
    description: 'Make one of your pieces invulnerable to any single creative action on opponent\'s next turn.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      const piece = gameState.chess.get(targetSquare);
      return piece?.color === gameState.currentPlayer;
    },
    execute: (gameState: GameState, targetSquare: Square) => {
      // Would need status tracking for shields
      return gameState;
    }
  },

  {
    id: 'empBlast',
    name: 'EMP Blast',
    icon: '⚡',
    description: 'All active Robots and Shields lose effect for 2 turns.',
    used: false,
    needsTarget: false,
    execute: (gameState: GameState) => {
      // Clear all robot and shield effects
      return gameState;
    }
  },

  {
    id: 'lootDrop',
    name: 'Loot Drop',
    icon: '🎁',
    description: 'Gain two random extra uses of one of the remaining (unused) creative actions.',
    used: false,
    needsTarget: false,
    execute: (gameState: GameState) => {
      // Would need to track action uses and randomly boost one
      return gameState;
    }
  },

  {
    id: 'timeFreeze',
    name: 'Time Freeze',
    icon: '⏳',
    description: 'Opponent cannot activate any action on their next turn.',
    used: false,
    needsTarget: false,
    execute: (gameState: GameState) => {
      // Would need to track time freeze effect
      return gameState;
    }
  },

  {
    id: 'cloneRay',
    name: 'Clone Ray',
    icon: '🧬',
    description: 'Duplicate one of your non-King pieces onto any empty square.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, sourceSquare: Square, targetSquare: Square) => {
      const piece = gameState.chess.get(sourceSquare);
      const targetPiece = gameState.chess.get(targetSquare);
      return piece?.color === gameState.currentPlayer &&
             piece.type !== 'k' &&
             !targetPiece;
    },
    execute: (gameState: GameState, sourceSquare: Square, targetSquare: Square) => {
      const newChess = new Chess(gameState.chess.fen());
      const piece = newChess.get(sourceSquare);
      if (piece) {
        newChess.put(piece, targetSquare);
      }
      
      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'spyDrone',
    name: 'Spy Drone',
    icon: '📡',
    description: 'Reveal and steal one unused action from opponent\'s inventory at random.',
    used: false,
    needsTarget: false,
    execute: (gameState: GameState) => {
      // Would need to track available actions per player
      return gameState;
    }
  },

  {
    id: 'sniperShot',
    name: 'Sniper Shot',
    icon: '🎯',
    description: 'Remove any single enemy piece that is at least 3 squares away (Manhattan distance ≥ 3).',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      const piece = gameState.chess.get(targetSquare);
      if (!piece || piece.color === gameState.currentPlayer) return false;
      
      // Find player's pieces and check distance
      const playerPieces = getPiecesOfColor(gameState.chess, gameState.currentPlayer);
      return playerPieces.some(p => getSquareDistance(p.square, targetSquare) >= 3);
    },
    execute: (gameState: GameState, targetSquare: Square) => {
      const newChess = new Chess(gameState.chess.fen());
      newChess.remove(targetSquare);
      
      return {
        ...gameState,
        chess: newChess,
      };
    }
  },

  {
    id: 'puzzleTrap',
    name: 'Puzzle Trap',
    icon: '🧩',
    description: 'Plant a trap on an empty square; the next opponent piece that moves on it is captured.',
    used: false,
    needsTarget: true,
    targetType: 'square',
    validateTarget: (gameState: GameState, targetSquare: Square) => {
      return !gameState.chess.get(targetSquare); // Empty square
    },
    execute: (gameState: GameState, targetSquare: Square) => {
      // Would need to track trap locations
      return gameState;
    }
  },

  {
    id: 'rocketBarrage',
    name: 'Rocket Barrage',
    icon: '🚀',
    description: 'Target up to 3 enemy pieces; for each, roll a virtual d6—4–6 = removed, 1–3 = survives.',
    used: false,
    needsTarget: true,
    targetType: 'piece',
    validateTarget: (gameState: GameState, ...targetSquares: Square[]) => {
      return targetSquares.length <= 3 && targetSquares.every(square => {
        const piece = gameState.chess.get(square);
        return piece && piece.color !== gameState.currentPlayer;
      });
    },
    execute: (gameState: GameState, ...targetSquares: Square[]) => {
      const newChess = new Chess(gameState.chess.fen());
      
      for (const square of targetSquares) {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll >= 4) {
          newChess.remove(square);
        }
      }
      
      return {
        ...gameState,
        chess: newChess,
      };
    }
  }
];

export const getActionById = (id: string): ActionEffect | undefined => {
  return creativeActions.find(action => action.id === id);
};

export const getAvailableActions = (): ActionEffect[] => {
  return creativeActions.filter(action => !action.used);
};