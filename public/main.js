const socket = io("https://minisecret-production.up.railway.app");
let currentRoom = '';
function createRoom() {

    const roomInput = document.getElementById('roomInput');

    const roomName = roomInput.value.trim();
    if (roomName) {
        socket.emit('createRoom', roomName);
        roomInput.value = '';
    }

    joinRoom(roomName);
}

function joinRoom(room){
    // const roomSelect = document.getElementById('roomSelect');
    // const room = roomSelect.value;
    if (room) {
        socket.emit('joinRoom', room);
        currentRoom = room;
        document.getElementById("joinRoomDiv").style.display = "none";
        document.getElementById("createRoomDiv").style.display = "none";
        document.getElementById("available").style.display = "none";
        document.getElementById("leaveRoomDiv").style.display = "block";
        // const gameDiv = document.getElementById('gameDiv');
        // gameDiv.style.display = 'block';
        // const roomNameDisplay = document.getElementById('roomNameDisplay');
        // roomNameDisplay.textContent = `Room: ${room}`;
        play(room);
    }
}

function leaveRoom(){
    socket.emit('leave');
    currentRoom = "";
    document.getElementById("joinRoomDiv").style.display = "flex";
    document.getElementById("createRoomDiv").style.display = "flex";
    document.getElementById("available").style.display = "block";
    document.getElementById("leaveRoomDiv").style.display = "none";
    document.getElementById("hand").style.display = "none";
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

async function play(room){
    let secretjs = await connect();

    await try_spin(99999, secretAddress, secretjs);
    let number = await query_spin(secretjs);
    socket.emit('sendNumber', number, room);

    socket.on('playerCards', (cards, playerId) => {
        if (socket.id === playerId) {
            console.log(cards);
            displayCards(cards);
        }
    });
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
            img.src = "../images/rock.png"
            type.innerText = "ROCK";
        } else if (player_cards[i] === "PAPER"){
            img.src = "../images/paper.png"
            type.innerText = "PAPER";
        }else {
            img.src = "../images/scissors.png"
            type.innerText = "SCISSORS";
        }

        card.appendChild(img);
        card.appendChild(type);

        hand_place.appendChild(card);

    }

}
