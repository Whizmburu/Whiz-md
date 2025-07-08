// Command: .autoview <on|off|status>

async function handleAutoviewCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper, statusAutomation) {
    // Owner check is done in index.js
    const action = args[0] ? args[0].toLowerCase() : 'status';

    if (action === 'on') {
        statusAutomation.autoViewEnabled = true;
        await msg.reply(theme.messages.autoViewCmd.enabled);
    } else if (action === 'off') {
        statusAutomation.autoViewEnabled = false;
        await msg.reply(theme.messages.autoViewCmd.disabled);
    } else if (action === 'status') {
        const currentStatus = statusAutomation.autoViewEnabled ? "ON" : "OFF";
        await msg.reply(theme.messages.autoViewCmd.status.replace('{statusState}', currentStatus));
    }
     else {
        await msg.reply(`Invalid action. Use: ${botPrefix}autoview <on|off|status>`);
    }
}

module.exports = {
    handleAutoviewCommand
};
