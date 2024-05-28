const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const port = process.env.PORT || 443;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: "*",
    methods: ["GET", "POST"]
});

let rooms = [];
const roomLastActivity = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.emit('roomsList', rooms);

    socket.on('createRoom', (roomName) => {
        if (!rooms.includes(roomName)) {
            rooms.push(roomName);
            roomLastActivity[roomName] = Date.now(); // Set initial activity time
            io.emit('roomsList', rooms);
            console.log(`Room created: ${roomName}`);
        } else {
            console.log(`Room already exists: ${roomName}`);
        }
    });

    socket.on('joinRoom', (room) => {
        if (rooms.includes(room)) {
            socket.join(room);
            console.log(`${socket.id} joined room: ${room}`);
            io.to(room).emit('message', 'A new player joined the room.');

            // Update last activity time when user joins
            roomLastActivity[room] = Date.now();
        } else {
            console.log(`Attempted to join non-existent room: ${room}`);
        }
    });

    socket.on('sendNumber', (number, room) => {
        // console.log('Received number from frontend:', number);
        const playerId = socket.id;

        // Generate cards for the player and send them to the player
        const cards = generateCards(number, playerId);
        io.emit('playerCards', cards, playerId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        rooms = rooms.filter((room) => !Object.keys(io.sockets.adapter.rooms).includes(room));

        io.emit('roomsList', rooms);
    });


});

// Function to check room activity and perform cleanup
function checkRoomActivity() {
    console.log("checking room activity...")
    const now = Date.now();
    for (const room in roomLastActivity) {
        if (now - roomLastActivity[room] > 5 * 60 * 1000) { // Check if inactive for 5 minutes
            // Perform cleanup or action for inactive room
            console.log(`Room ${room} has been inactive.`);
            rooms.pop();
            delete roomLastActivity[room];
            // Additional cleanup logic here
        }
    }
}

function generateCards(num, playerId) {
    const cards = [];
    let remainder;
    num = parseInt(num);

    if (isNaN(num)) {
        console.error('Invalid input: number is not a valid integer');
        return null;
    }

    if (num < 600) {
        // Ensure the number is large enough
        while (num < 600) {
            num += 100;
        }
    }

    for (let i = 0; i < 5; i++) {
        remainder = num % 7;


        // Generate a card based on the remainder
        if (remainder === 1 || remainder === 4) {
            cards.push('ROCK');
        } else if (remainder === 2 || remainder === 5) {
            cards.push('PAPER');
        } else if (remainder === 3 || remainder === 6) {
            cards.push('SCISSORS');
        } else {
            num += 1;
            cards.push('ROCK'); // Or choose any default card type
        }

        num = Math.floor(num / 7); // Use Math.floor for integer division
    }

    return { playerId, cards };
}



// Check room activity every minute
setInterval(checkRoomActivity, 300 * 1000);

server.listen(port, () => {
    console.log('Listening on *:', port);
});
