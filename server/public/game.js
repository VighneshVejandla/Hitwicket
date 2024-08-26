const ws = new WebSocket('ws://localhost:8081');

ws.onopen = () => {
    console.log('Connected to the server');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
        case 'update':
            // Update game state on the client
            console.log('Game state updated:', message.data);
            break;
        case 'invalidMove':
            // Handle invalid move
            console.error('Invalid move:', message.message);
            break;
        case 'gameOver':
            // Handle game over
            console.log('Game over! Winner:', message.winner);
            break;
    }
};

// Example move sending
function sendMove(playerId, character, move) {
    ws.send(JSON.stringify({
        type: 'move',
        data: { playerId, character, move }
    }));
}
