import { useState, useCallback, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { GameState, PieceColor } from '@/types/chess';
import { creativeActions, getActionById } from '@/lib/chess-actions';

const CREATIVE_PHASE_THRESHOLD = 20;

export const useChessGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const chess = new Chess();
    return {
      chess,
      currentPlayer: 'w',
      phase: 'standard',
      halfMoves: 0,
      selectedSquare: null,
      validMoves: [],
      gameOver: false,
      winner: null,
      lastMove: null,
    };
  });

  const [actionRegistry, setActionRegistry] = useState(() => {
    const registry: { [key: string]: boolean } = {};
    creativeActions.forEach(action => {
      registry[action.id] = false; // false = unused, true = used
    });
    return registry;
  });

  const checkWinCondition = useCallback((chess: Chess): { gameOver: boolean; winner: PieceColor | null } => {
    let whitePieces = 0;
    let blackPieces = 0;
    
    for (let rank = 1; rank <= 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = String.fromCharCode(97 + file) + rank as Square;
        const piece = chess.get(square);
        if (piece) {
          if (piece.color === 'w') whitePieces++;
          else blackPieces++;
        }
      }
    }

    if (whitePieces === 0) return { gameOver: true, winner: 'b' };
    if (blackPieces === 0) return { gameOver: true, winner: 'w' };
    return { gameOver: false, winner: null };
  }, []);

  const makeMove = useCallback((from: Square, to: Square) => {
    try {
      const newChess = new Chess(gameState.chess.fen());
      const move = newChess.move({ from, to });
      
      if (move) {
        const newHalfMoves = gameState.halfMoves + 1;
        const phase = newHalfMoves >= CREATIVE_PHASE_THRESHOLD ? 'creative' : 'standard';
        const { gameOver, winner } = checkWinCondition(newChess);
        
        setGameState(prev => ({
          ...prev,
          chess: newChess,
          currentPlayer: newChess.turn() as PieceColor,
          phase,
          halfMoves: newHalfMoves,
          selectedSquare: null,
          validMoves: [],
          lastMove: { from, to },
          gameOver,
          winner,
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
    return false;
  }, [gameState.chess, gameState.halfMoves, checkWinCondition]);

  const selectSquare = useCallback((square: Square) => {
    const piece = gameState.chess.get(square);
    
    // If clicking on our own piece, select it
    if (piece && piece.color === gameState.currentPlayer) {
      const moves = gameState.chess.moves({ square, verbose: true });
      setGameState(prev => ({
        ...prev,
        selectedSquare: square,
        validMoves: moves.map(move => move.to),
      }));
    }
    // If we have a piece selected and this is a valid move, make the move
    else if (gameState.selectedSquare && gameState.validMoves.includes(square)) {
      makeMove(gameState.selectedSquare, square);
    }
    // Clear selection
    else {
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: [],
      }));
    }
  }, [gameState.chess, gameState.currentPlayer, gameState.selectedSquare, gameState.validMoves, makeMove]);

  const executeAction = useCallback((actionId: string, ...args: any[]) => {
    if (actionRegistry[actionId] || gameState.phase !== 'creative') {
      return false; // Action already used or not in creative phase
    }

    const action = getActionById(actionId);
    if (!action) return false;

    try {
      // Validate target if needed
      if (action.validateTarget && action.needsTarget) {
        if (!action.validateTarget(gameState, ...args)) {
          return false;
        }
      }

      // Execute the action
      const newGameState = action.execute(gameState, ...args);
      const { gameOver, winner } = checkWinCondition(newGameState.chess);
      
      setGameState(prev => ({
        ...newGameState,
        gameOver,
        winner,
        currentPlayer: prev.currentPlayer === 'w' ? 'b' : 'w', // Switch turns after action
      }));

      // Mark action as used
      setActionRegistry(prev => ({
        ...prev,
        [actionId]: true,
      }));

      return true;
    } catch (error) {
      console.error('Action execution failed:', error);
      return false;
    }
  }, [actionRegistry, gameState, checkWinCondition]);

  const resetGame = useCallback(() => {
    const chess = new Chess();
    setGameState({
      chess,
      currentPlayer: 'w',
      phase: 'standard',
      halfMoves: 0,
      selectedSquare: null,
      validMoves: [],
      gameOver: false,
      winner: null,
      lastMove: null,
    });
    
    const registry: { [key: string]: boolean } = {};
    creativeActions.forEach(action => {
      registry[action.id] = false;
    });
    setActionRegistry(registry);
  }, []);

  const getAvailableActions = useCallback(() => {
    return creativeActions.filter(action => !actionRegistry[action.id]);
  }, [actionRegistry]);

  return {
    gameState,
    actionRegistry,
    makeMove,
    selectSquare,
    executeAction,
    resetGame,
    getAvailableActions,
    isCreativePhase: gameState.phase === 'creative',
  };
};