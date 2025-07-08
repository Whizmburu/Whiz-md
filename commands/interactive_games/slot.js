// .slot command (Simple text-based slot machine)
const config = require('../../config');

module.exports = {
    name: 'slot',
    description: 'Plays a simple slot machine game.',
    category: 'interactive_games',
    aliases: ['slots', 'slotmachine'],
    execute(client, message, args) {
        const emojis = ["🍒", "🍊", "🍇", "🍉", "🍓", "🍋", "🔔", "💎", "7️⃣"];
        // More 7s or specific items can be rarer by adding fewer to the pool or weighting them.
        const reel1 = emojis[Math.floor(Math.random() * emojis.length)];
        const reel2 = emojis[Math.floor(Math.random() * emojis.length)];
        const reel3 = emojis[Math.floor(Math.random() * emojis.length)];

        let resultMessage = `🎰 *Slot Machine Result* 🎰\n\n[ ${reel1} | ${reel2} | ${reel3} ]\n\n`;

        if (reel1 === reel2 && reel2 === reel3) {
            if (reel1 === "7️⃣") {
                resultMessage += "🎉🎉🎉 JACKPOT!!! Triple Sevens! You're a legend! 🎉🎉🎉";
            } else if (reel1 === "💎") {
                resultMessage += "💎💎💎 MEGA WIN! Triple Diamonds! Shiny! 💎💎💎";
            }
            else {
                resultMessage += `🎊🎊🎊 BIG WIN! Triple ${reel1}! Congratulations! 🎊🎊🎊`;
            }
        } else if (reel1 === reel2 || reel1 === reel3 || reel2 === reel3) {
            let matchedEmoji = "";
            if (reel1 === reel2) matchedEmoji = reel1;
            else if (reel1 === reel3) matchedEmoji = reel1;
            else matchedEmoji = reel2;

            if (matchedEmoji === "7️⃣")  resultMessage += `✨ Small Win! Double Sevens! Lucky! ✨`;
            else resultMessage += `🎈 Small Win! Double ${matchedEmoji}! Nice try! 🎈`;

        } else {
            resultMessage += "💔 No win this time. Better luck next spin! 💔";
        }

        message.reply(resultMessage);
    },
};
