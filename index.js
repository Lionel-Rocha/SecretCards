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
const roomLastActivity = {};
let sentCards = {};
let playerChoices = {}; // Track player choices per room
let choiceTimeouts = {};
const roomPlayersCount = {};

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
            roomLastActivity[roomName] = Date.now();
            sentCards[roomName] = {};
            playerChoices[roomName] = {};
            roomPlayersCount[roomName] = 0;
            io.emit('roomsList', rooms);
            console.log(`Room created: ${roomName}`);
        } else {
            console.log(`Room already exists: ${roomName}`);
        }
    });

    socket.on('joinRoom', async (room) => {
        if (rooms.includes(room)) {

            let size = await io.in(room).allSockets();
            console.log(size.size);

            if (size.size <= 2){
                socket.join(room);


                console.log(`${socket.id} joined room: ${room}`);
                io.to(room).emit('message', 'A new player joined the room.');

                // Update last activity time when user joins
                roomLastActivity[room] = Date.now();
            } else {
                console.log("I WON'T ALLOW IT!");
            }


        } else {
            console.log(`Attempted to join non-existent room: ${room}`);
        }
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

        });

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

        socket.on('leave', () => {
            // Emit a custom event to alert the remaining player
            // socket.emit('playerLeft', 'Someone left the game');
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



// Check room activity every minute
setInterval(checkRoomActivity, 60 * 1000);

server.listen(port, () => {
    console.log('Listening on *: ', port);
});
