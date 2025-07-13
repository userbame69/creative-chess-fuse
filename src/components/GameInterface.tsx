import React, { useState } from 'react';
import { Square } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Crown, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChessBoard from './ChessBoard';
import { useChessGame } from '@/hooks/useChessGame';
import { ActionEffect } from '@/types/chess';

const GameInterface: React.FC = () => {
  const {
    gameState,
    makeMove,
    selectSquare,
    executeAction,
    resetGame,
    getAvailableActions,
    isCreativePhase,
  } = useChessGame();

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<Square | null>(null);

  const handleSquareClick = (square: Square) => {
    if (selectedAction) {
      // Handle action targeting
      const action = getAvailableActions().find(a => a.id === selectedAction);
      if (action?.needsTarget) {
        if (action.validateTarget?.(gameState, square)) {
          executeAction(selectedAction, square);
          setSelectedAction(null);
          setActionTarget(null);
        }
      }
    } else {
      // Normal chess move
      selectSquare(square);
    }
  };

  const handleActionClick = (actionId: string) => {
    const action = getAvailableActions().find(a => a.id === actionId);
    
    if (action?.needsTarget) {
      setSelectedAction(actionId);
      setActionTarget(null);
    } else {
      executeAction(actionId);
    }
  };

  const availableActions = getAvailableActions();
  const currentPlayerName = gameState.currentPlayer === 'w' ? 'White' : 'Black';
  const movesToCreative = Math.max(0, 20 - gameState.halfMoves);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row gap-6 p-6">
      {/* Game Board Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge 
              variant={gameState.phase === 'creative' ? 'default' : 'secondary'}
              className={cn(
                "text-lg px-4 py-2 transition-all duration-300",
                gameState.phase === 'creative' && "bg-gradient-creative animate-pulse-glow"
              )}
            >
              {gameState.phase === 'creative' ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Creative Phase
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Standard Phase ({movesToCreative} moves to go)
                </>
              )}
            </Badge>
          </div>
          
          {gameState.gameOver ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                <Crown className="w-8 h-8" />
                {gameState.winner === 'w' ? 'White' : 'Black'} Wins!
              </h2>
              <p className="text-muted-foreground mb-4">No pieces remaining for the opponent</p>
              <Button onClick={resetGame} variant="default" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
            </div>
          ) : (
            <h2 className="text-2xl font-semibold text-foreground">
              {currentPlayerName}'s Turn
            </h2>
          )}
        </div>

        <ChessBoard
          position={gameState.chess.fen()}
          selectedSquare={gameState.selectedSquare}
          validMoves={gameState.validMoves}
          lastMove={gameState.lastMove}
          onSquareClick={handleSquareClick}
          flipped={gameState.currentPlayer === 'b'}
        />

        {selectedAction && (
          <div className="mt-4 p-4 bg-creative-bg border border-creative-border rounded-lg">
            <p className="text-creative-glow font-medium">
              Click on the board to target with: {availableActions.find(a => a.id === selectedAction)?.name}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAction(null);
                setActionTarget(null);
              }}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Game Controls & Actions Section */}
      <div className="w-full lg:w-96 space-y-6">
        {/* Game Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Game Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Half-moves:</span>
              <Badge variant="outline">{gameState.halfMoves}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Phase:</span>
              <Badge variant={gameState.phase === 'creative' ? 'default' : 'secondary'}>
                {gameState.phase}
              </Badge>
            </div>
            <Separator />
            <Button 
              onClick={resetGame} 
              variant="outline" 
              className="w-full"
              disabled={gameState.halfMoves === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Game
            </Button>
          </CardContent>
        </Card>

        {/* Creative Actions */}
        {isCreativePhase && !gameState.gameOver && (
          <Card className="border-creative-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-creative-glow">
                <Zap className="w-5 h-5" />
                Creative Actions
                <Badge variant="outline" className="ml-auto">
                  {availableActions.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableActions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  All actions have been used!
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {availableActions.map((action: ActionEffect) => (
                    <Button
                      key={action.id}
                      variant={selectedAction === action.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleActionClick(action.id)}
                      className={cn(
                        "justify-start h-auto p-3 text-left transition-all duration-200",
                        selectedAction === action.id && "ring-2 ring-primary",
                        "hover:bg-action-hover/10"
                      )}
                      disabled={gameState.currentPlayer !== (gameState.currentPlayer)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {action.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {action.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How to Play */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Standard Phase:</strong> Play normal chess for the first 20 half-moves.</p>
            <p><strong>Creative Phase:</strong> Use powerful one-time actions to change the game!</p>
            <p><strong>Win Condition:</strong> Eliminate all opponent pieces (King is not special).</p>
            <p><strong>Actions:</strong> Each action can only be used once per game by either player.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameInterface;