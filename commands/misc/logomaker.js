// Command: .logomaker <style> <text1> [| text2]
// Command: .logostyles

// This will use the generic generateTextEffect from index.js
// We just need to define the styles and their TextPro/Ephoto360 page URLs.

// This file might not be strictly necessary if we just add styles to the
// textEffectCommands map in index.js and handle .logostyles there too.
// However, creating it allows for potential future specific logic for logomaker if needed.

// For now, the main logic will reside in how these are called from index.js,
// utilizing the existing generateTextEffect function.

// We'll define the styles and their URLs in index.js and route .logomaker
// and .logostyles from there.

async function handleLogomakerCommand(msg, args, client, theme, botPrefix, activeGames, isOwnerHelper, statusAutomation, generateTextEffectHelper, availableLogoStyles) {
    const styleNameArg = args[0] ? args[0].toLowerCase() : null;
    const textParts = args.slice(1).join(' ').split('|').map(t => t.trim());
    const text1 = textParts[0];
    const text2 = textParts[1]; // Might be undefined

    if (!styleNameArg || !text1) {
        let usageMsg = theme.messages.logomakerCmd.usage.replace(/{prefix}/g, botPrefix);
        const styles = Object.keys(availableLogoStyles).join(', ');
        usageMsg += `\nAvailable styles: ${styles || 'None defined yet'}.`;
        await msg.reply(usageMsg);
        return;
    }

    const effectDetails = availableLogoStyles[styleNameArg];

    if (!effectDetails) {
        await msg.reply(theme.messages.logomakerCmd.styleNotFound
            .replace('{styleName}', styleNameArg)
            .replace('{prefix}', botPrefix)
        );
        return;
    }

    const chat = await msg.getChat();
    await chat.sendStateTyping();

    try {
        let generatingMsg = theme.messages.logomakerCmd.generating
            .replace('{styleName}', styleNameArg)
            .replace('{text}', text1 + (text2 ? ` | ${text2}` : ''));
        await msg.reply(generatingMsg);

        let textInputs = [text1];
        if (effectDetails.inputs === 2 && text2) {
            textInputs.push(text2);
        } else if (effectDetails.inputs === 2 && !text2) {
            // If effect needs 2 inputs but only 1 provided, use the first one for both
            textInputs.push(text1);
        }

        const media = await generateTextEffectHelper(effectDetails.url, textInputs, styleNameArg);
        // Corrected variable name from effectStyleName to styleNameArg for caption consistency
        // const safeCaptionText = (text1 + (text2 ? ` | ${text2}` : '')).replace(/[*_~`]/g, ''); // Old caption logic
        await client.sendMessage(msg.from, media, { caption: theme.signatures.generatedByBot });
        await chat.clearState();

    } catch (error) {
        console.error(`Error processing .logomaker command for style "${styleNameArg}":`, error);
        await msg.reply(theme.messages.logomakerCmd.apiError + (theme.signatures.textOnlyAppend || ""));
        await chat.clearState();
    }
}

async function handleLogostylesCommand(msg, args, client, theme, botPrefix, availableLogoStyles) {
    let stylesListString = Object.keys(availableLogoStyles).map(style => `➢ \`.logomaker ${style} <text>\``).join('\n');
    if (!stylesListString) {
        stylesListString = "No logo styles currently available.";
    }

    // Assuming a generic list theme message or create a specific one
    let listMessage = theme.messages.textStylesList || "✨ Available Logo Styles ✨\n\n{stylesList}\n\nUse `{prefix}logomaker [style_name] [your text]` to generate an image.";
    listMessage = listMessage
        .replace('{stylesList}', stylesListString)
        .replace(/{prefix}/g, botPrefix); // Ensure prefix is replaced if in theme

    await msg.reply(listMessage);
}


module.exports = {
    handleLogomakerCommand,
    handleLogostylesCommand
};
