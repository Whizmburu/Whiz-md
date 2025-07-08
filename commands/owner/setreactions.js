// Command: .setreactions <emoji1> [emoji2...] | .setreactions clear | .setreactions

async function handleSetreactionsCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper, statusAutomation) {
    // Owner check is done in index.js

    if (args.length === 0) {
        // Display current reactions
        const currentEmojis = statusAutomation.autoReactionEmojis.join(', ');
        await msg.reply(theme.messages.setReactionsCmd.current
            .replace('{emojis}', currentEmojis || "None set")
            .replace(/{prefix}/g, botPrefix) // Global replace for prefix
        );
        return;
    }

    const action = args[0].toLowerCase();

    if (action === 'clear') {
        statusAutomation.autoReactionEmojis = [];
        await msg.reply(theme.messages.setReactionsCmd.cleared);
    } else {
        // Basic emoji validation (very simple, just checks if it's not a long string)
        // A more robust validation would check if they are actual unicode emojis.
        const newEmojis = args.filter(arg => arg.length <= 4); // Simple filter for emoji-like strings

        if (newEmojis.length === 0 && args.length > 0) {
             await msg.reply("⚠️ Please provide valid emojis. Each emoji should be a single character or a short sequence.");
             return;
        }
        if (newEmojis.length === 0 && args.length === 0) { // Should be caught by first if, but defensive
             await msg.reply(theme.messages.setReactionsCmd.noEmojisProvided.replace('{prefix}', botPrefix));
             return;
        }


        statusAutomation.autoReactionEmojis = newEmojis;
        await msg.reply(theme.messages.setReactionsCmd.success.replace('{emojis}', newEmojis.join(', ')));
    }
}

module.exports = {
    handleSetreactionsCommand
};
