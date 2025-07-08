// Command: .shutdown

async function handleShutdownCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check is done in index.js

    try {
        await msg.reply(theme.messages.ownerCmd.shutdown.confirm);
        console.log("Bot shutdown initiated by owner.");

        // Allow a brief moment for the message to send before exiting
        setTimeout(() => {
            process.exit(0); // 0 indicates a clean exit
        }, 1000);

    } catch (error) {
        console.error("Error during .shutdown command:", error);
        // If message reply fails, still try to shutdown, but log it.
        // The process.exit might happen before this error reply is sent if the error is in msg.reply itself.
        await msg.reply(theme.messages.ownerCmd.shutdown.error + ` (Error: ${error.message})`).catch(e => console.error("Failed to send shutdown error msg:", e));
        setTimeout(() => {
            process.exit(1); // Exit with error code if reply failed
        }, 500);
    }
}

module.exports = {
    handleShutdownCommand
};
