// Command: .autoreact <on|off|status>

async function handleAutoreactCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper, statusAutomation) {
    // Owner check is done in index.js
    const action = args[0] ? args[0].toLowerCase() : 'status';

    if (action === 'on') {
        statusAutomation.autoReactEnabled = true;
        await msg.reply(theme.messages.autoReactCmd.enabled);
    } else if (action === 'off') {
        statusAutomation.autoReactEnabled = false;
        await msg.reply(theme.messages.autoReactCmd.disabled);
    } else if (action === 'status') {
        const currentStatus = statusAutomation.autoReactEnabled ? "ON" : "OFF";
        let reply = theme.messages.autoReactCmd.status.replace('{statusState}', currentStatus);
        if(statusAutomation.autoReactEnabled && statusAutomation.autoReactionEmojis.length > 0) {
            reply += `\nCurrently reacting with: ${statusAutomation.autoReactionEmojis.join(', ')}`;
        } else if (statusAutomation.autoReactEnabled && statusAutomation.autoReactionEmojis.length === 0) {
            reply += `\nNote: Auto-react is ON, but no reaction emojis are set. Use ${botPrefix}setreactions to add some.`;
        }
        await msg.reply(reply);
    }
     else {
        await msg.reply(`Invalid action. Use: ${botPrefix}autoreact <on|off|status>`);
    }
}

module.exports = {
    handleAutoreactCommand
};
