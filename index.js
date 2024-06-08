const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: "*"
});

let rooms = [];
let sentCards = {};
let playerChoices = {} //player choices per room
const roomLastActivity = {}; //each room last activity
let choiceTimeouts = {};
//app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

io.on('connection', (socket) => {
    socket.emit('roomsList', rooms);

    socket.on('roomCreated', (roomName) => {
        if (!rooms.includes(roomName)) {
            rooms.push(roomName);
            roomLastActivity[roomName] = Date.now();
            playerChoices[roomName] = {};
            io.emit('roomsList', rooms);
            // console.log(`Room created: ${roomName}`);
        } else {
            // io.emit("roomExists", roomName);
            console.log(`Room already exists: ${roomName}`);
        }
    });

        socket.on('joinRoom', async (room) => {
        if (rooms.includes(room)) {

            let size = await io.in(room).allSockets();
            // console.log(size.size);

            if (size.size <= 2){
                socket.join(room);


                console.log(`${socket.id} joined room: ${room}`);
                io.to(room).emit('message', 'A new player joined the room.');

                // Update last activity time when user joins
                roomLastActivity[room] = Date.now();



            } else {
                io.to(room).emit('message', 'This room is full.')
            }

        } else {
            console.log(`Attempted to join non-existent room: ${room}`);
        }
    });

    socket.on('leave', (room) => {
        console.log(`Player ${socket.id} left the room ${room}`)
        // Emit a 'leaveRoom' event to all other players in the room
        socket.to(room).emit('leaveRoom', socket.id, room);
    });

    socket.on('sendNumber', async (number, room) => {

        const playerId = socket.id;

        let size = await io.in(room).allSockets();
        console.log(size.size);

        if (size.size <= 2) {
            if (!sentCards[room]) {
                sentCards[room] = {};
            }
            if (!sentCards[room][playerId]) {
                // Generate cards for the player and send them to the player   ]
                const cards = generateCards(number, playerId);
                io.to(playerId).emit('playerCards', cards, playerId);
                console.log("sent cards");
                sentCards[room][playerId] = true;
            }
        }else {
                console.log("Room is full. Cannot send number.");
        }
    });

            // if (roomPlayersCount[room] < 2) { // Check if room is not full
            //     if (!sentCards[room]) {
            //         sentCards[room] = {};
            //     }
            //
            //     if (!sentCards[room][playerId]) {
            //         // Generate cards for the player and send them to the player
            //         const cards = generateCards(number, playerId);
            //         io.to(playerId).emit('playerCards', cards, playerId);
            //         console.log("sent cards");
            //         sentCards[room][playerId] = true;
            //     }
            // } else {
            //     console.log("Room is full. Cannot send number.");
            // }

            // if (!sentCards[room]) {
            //     sentCards[room] = {};
            // }
            //
            // if (!sentCards[room][playerId]) {
            //     // Generate cards for the player and send them to the player
            //     const cards = generateCards(number, playerId);
            //     io.to(playerId).emit('playerCards', cards, playerId);
            //     console.log("sent cards");
            //     sentCards[room][playerId] = true;
            // }
        //
        //         });

    socket.on('cardChosen', (card, room) => {

        const playerId = socket.id;

        if (!room) {
            console.error('Player is not in any room.');
            return;
        }

        if (!playerChoices[room]) {
            playerChoices[room] = {};
        }


        playerChoices[room][playerId] = card;
        roomLastActivity[room] = Date.now();


        // Check if both players have chosen
        if (Object.keys(playerChoices[room]).length === 2) {
            clearTimeout(choiceTimeouts[room]); // Clear timeout if both players have chosen
            revealChoices(room);
        } else if (!choiceTimeouts[room]) {
            // Set timeout for 30 seconds
            choiceTimeouts[room] = setTimeout(() => {
                revealChoices(room);
            }, 30000);
        }
    });

});

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

    if (cards.length === 5){
        return { playerId, cards };
    }


}

function revealChoices(room) {
    const choices = playerChoices[room];
    if (!choices) return;

    const playerIds = Object.keys(choices);
    if (playerIds.length < 2) {
        // If less than two players have chosen, use default choice
        playerIds.forEach(playerId => {
            if (!choices[playerId]) {
                choices[playerId] = 'NO_CHOICE';
            }
        });
    }

    const player1Choice = choices[playerIds[0]];
    const player2Choice = choices[playerIds[1]];

    let winner;
    if (player1Choice === player2Choice) {
        // It's a tie
        winner = 'TIE';
    } else if (
        (player1Choice === 'rock' && player2Choice === 'scissors') ||
        (player1Choice === 'scissors' && player2Choice === 'paper') ||
        (player1Choice === 'paper' && player2Choice === 'rock')
    ) {
        // Player 1 wins
        winner = playerIds[0];
    } else {
        // Player 2 wins
        winner = playerIds[1];
    }

    io.to(room).emit('revealChoices', choices);
    io.to(room).emit('winner', winner);

    // Reset choices and timeout
    playerChoices[room] = {};
    delete choiceTimeouts[room];
} 

server.listen(port, () => {
    console.log('Listening on *: ', port);
});
