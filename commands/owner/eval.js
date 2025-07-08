// Command: .eval <code>
// WARNING: EXTREMELY DANGEROUS COMMAND. EXECUTES ARBITRARY JAVASCRIPT CODE.
// SHOULD ONLY BE ACCESSIBLE BY THE BOT OWNER AND USED WITH EXTREME CAUTION.

const util = require('util'); // For util.inspect to pretty-print objects

async function handleEvalCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper) {
    // Owner check MUST be strictly enforced in index.js before this handler is called.

    const codeToExecute = args.join(' ');
    if (!codeToExecute) {
        await msg.reply(theme.messages.ownerCmd.eval.noCode);
        return;
    }

    let evalResponsePrefix = theme.messages.ownerCmd.eval.resultPrefix;
    let evalResultText = "";

    try {
        // Variables available in eval context:
        // msg, args, client, theme, botPrefix, activeGames, isOwnerHelper (and any other params of this function)
        // Also, any variables defined within this try block before eval is called.
        // For more complex scenarios, might pass a context object to eval.

        // To make `this` inside eval refer to something useful, or provide specific context:
        // const evalContext = { msg, client, args, theme, activeGames, /* etc */ };
        // const result = function() { return eval(codeToExecute); }.call(evalContext);
        // For simplicity, direct eval:

        const result = eval(codeToExecute);

        // Stringify the result carefully
        if (typeof result === 'object' || typeof result === 'function') {
            evalResultText = util.inspect(result, { depth: 1, colors: false }); // depth 1 to avoid huge objects
        } else if (typeof result === 'undefined') {
            evalResultText = 'undefined';
        }
        else {
            evalResultText = result.toString();
        }

    } catch (error) {
        console.error("Error during .eval execution:", error);
        evalResponsePrefix = theme.messages.ownerCmd.eval.errorPrefix;
        evalResultText = error.stack || error.toString(); // Get stack trace if available
    }

    // Truncate if too long to avoid WhatsApp message limits / spam
    const MAX_EVAL_RESPONSE_LENGTH = 3000; // Slightly less than WA limit for safety
    if (evalResultText.length > MAX_EVAL_RESPONSE_LENGTH) {
        evalResultText = evalResultText.substring(0, MAX_EVAL_RESPONSE_LENGTH) + "\n... (output truncated)";
    }

    try {
        await msg.reply(`${evalResponsePrefix}\n\`\`\`\n${evalResultText}\n\`\`\``);
    } catch (replyError) {
        console.error("Failed to send eval result:", replyError);
        // If reply fails, maybe try sending to owner's direct chat if possible and not already there
    }
}

module.exports = {
    handleEvalCommand
};
