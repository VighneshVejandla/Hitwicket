// ChessGame.jsx
import React, { useEffect, useState } from 'react';
import "./Chess.css";

const ChessGame = () => {
    const BOARD_SIZE = 5;
    const PLAYER_A_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];
    const PLAYER_B_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];

    const [roomId, setRoomId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [gameState, setGameState] = useState({
        board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
        currentPlayer: 'A',
        message: ''
    });
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (roomId) {
            const ws = new WebSocket(`ws://localhost:8081?roomId=${roomId}`);
            setSocket(ws);

            ws.onopen = () => {
                console.log(`WebSocket connection established for room ID: ${roomId}`);
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);

                if (data.type === 'boardState') {
                    console.log('Updating board state:', data.boardState);
                    setGameState(prevState => ({
                        ...prevState,
                        board: data.boardState,
                        currentPlayer: data.currentPlayer
                    }));
                } else if (data.type === 'move') {
                    console.log(`Player ${data.currentPlayer} moved ${data.character} from (${data.fromX}, ${data.fromY}) to (${data.toX}, ${data.toY})`);
                    setGameState(prevState => ({
                        ...prevState,
                        board: data.boardState,
                        currentPlayer: data.currentPlayer
                    }));

                    const fromLabel = getLabelForPosition(data.fromX, data.fromY);
                    const toLabel = getLabelForPosition(data.toX, data.toY);
                    setMoveHistory(prevHistory => [
                        ...prevHistory,
                        `Player ${data.currentPlayer} moved ${data.character} from ${fromLabel} to ${toLabel}`
                    ]);
                } else if (data.error) {
                    console.error('Error from server:', data.error);
                    setGameState(prevState => ({
                        ...prevState,
                        message: data.error
                    }));
                }
            };

            ws.onclose = () => {
                console.log(`WebSocket connection closed for room ID: ${roomId}`);
                setIsConnected(false);
            };

            return () => {
                ws.close();
            };
        }
    }, [roomId]);

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

        switch (character.slice(1)) {
            case 'P1':
            case 'P2':
            case 'P3':
                return (deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1);
            case 'H1':
                return (deltaX === 2 && deltaY === 0) || (deltaX === 0 && deltaY === 2);
            case 'H2':
                return deltaX === 1 && deltaY === 1;
            default:
                return false;
        }
    };

    const getLabelForPosition = (x, y) => {
        const rowLabel = String.fromCharCode('A'.charCodeAt(0) + x);
        const colLabel = (y + 1).toString();
        return `${rowLabel}${colLabel}`;
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
    
                    const fromLabel = getLabelForPosition(fromX, fromY);
                    const toLabel = getLabelForPosition(x, y);
    
                    // Send move to the server
                    if (socket) {
                        console.log(`Sending move to server: ${selectedCharacter} from (${fromX}, ${fromY}) to (${x}, ${y})`);
                        socket.send(JSON.stringify({
                            type: 'move',
                            character: selectedCharacter,
                            fromX,
                            fromY,
                            toX: x,
                            toY: y,
                            boardState: newBoard,
                            currentPlayer: gameState.currentPlayer
                        }));
                    }
    
                    setMoveHistory(prevHistory => [
                        ...prevHistory,
                        `Player ${gameState.currentPlayer} moved ${selectedCharacter} from ${fromLabel} to ${toLabel}`
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
                        message: `Hey, you can move to the occupied cell of your own`,
                        messageType: 'occupied-message'
                    }));
                }
            } else {
                setGameState(prevState => ({
                    ...prevState,
                    message: `Nahh.. you made a wrong move for ${selectedCharacter}`,
                    messageType: 'wrong-move-message'
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
            {cell ? cell : ""}
        </div>
    ));

    const handleCreateRoom = () => {
        const newRoomId = (Math.floor(Math.random() * 100000) + 1).toString();
        setRoomId(newRoomId);
        console.log(`Created room with ID: ${newRoomId}`);
    };

    return (
        <div>
            <h1>5x5 Chess Game</h1>
            
            <div>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={handleCreateRoom} disabled={isConnected}>Create Room</button>
            </div>

            {isConnected ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: '10px' }}>
                            {['1', '2', '3', '4', '5'].map(label => (
                                <div key={label} style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</div>
                            ))}
                        </div>

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
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <div>
                            <p>{gameState.message}</p>
                            <div>
                                {moveHistory.map((move, index) => (
                                    <p key={index}>{move}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div>Connecting...</div>
            )}
        </div>
    );
};

export default ChessGame;
