const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Define character types and their movement
const CHARACTER_TYPES = {
    P: { name: 'Pawn', moves: ['L', 'R', 'F', 'B'] },
    H1: { name: 'Hero1', moves: ['L', 'R', 'F', 'B'] },
    H2: { name: 'Hero2', moves: ['FL', 'FR', 'BL', 'BR'] },
    H3: { name: 'Hero3', moves: ['FL', 'FR', 'BL', 'BR', 'RF', 'RB', 'LF', 'LB'] },
};

// Initial game state
let gameState = {
    board: Array(5).fill(null).map(() => Array(5).fill(null)),
    players: [
        { id: 'A', characters: [] },
        { id: 'B', characters: [] }
    ],
    currentPlayer: 'A'
};

// WebSocket connection handling
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const { type, data } = JSON.parse(message);

        if (type === 'move') {
            const result = handleMove(data);
            if (!result.success) {
                ws.send(JSON.stringify({ type: 'invalidMove', message: result.message }));
            }
        }

        // Handle other messages like game initialization, etc.
    });
});

function handleMove({ playerId, character, move }) {
    const char = getCharacter(character);
    
    if (!char || char.player !== playerId) {
        return { success: false, message: 'Character not found or not owned by player' };
    }
    
    if (!validateMove(char.type, move)) {
        return { success: false, message: 'Invalid move' };
    }
    
    const { x: startX, y: startY } = getCharacterPosition(character);
    const [newX, newY] = calculateNewPosition(startX, startY, move, char);

    if (isOutOfBounds(newX, newY) || (gameState.board[newX][newY] && gameState.board[newX][newY].player === playerId)) {
        return { success: false, message: 'Move out of bounds or to a friendly character' };
    }

    // Handle attack path for Hero1 and Hero2
    if (char.type === 'H1' || char.type === 'H2') {
        handleAttackPath(startX, startY, newX, newY, char);
    }

    // Update board and character positions
    gameState.board[newX][newY] = char;
    gameState.board[startX][startY] = null;

    // Check for game over
    const winner = checkGameOver();
    if (winner) {
        broadcast(JSON.stringify({ type: 'gameOver', winner }));
        return { success: false, message: 'Game Over' };
    }

    // Switch current player
    gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';

    // Broadcast updated game state
    broadcast(JSON.stringify({ type: 'update', data: gameState }));

    return { success: true };
}

// Validate a move
function validateMove(characterType, move) {
    if (!CHARACTER_TYPES[characterType]) {
        return false;
    }
    return CHARACTER_TYPES[characterType].moves.includes(move);
}

// Calculate new position
function calculateNewPosition(x, y, move, char) {
    switch (move) {
        case 'L': return [x, y - 1];
        case 'R': return [x, y + 1];
        case 'F': return [x - 1, y];
        case 'B': return [x + 1, y];
        case 'FL': return [x - 1, y - 1];
        case 'FR': return [x - 1, y + 1];
        case 'BL': return [x + 1, y - 1];
        case 'BR': return [x + 1, y + 1];
        case 'RF': return [x - 2, y + 1];
        case 'RB': return [x + 2, y + 1];
        case 'LF': return [x - 2, y - 1];
        case 'LB': return [x + 2, y - 1];
        default: return [x, y];
    }
}

// Check if a position is out of bounds
function isOutOfBounds(x, y) {
    return x < 0 || x >= 5 || y < 0 || y >= 5;
}

// Handle attack path for Hero1 and Hero2
function handleAttackPath(startX, startY, endX, endY, char) {
    const dx = endX - startX;
    const dy = endY - startY;
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    
    let x = startX + stepX;
    let y = startY + stepY;

    while (x !== endX || y !== endY) {
        if (gameState.board[x][y]) {
            if (gameState.board[x][y].player !== char.player) {
                gameState.board[x][y] = null;
            }
            break;
        }
        x += stepX;
        y += stepY;
    }
}

// Get character object from game state
function getCharacter(character) {
    for (const player of gameState.players) {
        const char = player.characters.find(c => c.name === character);
        if (char) return char;
    }
    return null;
}

// Get character's position from game state
function getCharacterPosition(character) {
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (gameState.board[x][y]?.name === character) {
                return { x, y };
            }
        }
    }
    return { x: null, y: null };
}

// Check if the game is over
function checkGameOver() {
    const playerAChars = gameState.players[0].characters;
    const playerBChars = gameState.players[1].characters;
    const playerAAlive = playerAChars.some(char => gameState.board.some(row => row.includes(char)));
    const playerBAlive = playerBChars.some(char => gameState.board.some(row => row.includes(char)));

    if (!playerAAlive) return 'B';
    if (!playerBAlive) return 'A';
    return null;
}

// Broadcast updates to all connected clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start the server
server.listen(8081, () => {
    console.log('Server is listening on port 8081');
});