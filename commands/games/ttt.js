// Tic-Tac-Toe Game Logic

const PLAYER_X = 'X';
const PLAYER_O = 'O';
const BOT_ID = 'BOT_WHIZ_MD'; // Unique ID for the bot as a player

function initializeBoard() {
    return Array(9).fill(null); // null for empty, 'X', or 'O'
}

function displayBoard(board, theme) {
    let boardStr = `${theme.messages.tttGame.boardTitle || "Tic-Tac-Toe Board:"}\n\`\`\`\n`;
    for (let i = 0; i < 9; i += 3) {
        boardStr += ` ${board[i] || (i + 1)} | ${board[i + 1] || (i + 2)} | ${board[i + 2] || (i + 3)} \n`;
        if (i < 6) boardStr += `---|---|---\n`;
    }
    boardStr += `\`\`\``;
    return boardStr;
}

function checkWin(board, playerSymbol) {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
    ];
    for (let condition of winConditions) {
        if (condition.every(index => board[index] === playerSymbol)) {
            return true;
        }
    }
    return false;
}

function isBoardFull(board) {
    return board.every(cell => cell !== null);
}

// Simple Bot AI
function botMove(board, botSymbol) {
    // 1. Try to win
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = botSymbol;
            if (checkWin(board, botSymbol)) {
                board[i] = null; // revert
                return i;
            }
            board[i] = null; // revert
        }
    }
    // 2. Try to block opponent
    const opponentSymbol = botSymbol === PLAYER_X ? PLAYER_O : PLAYER_X;
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = opponentSymbol;
            if (checkWin(board, opponentSymbol)) {
                board[i] = null; // revert
                return i; // Block here
            }
            board[i] = null; // revert
        }
    }
    // 3. Take center if available
    if (board[4] === null) return 4;
    // 4. Take a random available corner
    const corners = [0, 2, 6, 8].filter(i => board[i] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    // 5. Take any random available spot
    const availableSpots = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (availableSpots.length > 0) return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    return -1; // Should not happen if board is not full
}


async function handleTTTCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chatId = msg.from;
    const subCommand = args[0] ? args[0].toLowerCase() : 'board'; // Default to showing board if game active
    let game = activeGames[chatId];
    const senderId = msg.author || msg.from; // msg.author for groups, msg.from for private

    const chat = await msg.getChat();

    if (subCommand === 'start') {
        if (game && game.gameType === 'ttt' && !game.gameOver) {
            await msg.reply(theme.messages.gameCommand.alreadyPlaying
                .replace('{gameName}', 'Tic-Tac-Toe')
                .replace('{prefix}', botPrefix)
                .replace('{stopCommand}', 'ttt stop')
            );
            return;
        }

        await chat.sendStateTyping();
        const playerXId = senderId;
        let playerOId = BOT_ID;
        let playerXName = (await msg.getContact()).pushname || playerXId.split('@')[0];
        let playerOName = "WHIZ-MD Bot";

        let gameModeMessage = theme.messages.tttGame.vsBot;

        if (msg.mentionedIds.length > 0) {
            const opponentContact = await client.getContactById(msg.mentionedIds[0]);
            playerOId = msg.mentionedIds[0];
            playerOName = opponentContact.pushname || playerOId.split('@')[0];
            gameModeMessage = `${playerXName} (X) vs ${playerOName} (O).`;
        }

        activeGames[chatId] = {
            gameType: 'ttt',
            board: initializeBoard(),
            playerX: playerXId,
            playerO: playerOId,
            symbols: { [playerXId]: PLAYER_X, [playerOId]: PLAYER_O },
            names: { [playerXId]: playerXName, [playerOId]: playerOName },
            currentPlayer: playerXId, // Player X always starts
            gameOver: false
        };
        game = activeGames[chatId]; // refresh game variable

        let startMsg = theme.messages.tttGame.gameStarted
            .replace('{player1}', game.names[game.playerX])
            .replace('{player2}', game.names[game.playerO])
            .replace('{currentPlayer}', game.names[game.currentPlayer]);

        await msg.reply(`${startMsg}\n${gameModeMessage}\n${displayBoard(game.board, theme)}`);
        await chat.clearState();
        return;
    }

    if (!game || game.gameType !== 'ttt') {
        await msg.reply(theme.messages.gameCommand.notPlaying + ` Start a new game with \`${botPrefix}ttt start\`.`);
        return;
    }

    if (subCommand === 'stop') {
        delete activeGames[chatId];
        await msg.reply(theme.messages.gameCommand.stopped);
        return;
    }

    if (subCommand === 'board') {
        await msg.reply(displayBoard(game.board, theme));
        const currentPlayerName = game.names[game.currentPlayer];
        const currentSymbol = game.symbols[game.currentPlayer];
        if (!game.gameOver) {
             await msg.reply(theme.messages.tttGame.turn
                .replace('{player}', currentPlayerName)
                .replace('{symbol}', currentSymbol)
                .replace('{prefix}', botPrefix)
            );
        }
        return;
    }

    if (subCommand === 'move') {
        if (game.gameOver) {
            await msg.reply(theme.messages.gameCommand.gameOver + " Start a new game.");
            return;
        }
        if (senderId !== game.currentPlayer) {
            await msg.reply(theme.messages.tttGame.notYourTurn);
            return;
        }

        const cell = parseInt(args[1]);
        if (isNaN(cell) || cell < 1 || cell > 9 || game.board[cell - 1] !== null) {
            await msg.reply(theme.messages.tttGame.invalidCell);
            return;
        }

        await chat.sendStateTyping();
        game.board[cell - 1] = game.symbols[senderId];

        if (checkWin(game.board, game.symbols[senderId])) {
            game.gameOver = true;
            const winnerName = game.names[senderId];
            await msg.reply(`${displayBoard(game.board, theme)}\n${theme.messages.tttGame.playerWins.replace('{player}', winnerName).replace('{symbol}', game.symbols[senderId])}`);
            delete activeGames[chatId]; // Or keep for viewing, then delete on 'start'
        } else if (isBoardFull(game.board)) {
            game.gameOver = true;
            await msg.reply(`${displayBoard(game.board, theme)}\n${theme.messages.tttGame.draw}`);
            delete activeGames[chatId];
        } else {
            // Switch player
            game.currentPlayer = (senderId === game.playerX) ? game.playerO : game.playerX;

            await msg.reply(displayBoard(game.board, theme)); // Show board after player's move

            // If Bot's turn
            if (game.currentPlayer === BOT_ID && !game.gameOver) {
                await msg.reply(theme.messages.tttGame.turn
                    .replace('{player}', game.names[BOT_ID])
                    .replace('{symbol}', game.symbols[BOT_ID])
                    .replace('{prefix}', botPrefix)
                );
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate bot thinking

                const botCellIndex = botMove(game.board, game.symbols[BOT_ID]);
                if (botCellIndex !== -1) {
                    game.board[botCellIndex] = game.symbols[BOT_ID];
                    if (checkWin(game.board, game.symbols[BOT_ID])) {
                        game.gameOver = true;
                        await msg.reply(`${displayBoard(game.board, theme)}\n${theme.messages.tttGame.botWins}`);
                        delete activeGames[chatId];
                    } else if (isBoardFull(game.board)) {
                        game.gameOver = true;
                        await msg.reply(`${displayBoard(game.board, theme)}\n${theme.messages.tttGame.draw}`);
                        delete activeGames[chatId];
                    } else {
                        game.currentPlayer = senderId; // Switch back to human player
                         await msg.reply(displayBoard(game.board, theme)); // Show board after bot's move
                    }
                }
            }
            // Announce next player's turn if game not over
            if (!game.gameOver) {
                const nextPlayerName = game.names[game.currentPlayer];
                const nextSymbol = game.symbols[game.currentPlayer];
                await msg.reply(theme.messages.tttGame.turn
                    .replace('{player}', nextPlayerName)
                    .replace('{symbol}', nextSymbol)
                    .replace('{prefix}', botPrefix)
                );
            }
        }
        await chat.clearState();
        return;
    }

    // If no valid TTT subcommand
    await msg.reply(`Invalid .ttt command. Use \`${botPrefix}ttt start\`, \`${botPrefix}ttt move <1-9>\`, \`${botPrefix}ttt board\`, or \`${botPrefix}ttt stop\`.`);
}


module.exports = {
    handleTTTCommand
};
