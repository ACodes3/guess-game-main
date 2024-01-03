# Guess-a-Word Game Server and Client Applications

This is a simple application for a "Guess a Word" game using the net module. The server allows clients to connect, authenticate with a password, and engage in matches where one player sets a word for the opponent to guess.

#Getting Started
Ensure you have Node.js (LTS -20.10.0)  installed on your machine.
Clone the repository.
Open a terminal and navigate to the project directory.
Install the dependencies using npm install.
Install ts-node using npm i ts-node.
Run the server with ts-node server.ts.
Run the client with ts-node client.ts (2x >) - to play, because it is a multiplayer game.

# Server Overview
The server is designed to handle multiple clients concurrently through TCP connections and potentially UNIX Socket. Clients must authenticate by providing the correct password (password123). Upon successful authentication, clients are assigned a unique ID and can initiate or accept match requests.

# Server Features
Authentication: Clients must provide the correct password to connect to the server.

Matchmaking: Clients can request a list of available opponents (getOpponentsList) and initiate matches (requestMatch) with specific opponents.
(requestMatch <OpponentID>)

Match Confirmation: Clients can confirm a match (confirmMatch) to start the guessing game.
(confirmMatch <ClientID/OpponendID>) - depending on how you identify in this game.

Word Guessing: Clients can make guesses (guess) and receive feedback on the correctness of their guesses.
(guess <word>)

Give Up: Clients can choose to give up (giveUp) during a match, revealing the correct word.
(giveUp)

Hint System: Clients can request hints (hint) from opponents and respond with hint information (giveHint).
(hint <requestingClientId>)
(giveHint <opponentID> <hint>)

# Commands
Authentication: Clients must enter the correct password (password123) to proceed.

Matchmaking:

getOpponentsList: Get a list of available opponents.
requestMatch <opponentId> <wordToGuess>: Initiate a match request with a specific opponent.
Match Confirmation:

confirmMatch <opponentId>: Confirm a match with the specified opponent.
Word Guessing:

guess <guessedWord>: Make a guess during a match.

Give Up:
giveUp: Give up on the current match.

Hint System:

hint <opponentId>: Request a hint from the specified opponent.
giveHint <requestingClientId> <hintResponseWords>: Respond to a hint request.
Example Usage
Connect to the server using a TCP client.
Enter the correct password (password123) to authenticate.
Use the provided commands to interact with the server and other clients.
Important Notes
Clients are identified by a unique ID assigned upon successful authentication.

The server supports concurrent connections and manages state for each connected client.

Ensure to handle disconnections gracefully, as the server removes disconnected clients from its internal state.

# Description:
The Guess-a-Word Game Client is a TypeScript application that connects to the Guess-a-Word Game Server over either a Unix socket or a TCP port. It supports the custom binary protocol for communication.

# Must have (REQUIREMENTS):
- TypeScript v5.3.3.
- Node LTS (20.10.0)
