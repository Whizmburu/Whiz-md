// Slot Machine Game Logic

const REELS = 3; // Number of reels
const SYMBOLS = ["🍒", "🍋", "🍊", "🍉", "⭐", "🔔", "💎", "🍀", " BAR "]; // BAR should have spaces for alignment
// const SYMBOLS = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "🍍", "🥝"];


// Define payouts (example: higher payout for rarer symbols or specific combos)
// For simplicity, we'll just check for N of a kind.
// A more complex version could have a paytable.
function checkWin(spunReels) {
    // Check for 3 of a kind (or REELS number of a kind)
    if (spunReels.every(symbol => symbol === spunReels[0])) {
        if (spunReels[0] === "💎") return { messageKey: "win", prizeMultiplier: 100, type: "JACKPOT! Triple Diamonds!" }; // Jackpot
        if (spunReels[0] === "⭐") return { messageKey: "win", prizeMultiplier: 50, type: "Big Win! Triple Stars!" };
        if (spunReels[0] === " BAR ") return { messageKey: "win", prizeMultiplier: 40, type: "Sweet! Triple BARs!" };
        return { messageKey: "win", prizeMultiplier: 20, type: `Nice! Triple ${spunReels[0]}!` };
    }

    // Check for 2 of a kind (if REELS = 3)
    if (REELS === 3) {
        if (spunReels[0] === spunReels[1] || spunReels[1] === spunReels[2] || spunReels[0] === spunReels[2]) {
             // Identify the pair symbol
            let pairSymbol = spunReels[0] === spunReels[1] ? spunReels[0] : (spunReels[1] === spunReels[2] ? spunReels[1] : spunReels[0]);
            if (pairSymbol === "💎") return { messageKey: "near", prizeMultiplier: 5, type: `Close! Pair of Diamonds!` };
            if (pairSymbol === "⭐") return { messageKey: "near", prizeMultiplier: 3, type: `Almost! Pair of Stars!` };
            return { messageKey: "near", prizeMultiplier: 2, type: `So close! Pair of ${pairSymbol}!` };
        }
    }

    // Check for any single "special" symbol like 💎 or ⭐ for a small win (optional)
    if (spunReels.includes("💎")) return { messageKey: "near", prizeMultiplier: 1, type: "A Diamond! ✨" };


    return { messageKey: "lose", prizeMultiplier: 0, type: "No win this time." };
}

async function handleSlotCommand(msg, args, client, theme, botPrefix, activeGames) {
    const chat = await msg.getChat();
    try {
        await chat.sendStateTyping();
        await msg.reply(theme.messages.slotMachine.spinning);

        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // Simulate spin time

        const spunReels = [];
        for (let i = 0; i < REELS; i++) {
            spunReels.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        }

        const result = checkWin(spunReels);
        const reelsDisplay = spunReels.join(" | "); // e.g., 🍒 | 🍋 | 💎

        let finalMessage = theme.messages.slotMachine.result
            .replace('{reels}', reelsDisplay)
            .replace('{message}', theme.messages.slotMachine[result.messageKey] || result.type); // Use themed message for win/lose/near

        // If you want to show a "prize" for fun:
        // if (result.prizeMultiplier > 0) {
        //     finalMessage += `\n(Debug: Prize Multiplier x${result.prizeMultiplier})`;
        // }

        await msg.reply(finalMessage);
        await chat.clearState();

    } catch (error) {
        console.error("Error in .slot command:", error);
        await msg.reply("🎰 Oops! The slot machine seems to be jammed. Please try again later.");
        await chat.clearState();
    }
}

module.exports = {
    handleSlotCommand
};
