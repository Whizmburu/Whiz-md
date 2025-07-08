// Setreactions command
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const settingsFilePath = path.join(__dirname, '../../utils/botSettings.json');

function loadSettings() {
    try {
        if (fs.existsSync(settingsFilePath)) {
            const rawData = fs.readFileSync(settingsFilePath);
            return JSON.parse(rawData);
        }
    } catch (error) {
        console.error("Error loading bot settings for setreactions:", error);
    }
    return {
        autoViewEnabled: false,
        autoReactEnabled: false,
        reactions: config.autoReactEmojis || ["🔥", "❤️", "😂"]
    };
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error("Error saving bot settings for setreactions:", error);
    }
}

module.exports = {
    name: 'setreactions',
    description: 'Sets the emojis used for automatic status reactions. (Owner only)',
    ownerOnly: true,
    aliases: ['setreact', 'emojis'],
    usage: '<emoji1> [emoji2] ... OR "reset" to default',
    execute(client, message, args) {
        if (args.length === 0) {
            const currentSettings = loadSettings();
            return message.reply(`Please provide emojis to set for auto-reactions.\nCurrent reactions: ${currentSettings.reactions.join(', ')}\nExample: \`${config.prefix}setreactions ❤️ 😂 👍 🔥\` or \`${config.prefix}setreactions reset\``);
        }

        const settings = loadSettings();

        if (args.length === 1 && args[0].toLowerCase() === 'reset') {
            settings.reactions = config.autoReactEmojis || ["🔥", "💥", "🕳", "👾", "🤣", "👎"];
            saveSettings(settings);
            message.reply(`🔄 Auto-reaction emojis reset to default: ${settings.reactions.join(', ')}`);
            console.log("Auto-reactions reset to default by owner.");
            return;
        }

        // Basic emoji validation (checks if it's likely an emoji)
        // This is a very simple check and might not cover all Unicode emojis perfectly.
        const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{200D}]/gu;
        const newReactions = args.filter(arg => emojiRegex.test(arg));

        if (newReactions.length === 0) {
            return message.reply('No valid emojis provided. Please provide one or more emojis.');
        }

        // Limit number of reactions if desired, e.g. to 5
        if (newReactions.length > 10) {
            message.reply("You can set a maximum of 10 emojis for auto-reaction. Using the first 10 provided.");
            newReactions = newReactions.slice(0,10);
        }


        settings.reactions = newReactions;
        saveSettings(settings);

        message.reply(`✅ Auto-reaction emojis updated to: ${settings.reactions.join(', ')}`);
        console.log(`Auto-reactions set to: ${settings.reactions.join(', ')} by owner.`);
    },
};
