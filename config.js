// Configuration for WHIZ-MD Bot
module.exports = {
    prefix: ".",
    ownerNumber: process.env.OWNER_NUMBER || "254754783683", // Owner's WhatsApp number
    ownerName: process.env.OWNER_NAME || "WHIZ", // Owner's name for display
    botName: "WHIZ-MD",
    autoReactEmojis: ["🔥", "💥", "🕳", "👾", "🤣", "👎"], // Default auto-react emojis
    removeBgApiKey: process.env.REMOVE_BG_API_KEY || null, // API key for remove.bg
    // Add other configurations as needed
};
