// commands/games/sudoku.js
const fs = require('fs');
const path = require('path');

let puzzles = {};
try {
    const puzzlesPath = path.join(__dirname, '../../resources/gamedata/sudoku_puzzles.json');
    puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf8'));
} catch (err) {
    console.error("Failed to load Sudoku puzzles:", err);
    puzzles = { easy: [], medium: [] }; // Fallback
}

function getPuzzle(difficulty = 'easy') {
    const difficultyKey = difficulty.toLowerCase();
    const availablePuzzles = puzzles[difficultyKey];
    if (!availablePuzzles || availablePuzzles.length === 0) {
        // Try 'easy' if requested difficulty not found or empty
        if (difficultyKey !== 'easy' && puzzles.easy && puzzles.easy.length > 0) {
            console.warn(`Sudoku puzzles for difficulty '${difficultyKey}' not found or empty. Falling back to 'easy'.`);
            return JSON.parse(JSON.stringify(puzzles.easy[Math.floor(Math.random() * puzzles.easy.length)]));
        }
        return null; // No puzzles for this difficulty, and fallback also failed
    }
    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    return JSON.parse(JSON.stringify(availablePuzzles[randomIndex]));
}

function displaySudokuBoard(board, themeSudokuConfig) {
    // Use themeSudokuConfig directly, which is theme.sudoku passed from handler
    let boardStr = (themeSudokuConfig.boardHeader || "```\n--- SUDOKU ---") + "\n";
    const hLine = themeSudokuConfig.horizontalLine || "+-------+-------+-------+";
    const vSep = themeSudokuConfig.verticalSeparator || "|";
    const emptyCell = themeSudokuConfig.emptyCell || '.';

    for (let r = 0; r < 9; r++) {
        if (r % 3 === 0) {
            boardStr += hLine + "\n";
        }
        let rowStr = "";
        for (let c = 0; c < 9; c++) {
            if (c % 3 === 0) {
                rowStr += `${vSep} `;
            }
            rowStr += (board[r][c] === 0 ? emptyCell : board[r][c]) + " ";
        }
        boardStr += rowStr.trimRight() + ` ${vSep}\n`; // Trim trailing space before final separator
    }
    boardStr += hLine + "\n```";
    return boardStr;
}

async function handleSudokuCommand(msg, args, client, theme, prefix, activeGames) {
    const chatId = msg.from;
    const subCommand = args[0] ? args[0].toLowerCase() : 'start';
    const game = activeGames[chatId];
    const themeSudoku = theme.sudoku || {}; // Ensure theme.sudoku exists or use empty object

    if (subCommand === 'start') {
        if (game && game.gameType === 'sudoku' && !game.gameOver) {
            await msg.reply((themeSudoku.alreadyActive || "A Sudoku game is already active. Use `{prefix}sudoku stop` to end it first.").replace(/{prefix}/g, prefix) + `\n${displaySudokuBoard(game.userBoard, themeSudoku)}`);
            return;
        }
        const difficulty = args[1] || 'easy';
        const puzzleData = getPuzzle(difficulty);

        if (!puzzleData) {
            await msg.reply((themeSudoku.noPuzzlesForDifficulty || "Sorry, no Sudoku puzzles available for '{difficulty}' difficulty or fallback 'easy'.").replace('{difficulty}', difficulty));
            return;
        }

        activeGames[chatId] = {
            gameType: 'sudoku',
            originalPuzzle: JSON.parse(JSON.stringify(puzzleData.puzzle)),
            userBoard: JSON.parse(JSON.stringify(puzzleData.puzzle)),
            solution: puzzleData.solution,
            difficulty: difficulty,
            startTime: Date.now(),
            gameOver: false
        };
        await msg.reply(
            (themeSudoku.gameStarted || "Sudoku game started ({difficulty})!").replace('{difficulty}', difficulty) +
            `\n${displaySudokuBoard(activeGames[chatId].userBoard, themeSudoku)}` +
            (themeSudoku.instructions || "\nUse `{prefix}sudoku fill <row> <col> <num>` or `{prefix}sudoku f <r> <c> <n>` to play.").replace(/{prefix}/g, prefix)
        );
        return;
    }

    if (!game || game.gameType !== 'sudoku') {
        await msg.reply((themeSudoku.noGameActive || "No Sudoku game active. Use `{prefix}sudoku start`.").replace(/{prefix}/g, prefix));
        return;
    }

    if (game.gameOver) {
         await msg.reply((themeSudoku.gameOver || "The Sudoku game is over. Use `{prefix}sudoku start` to begin a new one.").replace(/{prefix}/g, prefix) + `\n${displaySudokuBoard(game.userBoard, themeSudoku)}`);
        return;
    }

    if (subCommand === 'stop' || subCommand === 'quit' || subCommand === 'end') {
        const finalBoard = displaySudokuBoard(game.userBoard, themeSudoku);
        delete activeGames[chatId];
        await msg.reply((themeSudoku.gameStopped || "Sudoku game stopped.") + `\nFinal board:\n${finalBoard}`);
        return;
    }

    if (subCommand === 'view' || subCommand === 'board') {
        await msg.reply(displaySudokuBoard(game.userBoard, themeSudoku) + (themeSudoku.instructions || "\nUse `{prefix}sudoku fill <row> <col> <num>` or `{prefix}sudoku f <r> <c> <n>` to play.").replace(/{prefix}/g, prefix));
        return;
    }

    if (subCommand === 'fill' || subCommand === 'f') {
        if (args.length < 4) {
            await msg.reply((themeSudoku.fillUsage || "Usage: `{prefix}sudoku fill <row> <col> <number>` (e.g., `{prefix}sudoku fill 1 1 5`)").replace(/{prefix}/g, prefix));
            return;
        }
        const r = parseInt(args[1]) - 1;
        const c = parseInt(args[2]) - 1;
        const num = parseInt(args[3]);

        if (isNaN(r) || isNaN(c) || isNaN(num) || r < 0 || r > 8 || c < 0 || c > 8 || num < 0 || num > 9) { // Allow 0 to clear
            await msg.reply(themeSudoku.invalidFillArgs || "Invalid row, column, or number. Row/Col from 1-9, Number from 0-9 (0 to clear).");
            return;
        }

        if (game.originalPuzzle[r][c] !== 0 && num !== game.originalPuzzle[r][c]) { // Allow "filling" clue with its own number
            await msg.reply(themeSudoku.cannotChangeClue || "You cannot change the original puzzle numbers (clues).");
            return;
        }
        if (game.originalPuzzle[r][c] !== 0 && num === 0) {
             await msg.reply(themeSudoku.cannotClearClue || "You cannot clear an original puzzle number (clue).");
            return;
        }


        game.userBoard[r][c] = num;
        await msg.reply(
            (num === 0 ? themeSudoku.cellCleared : themeSudoku.cellFilled || "Cell ({row},{col}) set to {num}.").replace('{row}', r+1).replace('{col}', c+1).replace('{num}', num) +
            `\n${displaySudokuBoard(game.userBoard, themeSudoku)}`
        );

        let allFilled = true;
        for(let i=0; i<9; i++) {
            for(let j=0; j<9; j++) {
                if(game.userBoard[i][j] === 0) {
                    allFilled = false;
                    break;
                }
            }
            if(!allFilled) break;
        }

        if (allFilled) {
            let solved = true;
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (game.userBoard[i][j] !== game.solution[i][j]) {
                        solved = false;
                        break;
                    }
                }
                if (!solved) break;
            }
            if (solved) {
                game.gameOver = true;
                const timeTaken = Math.floor((Date.now() - game.startTime) / 1000);
                await msg.reply(
                    (themeSudoku.puzzleSolved || "🎉 Congratulations! You solved the Sudoku puzzle in {time} seconds!").replace('{time}', timeTaken) +
                    `\n${displaySudokuBoard(game.userBoard, themeSudoku)}`
                );
                delete activeGames[chatId];
            } else {
                 await msg.reply(themeSudoku.boardFullNotSolved || "🤔 The board is full, but it's not the correct solution. Use `{prefix}sudoku check` to see incorrect cells or `{prefix}sudoku fill <r> <c> 0` to clear a cell.".replace(/{prefix}/g, prefix));
            }
        }
        return;
    }

    if (subCommand === 'check') {
        let correctCount = 0;
        let incorrectCount = 0;
        let emptyClues = 0;
        let filledCount = 0;

        for (let r_idx = 0; r_idx < 9; r_idx++) {
            for (let c_idx = 0; c_idx < 9; c_idx++) {
                if (game.originalPuzzle[r_idx][c_idx] === 0) { // Only check user-fillable cells
                    if (game.userBoard[r_idx][c_idx] !== 0) {
                        filledCount++;
                        if (game.userBoard[r_idx][c_idx] === game.solution[r_idx][c_idx]) {
                            correctCount++;
                        } else {
                            incorrectCount++;
                        }
                    } else {
                        emptyClues++;
                    }
                }
            }
        }
        let replyMsg = (themeSudoku.checkResultHeader || "🔍 Sudoku Check:") +
                       (themeSudoku.checkResultStats || "\nCells to fill: {totalFillable}\nFilled by you: {filledCount}\nCorrect: {correctCount}\nIncorrect: {incorrectCount}\nRemaining to fill: {emptyClues}")
                           .replace('{totalFillable}', filledCount + emptyClues)
                           .replace('{filledCount}', filledCount)
                           .replace('{correctCount}', correctCount)
                           .replace('{incorrectCount}', incorrectCount)
                           .replace('{emptyClues}', emptyClues);

        if (incorrectCount === 0 && emptyClues === 0 && filledCount > 0) {
             // This case is handled by the solve check in 'fill' command.
             // Here, if all filled ARE correct, but not all are filled yet:
             replyMsg += "\n" + (themeSudoku.checkAllCorrectSoFar || "👍 All your entries so far are correct!");
        } else if (incorrectCount > 0) {
            replyMsg += "\n" + (themeSudoku.checkSomeIncorrect || "🤔 Some entries are incorrect. Keep trying!");
        } else if (filledCount === 0) {
            replyMsg += "\n" + (themeSudoku.checkNotStarted || "✏️ You haven't filled any cells yet!");
        } else if (incorrectCount === 0 && emptyClues > 0) {
             replyMsg += "\n" + (themeSudoku.checkAllCorrectSoFarKeepGoing || "👍 All your entries so far are correct! Keep going!");
        }


        await msg.reply(replyMsg + `\n${displaySudokuBoard(game.userBoard, themeSudoku)}`);
        return;
    }

    await msg.reply((themeSudoku.unknownSubcommand || "❓ Unknown Sudoku command. Available: `start [difficulty]`, `fill <r> <c> <n>`, `f <r> <c> <n>`, `check`, `view`, `stop`.").replace(/{prefix}/g, prefix));
}

module.exports = { handleSudokuCommand };
