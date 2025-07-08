// Autoreact command
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const settingsFilePath = path.join(__dirname, '../../utils/botSettings.json'); // Same settings file

function loadSettings() {
    try {
        if (fs.existsSync(settingsFilePath)) {
            const rawData = fs.readFileSync(settingsFilePath);
            return JSON.parse(rawData);
        }
    } catch (error) {
        console.error("Error loading bot settings for autoreact:", error);
    }
    // Default settings including those from autoview
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
        console.error("Error saving bot settings for autoreact:", error);
    }
}

module.exports = {
    name: 'autoreact',
    description: 'Toggles automatic reaction to statuses. (Owner only)',
    ownerOnly: true,
    aliases: ['ar'],
    usage: '<on|off>',
    execute(client, message, args) {
        const settings = loadSettings();
        const choice = args[0] ? args[0].toLowerCase() : null;

        if (!choice) {
            return message.reply(`Automatic status reacting is currently ${settings.autoReactEnabled ? 'ON' : 'OFF'}.\nUse \`${config.prefix}autoreact on\` or \`${config.prefix}autoreact off\`.`);
        }

        if (choice === 'on') {
            settings.autoReactEnabled = true;
            saveSettings(settings);
            message.reply(`💖 Automatic status reacting has been ENABLED. Current reactions: ${settings.reactions.join(', ')}`);
            console.log("Auto-react enabled by owner.");
        } else if (choice === 'off') {
            settings.autoReactEnabled = false;
            saveSettings(settings);
            message.reply('💔 Automatic status reacting has been DISABLED.');
            console.log("Auto-react disabled by owner.");
        } else {
            message.reply(`Invalid option. Use \`${config.prefix}autoreact on\` or \`${config.prefix}autoreact off\`.`);
        }
    },
    // Functions to be used by the main bot event listener
    isAutoReactEnabled: () => loadSettings().autoReactEnabled,
    getReactions: () => loadSettings().reactions,
};
