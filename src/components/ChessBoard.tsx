import React from 'react';
import { Square } from 'chess.js';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  position: string;
  selectedSquare: Square | null;
  validMoves: string[];
  lastMove: { from: Square; to: Square } | null;
  onSquareClick: (square: Square) => void;
  flipped?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  position,
  selectedSquare,
  validMoves,
  lastMove,
  onSquareClick,
  flipped = false,
}) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  if (flipped) {
    files.reverse();
    ranks.reverse();
  }

  const pieceUnicode: { [key: string]: string } = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
  };

  const parseFEN = (fen: string) => {
    const board: { [key: string]: string } = {};
    const [position] = fen.split(' ');
    const ranks = position.split('/');
    
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      const rank = ranks[rankIndex];
      let fileIndex = 0;
      
      for (const char of rank) {
        if (char >= '1' && char <= '8') {
          fileIndex += parseInt(char);
        } else {
          const square = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
          const color = char === char.toUpperCase() ? 'w' : 'b';
          board[square] = color + char.toUpperCase();
          fileIndex++;
        }
      }
    }
    
    return board;
  };

  const boardPosition = parseFEN(position);

  const isLightSquare = (file: string, rank: string) => {
    const fileIndex = files.indexOf(file);
    const rankIndex = ranks.indexOf(rank);
    return (fileIndex + rankIndex) % 2 === 0;
  };

  const getSquareClasses = (square: Square) => {
    const isLight = isLightSquare(square[0], square[1]);
    const isSelected = selectedSquare === square;
    const isValidMove = validMoves.includes(square);
    const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
    
    return cn(
      "w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 text-2xl font-bold select-none relative",
      {
        "bg-chess-light": isLight,
        "bg-chess-dark": !isLight,
        "ring-2 ring-chess-highlight ring-offset-1": isSelected,
        "ring-1 ring-chess-capture": isLastMove,
        "after:absolute after:w-3 after:h-3 after:bg-action-available after:rounded-full after:opacity-60": isValidMove && !boardPosition[square],
        "after:absolute after:inset-0 after:border-2 after:border-action-available after:opacity-60": isValidMove && boardPosition[square],
      }
    );
  };

  return (
    <div className="inline-block p-4 bg-gradient-board rounded-lg shadow-2xl">
      <div className="grid grid-cols-8 gap-0 border-2 border-border rounded-md overflow-hidden">
        {ranks.map((rank) =>
          files.map((file) => {
            const square = (file + rank) as Square;
            const piece = boardPosition[square];
            
            return (
              <div
                key={square}
                className={getSquareClasses(square)}
                onClick={() => onSquareClick(square)}
              >
                {piece && (
                  <span 
                    className={cn(
                      "drop-shadow-sm transition-transform hover:scale-110",
                      piece[0] === 'w' ? "text-chess-white-piece" : "text-chess-black-piece"
                    )}
                  >
                    {pieceUnicode[piece]}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Coordinate labels */}
      <div className="flex justify-between mt-2 px-2 text-xs text-muted-foreground">
        {files.map(file => (
          <span key={file} className="w-12 text-center">{file}</span>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;