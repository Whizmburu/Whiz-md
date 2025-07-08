// Configuration for WHIZ-MD Bot
let currentBotVersion = "1.0.0"; // Default, will be updated by bot.js

module.exports = {
    prefix: ".",
    ownerNumber: process.env.OWNER_NUMBER || "254754783683", // Owner's WhatsApp number
    ownerName: process.env.OWNER_NAME || "WHIZ", // Owner's name for display
    botName: "WHIZ-MD",
    autoReactEmojis: ["🔥", "💥", "🕳", "👾", "🤣", "👎"], // Default auto-react emojis
    removeBgApiKey: process.env.REMOVE_BG_API_KEY || null, // API key for remove.bg

    // Getter and Setter for botVersion
    getBotVersion: () => currentBotVersion,
    setBotVersion: (version) => {
        if (version) currentBotVersion = version;
        // console.log(`[CONFIG] Bot version set to: ${currentBotVersion}`);
    },
    // Add other configurations as needed
};
