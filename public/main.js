// const socket = io("https://minisecret-production.up.railway.app");
const socket = io("https://minisecret-production.up.railway.app");
let players = []
let player = {playerId: '', room: '', gotCards: false}

/*
* 1 - create room (DO NOT make a user enter when created!) - OK
* 2 - join room - OK
* 3 - leave room - OK
* 4 - play card
* EVENTS
* 1 - player kicked by the room
* 2 - player left the room
* 3 - player enters the room
* 4 - game starts
* 5 - player chooses card
* 6 - game ends
*/

function createRoom(){
    let roomNameInput = document.getElementById("roomInput");
    let roomName = roomNameInput.value.trim();
    if (roomName) {
        socket.emit("roomCreated", roomName);
        roomNameInput.value = "";
    } else {
        alert("A room with this name already exists.");
    }
}

function joinRoom(room){
    if (room) {
        socket.emit('joinRoom', room);
        let player = { playerId: socket.id, room: room, gotCards: false }; // Create a new player object
        players.push(player);
        document.getElementById("joinRoomDiv").style.display = "none";
        document.getElementById("createRoomDiv").style.display = "none";
        document.getElementById("available").style.display = "none";
        document.getElementById("leaveRoomDiv").style.display = "block";
        
        // Wait for 3 seconds before starting play
        setTimeout(() => {
            play(player, room); // Pass the player object to the play function
        }, 3000);
    }
}



socket.on('roomsList', (rooms) => {
    const roomSelect = document.getElementById('joinRoomDiv');
    roomSelect.innerHTML = '';
    rooms.forEach((room) => {
        const option = document.createElement('div');
        option.className = 'option_card';

        const img = document.createElement('img');
        img.src = '/images/roomlogo.png';
        option.appendChild(img);

        const text = document.createElement('p');
        text.textContent = room;
        option.appendChild(text);
        option.onclick = () => joinRoom(room)
        roomSelect.appendChild(option);
    });

});

socket.on('leaveRoom', (room) => {
    alert("The other player has disconnected.")
});


function leaveRoom(){
    socket.emit('leave', player.room);
    player.room = "";
    document.getElementById("joinRoomDiv").style.display = "flex";
    document.getElementById("createRoomDiv").style.display = "flex";
    document.getElementById("available").style.display = "block";
    document.getElementById("leaveRoomDiv").style.display = "none";
    document.getElementById("hand").style.display = "none";
}

async function play(player, room){
    try {
        let secretjs = await connect();
        await try_spin(99999, secretAddress, secretjs);
        let number = await query_spin(secretjs);

        console.log(player);

        socket.emit('sendNumber', number, room);

        socket.on('playerCards', (cards, playerId) => {
            console.log(player.gotCards); //for some reason, this is absolutely necessary.
            if (player.gotCards === false) {
                console.log(cards);
                displayCards(cards);
                player.playerId = socket.id
                player.room = room; // Ensure proper room assignment
                player.gotCards = true;
            } else {
                alert("You already left this room");
            }
        });

        console.log("game has begun");

        socket.on('revealChoices', (choices) => {
            console.log('Choices revealed: ', choices);
        });

        socket.on('winner', (winner) => {
            if (winner === socket.id){
                alert("You won this round");
            } else if (winner === "TIE") {
                alert("It was a TIE");
            } else {
                alert("You lost this round");
            }
            console.log("Winner is: ", winner);
        });
    } catch (error) {
        console.error("Error during play:", error);
    }
}

function displayCards(cards){
    document.getElementById("hand").style.display ="flex";
    let player_cards = cards.cards;

    for (let i = 0; i < player_cards.length; i++){
        let hand_place = document.getElementById("hand");
        let card = document.createElement("div");
        card.className = "hand_card";
        let type = document.createElement("p");
        let img = document.createElement("img");
        if (player_cards[i] === "ROCK"){
            img.src = "/images/rock.png"
            type.innerText = "ROCK";
        } else if (player_cards[i] === "PAPER"){
            img.src = "/images/paper.png"
            type.innerText = "PAPER";
        }else {
            img.src = "/images/scissors.png"
            type.innerText = "SCISSORS";
        }
        card.id = i.toString();
        card.appendChild(img);
        card.appendChild(type);
        card.onclick = () => chooseCard(player_cards[i], i);
        hand_place.appendChild(card);

    }

}

function chooseCard(card, i) {
    document.getElementById(i).style.display = "none";
    const currentPlayer = players.find(player => player.playerId === socket.id); // Find the current player
    const room = currentPlayer.room.trim(); // Get the room associated with the current player
    socket.emit('cardChosen', card, room);
}


function wait(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}


// let currentRoom = '';
// let got_cards = {playerId:'', room: '', gotCards:false};

// function createRoom() {
//
//     const roomInput = document.getElementById('roomInput');
//
//     const roomName = roomInput.value.trim();
//     if (roomName) {
//         socket.emit('createRoom', roomName);
//         roomInput.value = '';
//     }
//
//     joinRoom(roomName);
// }
//
// function joinRoom(room){
//     // const roomSelect = document.getElementById('roomSelect');
//     // const room = roomSelect.value;
//     if (room) {
//         socket.emit('joinRoom', room);
//         currentRoom = room;
//         document.getElementById("joinRoomDiv").style.display = "none";
//         document.getElementById("createRoomDiv").style.display = "none";
//         document.getElementById("available").style.display = "none";
//         document.getElementById("leaveRoomDiv").style.display = "block";
//
//         // const gameDiv = document.getElementById('gameDiv');
//         // gameDiv.style.display = 'block';
//         // const roomNameDisplay = document.getElementById('roomNameDisplay');
//         // roomNameDisplay.textContent = `Room: ${room}`;
//         play(room);
//     }
// }
//
// function leaveRoom(){
//     socket.emit('leave');
//     currentRoom = "";
//     document.getElementById("joinRoomDiv").style.display = "flex";
//     document.getElementById("createRoomDiv").style.display = "flex";
//     document.getElementById("available").style.display = "block";
//     document.getElementById("leaveRoomDiv").style.display = "none";
//     document.getElementById("hand").style.display = "none";
// }
//
// //DO NOT CALL leaveRoom()!!!!! leaveRoom ALREADY calls this!!!!
// // socket.on('playerLeft', (message) => {
// //     alert(message); // Display an alert to the player
// //     currentRoom = "";
// //     document.getElementById("joinRoomDiv").style.display = "flex";
// //     document.getElementById("createRoomDiv").style.display = "flex";
// //     document.getElementById("available").style.display = "block";
// //     document.getElementById("leaveRoomDiv").style.display = "none";
// //     document.getElementById("hand").style.display = "none";
// // });
//

//

