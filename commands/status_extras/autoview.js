// Autoview command
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
        console.error("Error loading bot settings for autoview:", error);
    }
    return { autoViewEnabled: false, autoReactEnabled: false, reactions: config.autoReactEmojis || [] };
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error("Error saving bot settings for autoview:", error);
    }
}

module.exports = {
    name: 'autoview',
    description: 'Toggles automatic viewing of statuses. (Owner only)',
    ownerOnly: true,
    aliases: ['av'],
    usage: '<on|off>',
    execute(client, message, args) {
        const settings = loadSettings();
        const choice = args[0] ? args[0].toLowerCase() : null;

        if (!choice) {
            return message.reply(`Automatic status viewing is currently ${settings.autoViewEnabled ? 'ON' : 'OFF'}.\nUse \`${config.prefix}autoview on\` or \`${config.prefix}autoview off\`.`);
        }

        if (choice === 'on') {
            settings.autoViewEnabled = true;
            saveSettings(settings);
            message.reply('👁️ Automatic status viewing has been ENABLED.');
            console.log("Auto-view enabled by owner.");
        } else if (choice === 'off') {
            settings.autoViewEnabled = false;
            saveSettings(settings);
            message.reply('👁️ Automatic status viewing has been DISABLED.');
            console.log("Auto-view disabled by owner.");
        } else {
            message.reply(`Invalid option. Use \`${config.prefix}autoview on\` or \`${config.prefix}autoview off\`.`);
        }
    },
    // Functions to be used by the main bot event listener
    isAutoViewEnabled: () => loadSettings().autoViewEnabled,
};
