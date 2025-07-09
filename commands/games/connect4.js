// commands/games/connect4.js
const ROWS = 6;
const COLS = 7;
const EMPTY_SLOT = '⚪'; // Using white circle for empty
const PLAYER_1_TOKEN = '🔴'; // Red circle
const PLAYER_2_TOKEN = '🟡'; // Yellow circle (Bot or second player)

// Helper function to create an empty board
function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_SLOT));
}

// Helper function to display the board
// Adds column numbers at the bottom for easier play
function displayBoard(board) {
    let boardStr = board.map(row => row.join('')).join('\n');
    boardStr += '\n';
    for (let i = 1; i <= COLS; i++) {
        boardStr += `${i}⃣ `; // Number emoji
    }
    return boardStr.trim();
}

// Helper function to make a move
// Returns true if move is valid, false otherwise
function makeMove(board, col, playerToken) {
    if (col < 0 || col >= COLS) return false; // Invalid column

    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY_SLOT) {
            board[r][col] = playerToken;
            return true;
        }
    }
    return false; // Column is full
}

// Helper function to check for a win
function checkWin(board, playerToken) {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            if (board[r][c] === playerToken &&
                board[r][c+1] === playerToken &&
                board[r][c+2] === playerToken &&
                board[r][c+3] === playerToken) {
                return true;
            }
        }
    }

    // Check vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - 4; r++) {
            if (board[r][c] === playerToken &&
                board[r+1][c] === playerToken &&
                board[r+2][c] === playerToken &&
                board[r+3][c] === playerToken) {
                return true;
            }
        }
    }

    // Check positive diagonal (\)
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            if (board[r][c] === playerToken &&
                board[r+1][c+1] === playerToken &&
                board[r+2][c+2] === playerToken &&
                board[r+3][c+3] === playerToken) {
                return true;
            }
        }
    }

    // Check negative diagonal (/)
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            if (board[r][c] === playerToken &&
                board[r-1][c+1] === playerToken &&
                board[r-2][c+2] === playerToken &&
                board[r-3][c+3] === playerToken) {
                return true;
            }
        }
    }
    return false;
}

// Helper function to check for a draw
function checkDraw(board) {
    return board.every(row => row.every(cell => cell !== EMPTY_SLOT));
}

// Simple Bot AI
function botMove(board, botToken) {
    const playerToken = botToken === PLAYER_1_TOKEN ? PLAYER_2_TOKEN : PLAYER_1_TOKEN;

    // Priority 1: Find a winning move for bot
    for (let c = 0; c < COLS; c++) {
        const tempBoard = board.map(row => [...row]); // Create a copy
        if (board[0][c] === EMPTY_SLOT) { // Check if column is not full before trying move
            if (makeMove(tempBoard, c, botToken)) {
                if (checkWin(tempBoard, botToken)) {
                    return c; // Winning move
                }
            }
        }
    }

    // Priority 2: Block player's winning move
    for (let c = 0; c < COLS; c++) {
        const tempBoardForPlayer = board.map(row => [...row]);
         if (board[0][c] === EMPTY_SLOT) { // Check if column is not full
            if (makeMove(tempBoardForPlayer, c, playerToken)) { // Try player's move
                if (checkWin(tempBoardForPlayer, playerToken)) {
                    return c; // This is the column bot needs to play in to block
                }
            }
        }
    }

    // Priority 3: Play in the center column if available
    const centerCol = Math.floor(COLS / 2);
    if (board[0][centerCol] === EMPTY_SLOT) {
        return centerCol;
    }

    // Priority 4: Random valid column
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === EMPTY_SLOT) { // Check if top of column is empty
            validCols.push(c);
        }
    }
    if (validCols.length > 0) {
        return validCols[Math.floor(Math.random() * validCols.length)];
    }
    return -1; // Should not happen if draw is checked first
}


async function handleConnect4Command(msg, args, client, theme, prefix, activeGames, isOwner) { // Added isOwner for potential admin stop
    const chatId = msg.from;
    const senderId = msg.author || msg.from;
    let game = activeGames[chatId];

    const commandArg = args[0] ? args[0].toLowerCase() : null;
    const mentionedUser = msg.mentionedIds.length > 0 ? msg.mentionedIds[0] : null;

    // Get theme messages safely
    const themeConnect4 = theme.connect4 || {};
    const botName = theme.botName || "WHIZ-MD Bot";


    if (!game && (commandArg === null || commandArg === 'start' || mentionedUser)) {
        if (activeGames[chatId] && activeGames[chatId].gameType === 'connect4') {
             await msg.reply(themeConnect4.alreadyInGame || "A Connect4 game is already in progress in this chat.");
             return;
        }
        const player1 = senderId;
        let player2 = null;
        let vsBot = true;

        if (mentionedUser) {
            player2 = mentionedUser;
            if (player1 === player2) {
                await msg.reply(themeConnect4.cannotPlaySelf || "You can't play Connect4 against yourself!");
                return;
            }
            vsBot = false;
        } else {
            player2 = client.info.wid._serialized; // Bot is player 2
        }

        const player1Contact = await client.getContactById(player1);
        const player1Name = player1Contact.pushname || player1Contact.shortName || player1.split('@')[0];

        let player2Name;
        if (vsBot) {
            player2Name = botName;
        } else {
            const player2Contact = await client.getContactById(player2);
            player2Name = player2Contact.pushname || player2Contact.shortName || player2.split('@')[0];
        }

        activeGames[chatId] = {
            gameType: 'connect4',
            board: createEmptyBoard(),
            player1: { id: player1, token: PLAYER_1_TOKEN, name: player1Name },
            player2: { id: player2, token: PLAYER_2_TOKEN, name: player2Name },
            currentPlayer: player1, // Player 1 starts
            vsBot: vsBot,
            gameOver: false
        };
        game = activeGames[chatId];

        let startMsg = vsBot ?
            (themeConnect4.newGameVsBot || "🔴🟡 Starting Connect4 game against {botName}! {player1Name} ({player1Token}), you're up first.") :
            (themeConnect4.newGameVsPlayer || "🔴🟡 Starting Connect4 game! {player1Name} ({player1Token}) vs {player2Name} ({player2Token}). {player1Name}, you're up first.");

        startMsg = startMsg
            .replace('{player1Name}', game.player1.name)
            .replace('{player1Token}', game.player1.token)
            .replace('{player2Name}', game.player2.name)
            .replace('{player2Token}', game.player2.token)
            .replace('{botName}', botName); // For vsBot message

        await msg.reply(`${startMsg}\n\n${displayBoard(game.board)}\n\nUse \`${prefix}c4 <column_number (1-7)>\` to make a move or \`${prefix}c4 stop\` to end.`);
        return;
    }

    if (!game || game.gameType !== 'connect4') {
        await msg.reply((themeConnect4.noGame || `No Connect4 game in progress. Start one with \`${prefix}c4\` or \`${prefix}c4 @user\`.`).replace(/{prefix}/g, prefix));
        return;
    }

    if (commandArg === 'stop' || commandArg === 'quit' || commandArg === 'end') {
        if (senderId === game.player1.id || (!game.vsBot && senderId === game.player2.id) || (isOwner && isOwner(senderId))) {
            const boardStr = displayBoard(game.board); // Get current board state
            delete activeGames[chatId];
            await msg.reply((themeConnect4.gameStopped || "Connect4 game stopped.") + `\n\nFinal board:\n${boardStr}`);
        } else {
            await msg.reply(themeConnect4.cannotStop || "Only players in the game or the bot owner can stop it.");
        }
        return;
    }

    if (game.gameOver) { // Check if game is over before processing moves
        await msg.reply((themeConnect4.gameOver || "The game is over! Start a new one with `{prefix}c4`.")
            .replace(/{prefix}/g, prefix) + `\n\n${displayBoard(game.board)}`);
        return;
    }

    if (senderId !== game.currentPlayer) {
        const currentPlayersName = game.currentPlayer === game.player1.id ? game.player1.name : game.player2.name;
        await msg.reply((themeConnect4.notYourTurn || "⏳ It's not your turn! Waiting for {playerName}.")
            .replace('{playerName}', currentPlayersName));
        return;
    }

    const col = parseInt(commandArg) - 1; // User inputs 1-7, array is 0-6

    if (isNaN(col) || col < 0 || col >= COLS) {
        await msg.reply((themeConnect4.invalidColumn || "❌ Invalid column. Please enter a number between 1 and 7.") + `\n\n${displayBoard(game.board)}`);
        return;
    }

    const currentPlayerToken = game.currentPlayer === game.player1.id ? game.player1.token : game.player2.token;
    const currentPlayerName = game.currentPlayer === game.player1.id ? game.player1.name : game.player2.name;

    if (!makeMove(game.board, col, currentPlayerToken)) {
        await msg.reply((themeConnect4.columnFull || "🚫 That column is full! Try another one.") + `\n\n${displayBoard(game.board)}`);
        return;
    }

    // Check for win or draw
    if (checkWin(game.board, currentPlayerToken)) {
        game.gameOver = true;
        await msg.reply((themeConnect4.winMessage || "🎉 {playerName} ({playerToken}) wins! Congratulations!")
            .replace('{playerName}', currentPlayerName)
            .replace('{playerToken}', currentPlayerToken) + `\n\n${displayBoard(game.board)}`);
        delete activeGames[chatId]; // Clean up game
        return;
    }
    if (checkDraw(game.board)) {
        game.gameOver = true;
        await msg.reply((themeConnect4.drawMessage || "🤝 It's a draw! Well played both sides.") + `\n\n${displayBoard(game.board)}`);
        delete activeGames[chatId]; // Clean up game
        return;
    }

    // Switch player
    game.currentPlayer = game.currentPlayer === game.player1.id ? game.player2.id : game.player1.id;
    let nextPlayerName = game.currentPlayer === game.player1.id ? game.player1.name : game.player2.name;
    let nextPlayerToken = game.currentPlayer === game.player1.id ? game.player1.token : game.player2.token;

    await msg.reply((themeConnect4.nextTurn || "👍 Move accepted. It's {playerName}'s ({playerToken}) turn.")
        .replace('{playerName}', nextPlayerName)
        .replace('{playerToken}', nextPlayerToken)
        + `\n\n${displayBoard(game.board)}`);

    // Bot's turn if vsBot and it's now bot's turn
    if (game.vsBot && game.currentPlayer === game.player2.id && !game.gameOver) {
        const chat = await msg.getChat();
        await chat.sendStateTyping();
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // Simulate thinking

        const botCol = botMove(game.board, game.player2.token);
        if (botCol !== -1 && makeMove(game.board, botCol, game.player2.token)) { // Ensure bot move is also valid

            let botTurnMsg = (themeConnect4.botMove || "🤖 {botName} places a {botToken} in column {columnNumber}.")
                .replace('{botName}', game.player2.name)
                .replace('{botToken}', game.player2.token)
                .replace('{columnNumber}', botCol + 1);

            if (checkWin(game.board, game.player2.token)) {
                game.gameOver = true;
                botTurnMsg += "\n\n" + (themeConnect4.winMessage || "🎉 {playerName} ({playerToken}) wins! Congratulations!")
                    .replace('{playerName}', game.player2.name)
                    .replace('{playerToken}', game.player2.token);
                await msg.reply(`${botTurnMsg}\n\n${displayBoard(game.board)}`);
                delete activeGames[chatId];
                await chat.clearState();
                return;
            }
            if (checkDraw(game.board)) {
                game.gameOver = true;
                botTurnMsg += "\n\n" + (themeConnect4.drawMessage || "🤝 It's a draw! Well played both sides.");
                await msg.reply(`${botTurnMsg}\n\n${displayBoard(game.board)}`);
                delete activeGames[chatId];
                await chat.clearState();
                return;
            }
            // Switch back to player 1
            game.currentPlayer = game.player1.id;
            nextPlayerName = game.player1.name;
            nextPlayerToken = game.player1.token;
             botTurnMsg += "\n\n" + (themeConnect4.nextTurn || "👍 Move accepted. It's {playerName}'s ({playerToken}) turn.")
                .replace('{playerName}', nextPlayerName)
                .replace('{playerToken}', nextPlayerToken);
            await msg.reply(`${botTurnMsg}\n\n${displayBoard(game.board)}`);

        } else {
             // This case means bot couldn't find a valid move, which implies a draw if not caught earlier.
            if (!checkDraw(game.board)) { // If it's not a draw, then it's an unexpected bot error.
                 await msg.reply(themeConnect4.botError || "🤖 Bot is confused and cannot make a move. This shouldn't happen if the board isn't full!");
            } else { // Board is full, it's a draw
                 game.gameOver = true;
                 await msg.reply((themeConnect4.drawMessage || "🤝 It's a draw! Well played both sides.") + `\n\n${displayBoard(game.board)}`);
                 delete activeGames[chatId];
            }
        }
        await chat.clearState();
    }
}

module.exports = { handleConnect4Command, PLAYER_1_TOKEN, PLAYER_2_TOKEN, EMPTY_SLOT }; // Export tokens for TTT if needed, or remove if not.
