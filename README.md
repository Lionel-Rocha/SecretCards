<div align="center">
  
![image](https://github.com/Lionel-Rocha/SecretCards/assets/111009073/d462b08c-356b-4fcc-88d9-be30dbf8617c)

</div>

# Secret Rock, Paper and Scissors Cards (or just SecretCards)

This is a rock, paper & scissors minigame, but with cards! And it relies on Secret's randomness (which is explained [here](https://docs.scrt.network/secret-network-documentation/development/development-concepts/randomness-api)) to sort the cards.

## Rock, paper & scissors to the next level

SecretCards is different than average rock, paper & scissors. It requires some strategy, because you can run out of rocks, papers or scissors or just be struck with bad luck and get a horrible set of cards, but is still fun! SecretCards allows you to play with someone in a room for five rounds. No bots, just you and somebody else. 

![image](https://github.com/Lionel-Rocha/SecretCards/assets/111009073/0b16abee-fdd8-42c3-aec8-a563cc857bce)

## How to play
First of all, check if you're at the testnet pulsar-3. If you're not, then connect your **KEPLR** wallet (which you can do using [this link](https://keplr-connect-pulsar3.vercel.app/)) and get some testnet funds. Then, you can play the game by following these steps:

1. Create or enter a room. *A room allows only two players!*
2. Wait for the transaction to be requested and allow it.
3. Wait for your cards to be shown. It may take a while.
4. Play!

## Target audience
Anybody who wants to play something different than a betting or NFT game at Secret. Or something different than plain, old rock, paper & scissors. 

## Video and live demo


Live demo is at https://secret-cards.up.railway.app/

Enjoy!
<div align="center">

https://github.com/Lionel-Rocha/SecretCards/assets/111009073/739555e0-65b5-4255-8f68-34c205dc4924

</div>

## Technical stuff

➥ Code is written in Node.js using Express, but I have used vanilla HTML + CSS + JS in the frontend. 

➥ Multiplayer rooms were made with Socket.io

➥ Secret.js was used to make the connection between wallet and application. I could make it work with vanilla JS using a workaround.

➥ I did not write a contract, just used the "raffle contract" at *secret1sszujacjmtfcm2yc37gvl57sy06qcs86wqrwp2*.

## Known issues

➥ The room may alert "You've already left this room" even when entering a room for the first time. Just refresh the page.

➥ If any other problem is spotted, please raise an issue!

## Image atributions
Icons: Mangsaabguru, Freepik
