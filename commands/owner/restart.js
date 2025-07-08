// Command: .restart

async function handleRestartCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check is done in index.js

    try {
        await msg.reply(theme.messages.ownerCmd.restart.confirm);
        console.log("Bot restart initiated by owner. Exiting with code 1 for process manager to handle.");

        // Allow a brief moment for the message to send
        setTimeout(() => {
            process.exit(1); // Non-zero exit code, often used to signal restart to PMs like PM2
        }, 1000);

    } catch (error) {
        console.error("Error during .restart command:", error);
        await msg.reply(theme.messages.ownerCmd.restart.error + ` (Error: ${error.message})`).catch(e => console.error("Failed to send restart error msg:", e));
        setTimeout(() => {
            process.exit(1); // Still exit with 1 to attempt restart even if reply fails
        }, 500);
    }
}

module.exports = {
    handleRestartCommand
};
