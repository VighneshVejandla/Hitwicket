import "./Chess.css";
import React, { useEffect, useState } from 'react';

const ChessGame = () => {
    const BOARD_SIZE = 5;
    const PLAYER_A_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];
    const PLAYER_B_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];

    const [gameState, setGameState] = useState({
        board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
        currentPlayer: 'A',
        message: ''
    });
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);

    useEffect(() => {
        const initialBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

        PLAYER_A_CHARACTERS.forEach((char, index) => {
            initialBoard[index][0] = `A${char}`;
        });

        PLAYER_B_CHARACTERS.forEach((char, index) => {
            initialBoard[index][BOARD_SIZE - 1] = `B${char}`;
        });

        setGameState(prevState => ({
            ...prevState,
            board: initialBoard
        }));
    }, []);

    const getCellClass = (cell) => {
        if (cell) {
            const type = cell.slice(1);
            switch (type) {
                case 'P1':
                case 'P2':
                case 'P3':
                    return 'pawn';
                case 'H1':
                    return 'hero1';
                case 'H2':
                    return 'hero2';
                default:
                    return '';
            }
        }
        return '';
    };

    const isValidMove = (character, fromX, fromY, toX, toY) => {
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        const targetCell = gameState.board[toX][toY];
        const targetPlayer = targetCell ? targetCell.charAt(0) : null;

        switch (character.slice(1)) {
            case 'P1':
            case 'P2':
            case 'P3':
                return deltaX <= 1 && deltaY <= 1; // Pawns move one block in any direction
            case 'H1':
                return (deltaX === 2 && deltaY === 0) || (deltaX === 0 && deltaY === 2); // Hero1 moves two blocks straight
            case 'H2':
                return deltaX === 1 && deltaY === 1; // Hero2 moves one block diagonally
            default:
                return false;
        }
    };

    const handleCellClick = (x, y) => {
        const character = gameState.board[x][y];

        if (selectedCharacter) {
            const [fromX, fromY] = findCharacterPosition(selectedCharacter, gameState.board);

            if (isValidMove(selectedCharacter, fromX, fromY, x, y)) {
                const targetCell = gameState.board[x][y];
                const targetPlayer = targetCell ? targetCell.charAt(0) : null;

                if (targetPlayer === null || targetPlayer !== gameState.currentPlayer) {
                    const newBoard = gameState.board.map(row => row.slice());

                    newBoard[fromX][fromY] = null;
                    newBoard[x][y] = selectedCharacter;

                    // Record the move
                    setMoveHistory(prevHistory => [
                        ...prevHistory,
                        `Player ${gameState.currentPlayer} moved ${selectedCharacter} from (${fromX}, ${fromY}) to (${x}, ${y})`
                    ]);

                    setGameState(prevState => ({
                        ...prevState,
                        board: newBoard,
                        currentPlayer: prevState.currentPlayer === 'A' ? 'B' : 'A',
                        message: ''
                    }));

                    setSelectedCharacter(null);
                } else {
                    setGameState(prevState => ({
                        ...prevState,
                        message: `Cannot move to a cell occupied by your own character`
                    }));
                }
            } else {
                setGameState(prevState => ({
                    ...prevState,
                    message: `Wrong move for ${selectedCharacter}`
                }));
            }
        } else if (character && character.startsWith(gameState.currentPlayer)) {
            setSelectedCharacter(character);
            console.log(`Selected character: ${character} at position (${x}, ${y})`);
            setGameState(prevState => ({
                ...prevState,
                message: ''
            }));
        }
    };

    const findCharacterPosition = (character, board) => {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === character) {
                    return [i, j];
                }
            }
        }
        return null;
    };

    const BoardCell = React.memo(({ cell, rowIndex, cellIndex }) => (
        <div
            className={`board-cell ${getCellClass(cell)}`}
            onClick={() => handleCellClick(rowIndex, cellIndex)}
        >
            {cell ? cell : ''}
        </div>
    ));

    return (
        <div>
            <h1>5x5 Chess Game</h1>
            <div id="game-board">
                {gameState.board.map((row, rowIndex) => (
                    <div key={rowIndex} className="board-row">
                        {row.map((cell, cellIndex) => (
                            <BoardCell
                                key={cellIndex}
                                cell={cell}
                                rowIndex={rowIndex}
                                cellIndex={cellIndex}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {gameState.message && <div className="error-message">{gameState.message}</div>}
            <div id="move-history">
                <h2>Move History</h2>
                <ul>
                    {moveHistory.map((move, index) => (
                        <li key={index}>{move}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ChessGame;












// import "./Chess.css";
// import React, { useEffect, useState } from 'react';

// const ChessGame = () => {
//     const BOARD_SIZE = 5;
//     const PLAYER_A_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];
//     const PLAYER_B_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];

//     const [gameState, setGameState] = useState({
//         board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
//         currentPlayer: 'A',
//         message: '',
//         moveHistory: []
//     });
//     const [selectedCharacter, setSelectedCharacter] = useState(null);

//     useEffect(() => {
//         const initialBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

//         PLAYER_A_CHARACTERS.forEach((char, index) => {
//             initialBoard[index][0] = `A${char}`;
//         });

//         PLAYER_B_CHARACTERS.forEach((char, index) => {
//             initialBoard[index][BOARD_SIZE - 1] = `B${char}`;
//         });

//         setGameState(prevState => ({
//             ...prevState,
//             board: initialBoard
//         }));
//     }, []);

//     const getCellClass = (cell) => {
//         if (cell) {
//             const type = cell.slice(1);
//             switch (type) {
//                 case 'P1':
//                 case 'P2':
//                 case 'P3':
//                     return 'pawn';
//                 case 'H1':
//                     return 'hero1';
//                 case 'H2':
//                     return 'hero2';
//                 default:
//                     return '';
//             }
//         }
//         return '';
//     };

//     const isValidMove = (character, fromX, fromY, toX, toY) => {
//         const deltaX = Math.abs(toX - fromX);
//         const deltaY = Math.abs(toY - fromY);

//         switch (character.slice(1)) {
//             case 'P1':
//             case 'P2':
//             case 'P3':
//                 return (deltaX <= 1 && deltaY <= 1); // Pawns move one block in any direction
//                 // return (deltaX === 0 && deltaY === 2) || (deltaX === 2 && deltaY === 0)
//             case 'H1':
//                 return ((deltaX === 2 && deltaY === 0) || (deltaX === 0 && deltaY === 2)); // Hero1 moves two blocks straight
//             case 'H2':
//                 return (deltaX === 1 && deltaY === 1); // Hero2 moves one block diagonally
//             default:
//                 return false;
//         }
//     };

//     const handleCellClick = (x, y) => {
//         const character = gameState.board[x][y];

//         if (selectedCharacter) {
//             const [fromX, fromY] = findCharacterPosition(selectedCharacter, gameState.board);

//             if (isValidMove(selectedCharacter, fromX, fromY, x, y)) {
//                 const newBoard = gameState.board.map(row => row.slice());

//                 newBoard[fromX][fromY] = null;
//                 newBoard[x][y] = selectedCharacter;

//                 setGameState(prevState => ({
//                     ...prevState,
//                     board: newBoard,
//                     currentPlayer: prevState.currentPlayer === 'A' ? 'B' : 'A',
//                     message: '',
//                     moveHistory: [...prevState.moveHistory, `Moved ${selectedCharacter} from (${fromX + 1}, ${fromY + 1}) to (${x + 1}, ${y + 1})`]
//                 }));

//                 setSelectedCharacter(null);
//             } else {
//                 setGameState(prevState => ({
//                     ...prevState,
//                     message: `Wrong move for ${selectedCharacter}`
//                 }));
//             }
//         } else if (character && character.startsWith(gameState.currentPlayer)) {
//             setSelectedCharacter(character);
//             console.log(`Selected character: ${character} at position (${x}, ${y})`);
//             setGameState(prevState => ({
//                 ...prevState,
//                 message: ''
//             }));
//         }
//     };

//     const findCharacterPosition = (character, board) => {
//         for (let i = 0; i < BOARD_SIZE; i++) {
//             for (let j = 0; j < BOARD_SIZE; j++) {
//                 if (board[i][j] === character) {
//                     return [i, j];
//                 }
//             }
//         }
//         return null;
//     };

//     const BoardCell = React.memo(({ cell, rowIndex, cellIndex }) => (
//         <div
//             className={`board-cell ${getCellClass(cell)}`}
//             onClick={() => handleCellClick(rowIndex, cellIndex)}
//         >
//             {cell ? cell : ''}
//         </div>
//     ));

//     return (
//         <div id="game-container">
//             <h1>5x5 Chess Game</h1>
//             <div id="board-container">
//                 <div className="horizontal-labels">
//                     {['A', 'B', 'C', 'D', 'E'].map(label => (
//                         <div key={label} className="label">{label}</div>
//                     ))}
//                 </div>
//                 <div id="game-board">
//                     {gameState.board.map((row, rowIndex) => (
//                         <div key={rowIndex} className="board-row">
//                             {row.map((cell, cellIndex) => (
//                                 <BoardCell
//                                     key={cellIndex}
//                                     cell={cell}
//                                     rowIndex={rowIndex}
//                                     cellIndex={cellIndex}
//                                 />
//                             ))}
//                         </div>
//                     ))}
//                 </div>
//                 <div className="vertical-labels">
//                     {['5', '4', '3', '2', '1'].map(label => (
//                         <div key={label} className="label">{label}</div>
//                     ))}
//                 </div>
//             </div>
//             <div id="move-history">
//                 <h2>Move History</h2>
//                 <ul>
//                     {gameState.moveHistory.map((move, index) => (
//                         <li key={index}>{move}</li>
//                     ))}
//                 </ul>
//             </div>
//             {gameState.message && <div id="error-message">{gameState.message}</div>}
//         </div>
//     );
// };

// export default ChessGame;
