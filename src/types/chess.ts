import { Chess, Square } from 'chess.js';

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  square: Square;
}

export interface GameState {
  chess: Chess;
  currentPlayer: PieceColor;
  phase: 'standard' | 'creative';
  halfMoves: number;
  selectedSquare: Square | null;
  validMoves: string[];
  gameOver: boolean;
  winner: PieceColor | null;
  lastMove: { from: Square; to: Square } | null;
}

export interface ActionEffect {
  id: string;
  name: string;
  icon: string;
  description: string;
  used: boolean;
  execute: (gameState: GameState, ...args: any[]) => GameState;
  validateTarget?: (gameState: GameState, ...args: any[]) => boolean;
  needsTarget?: boolean;
  targetType?: 'square' | 'piece' | 'area' | 'none';
}

export interface CreativeAction {
  id: string;
  name: string;
  icon: string;
  description: string;
  used: boolean;
  cooldown?: number;
  lastUsed?: number;
}

export interface ActionRegistry {
  [key: string]: ActionEffect;
}

export interface PieceStatus {
  square: Square;
  frozen?: number; // turns remaining
  shielded?: boolean;
  robot?: boolean;
  trap?: boolean;
}

export interface GameStatus {
  pieceStatuses: Map<Square, PieceStatus>;
  activeEffects: string[];
  timeFreeze?: {
    target: PieceColor;
    turnsRemaining: number;
  };
}