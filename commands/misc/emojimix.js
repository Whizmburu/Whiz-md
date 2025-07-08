const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

// Helper to convert emoji to its Unicode string representation (e.g., 😂 -> 1f602)
function emojiToUnicode(emoji) {
    if (!emoji || emoji.length === 0) return '';
    // For simple emojis, this might work. Complex emojis (with skin tones, ZWJ sequences) are harder.
    // A more robust library would be needed for full Unicode coverage.
    // This basic version handles many common single emojis.
    try {
        let code = emoji.codePointAt(0).toString(16);
        // Check for variation selectors like FE0F (often invisible)
        if (emoji.length > 1 && emoji.codePointAt(1) === 0xFE0F) {
            // Keep only the base emoji code
        } else if (emoji.length > 1 && emoji.codePointAt(1) !== undefined && emoji.codePointAt(0) < 0xFFFF) {
            // This might be a sequence like flags or multi-person emojis, which are harder to map directly
            // For simplicity, let's try to handle simple cases first.
            // For complex ones, this approach will likely fail.
            // A full solution needs a proper emoji component parser.
        }
         // For many newer emojis, they are composed of multiple unicode characters.
        // This basic function will only get the first part.
        // Example: 🧑‍💻 (man technologist) is U+1F9D1 U+200D U+1F4BB
        // This will only return 1f9d1.
        // The Gstatic URL usually needs the combined form or specific codes.

        // Let's try a simpler approach for common emojis by just taking the first codepoint
        // and hoping gstatic handles it or we find a better API.
        // The ideal gstatic URL format is like: u{hex1}_u{hex2}
        // For "😂" (U+1F602), it's "u1f602".

        // A more direct way for gstatic:
        let components = [];
        for (let i = 0; i < emoji.length; ) {
            const codePoint = emoji.codePointAt(i);
            components.push(`u${codePoint.toString(16)}`);
            i += String.fromCodePoint(codePoint).length; // Move to the next character
        }
        // For single emojis, this is fine. For ZWJ sequences, gstatic might need them joined with _ or just the base ones.
        // This is highly experimental.
        return components.join('_'); // e.g. u1f9d1_u200d_u1f4bb - needs testing if gstatic uses this format
                                    // More likely, gstatic needs the individual base emoji unicodes.
                                    // For now, let's just use the first code point for simplicity and see.
                                    // This is often how simple emoji pickers work before combination.
    } catch (e) {
        console.error("Error converting emoji to unicode:", e);
        return null;
    }
}


async function handleEmojimixCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();

    if (args.length < 2) {
        await msg.reply(theme.messages.emojimixCmd.usage.replace('{prefix}', botPrefix));
        return;
    }

    const emoji1 = args[0];
    const emoji2 = args[1];

    // Basic validation: check if they look like single characters (highly naive for emojis)
    // A proper emoji validation is complex.
    if (emoji1.length > 4 || emoji2.length > 4) { // Allow for some ZWJ sequences or multi-byte chars
        await msg.reply(theme.messages.emojimixCmd.usage.replace('{prefix}', botPrefix) + " (Please provide valid single emojis)");
        return;
    }

    await chat.sendStateTyping();
    await msg.reply(theme.messages.emojimixCmd.mixing.replace('{emoji1}', emoji1).replace('{emoji2}', emoji2));

    // This date code is crucial and changes. 'auto' is sometimes supported by some wrappers but not directly by gstatic.
    // Found some common date codes by searching: 20201001, 20210515, 20220110, 20220815, 20230327 etc.
    // Let's try a relatively recent one or a common fallback.
    const dateCode = "20230327"; // This is a guess, might be outdated.
    // A more robust solution would be to use an API that handles these date codes.

    // Convert emojis to their primary Unicode representation for the URL
    // This is VERY tricky because Emoji Kitchen uses specific assets and not all combinations exist.
    // The URL format is like: u<hex>_u<hex>.png where <hex> is the emoji's codepoint.
    // For example: 😂 (U+1F602) -> u1f602

    let e1Unicode, e2Unicode;
    try {
        // We need just the hex codepoint string without "U+"
        e1Unicode = `u${emoji1.codePointAt(0).toString(16)}`;
        e2Unicode = `u${emoji2.codePointAt(0).toString(16)}`;
    } catch (e) {
        await msg.reply(theme.messages.emojimixCmd.apiError + " (Invalid emoji characters).");
        await chat.clearState();
        return;
    }


    // Try both combinations as order sometimes matters for available assets
    const urlsToTry = [
        `https://www.gstatic.com/android/keyboard/emojikitchen/${dateCode}/${e1Unicode}/${e1Unicode}_${e2Unicode}.png`,
        `https://www.gstatic.com/android/keyboard/emojikitchen/${dateCode}/${e2Unicode}/${e2Unicode}_${e1Unicode}.png`
    ];

    let foundImage = false;
    for (const url of urlsToTry) {
        try {
            // console.log("Trying emojimix URL:", url); // For debugging
            const imageResponse = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
            if (imageResponse.status === 200 && imageResponse.data.length > 100) { // Check for valid image data
                const imageBuffer = Buffer.from(imageResponse.data, 'binary');
                const mimeType = imageResponse.headers['content-type'] || 'image/png';
                const mixedEmojiMedia = new MessageMedia(mimeType, imageBuffer.toString('base64'), 'emojimix.png');
                await client.sendMessage(msg.from, mixedEmojiMedia, { sendMediaAsSticker: true, stickerName: `${emoji1}+${emoji2}`, stickerAuthor:theme.botName });
                foundImage = true;
                break; // Found one, exit loop
            }
        } catch (error) {
            // If one URL fails (e.g., 404), try the next one. Only log if it's not a 404.
            if (!error.response || error.response.status !== 404) {
                 console.warn(`Emojimix attempt failed for URL ${url}: ${error.message}`);
            }
        }
    }

    if (!foundImage) {
        const fallbackUrl = `https://emojikitchen.dev/?${encodeURIComponent(emoji1)}+${encodeURIComponent(emoji2)}`;
        await msg.reply(
            theme.messages.emojimixCmd.notFound.replace('{emoji1}', emoji1).replace('{emoji2}', emoji2) +
            `\nYou can try creating it here: ${fallbackUrl}`
        );
    }

    await chat.clearState();
}

module.exports = {
    handleEmojimixCommand
};
