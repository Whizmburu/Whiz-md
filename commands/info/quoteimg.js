const Jimp = require('jimp');
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

const BG_IMAGE_PATH = path.join(__dirname, '../../assets/images/quote_bg.png');
const DEFAULT_BG_COLOR = 0x333333FF; // Dark grey if no BG image
const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 600;
const TEXT_MARGIN = 50; // Margin from image edges for text

async function handleQuoteImgCommand(msg, args, client, theme, botPrefix) {
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    let quoteText = "";
    let authorText = "Unknown";

    if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        quoteText = quotedMsg.body;
        const quotedAuthorContact = await quotedMsg.getContact();
        authorText = quotedAuthorContact.pushname || quotedAuthorContact.name || "Anonymous";
    } else {
        const fullInput = args.join(' ');
        const parts = fullInput.split(/\s-\s|\s–\s/); // Split by " - " or " – " (em dash)
        quoteText = parts[0] ? parts[0].trim() : "";
        if (parts.length > 1) {
            authorText = parts.slice(1).join(' ').trim();
        }
    }

    if (!quoteText) {
        await msg.reply(theme.messages.quoteImgCmd.noText);
        await chat.clearState();
        return;
    }

    try {
        await msg.reply(theme.messages.quoteImgCmd.generating);

        let image;
        if (fs.existsSync(BG_IMAGE_PATH)) {
            try {
                image = await Jimp.read(BG_IMAGE_PATH);
                // Optionally resize background to standard dimensions if it's too large/small
                // image.cover(IMAGE_WIDTH, IMAGE_HEIGHT); // Or .contain()
            } catch (bgReadError) {
                console.warn("Failed to read quote_bg.png, using default color.", bgReadError);
                image = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT, DEFAULT_BG_COLOR);
            }
        } else {
            image = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT, DEFAULT_BG_COLOR);
        }

        // Ensure image is at least our target size for text rendering
        if (image.getWidth() < IMAGE_WIDTH || image.getHeight() < IMAGE_HEIGHT) {
            image.cover(IMAGE_WIDTH, IMAGE_HEIGHT); // Ensure minimum size by covering
        }


        // Load fonts (Jimp's built-in SANS fonts)
        // For better looking text, custom .fnt fonts would be needed.
        const quoteFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE); // Larger for quote
        const authorFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE); // Smaller for author

        // Text wrapping and placement logic
        const maxTextWidth = image.getWidth() - (TEXT_MARGIN * 2);

        // Quote text rendering
        image.print(
            quoteFont,
            TEXT_MARGIN,
            TEXT_MARGIN, // Start Y (will be adjusted by print's auto-wrap)
            {
                text: `"${quoteText}"`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE // This aligns the whole block
            },
            maxTextWidth,
            image.getHeight() - (TEXT_MARGIN * 2) - 50 // Max height for quote block, leave space for author
        );

        // Author text rendering (below the quote)
        // This is tricky to place perfectly without knowing height of printed quote.
        // A simpler approach for now: print author at bottom center.
        const authorString = `~ ${authorText}`;
        const authorTextWidth = Jimp.measureText(authorFont, authorString);
        image.print(
            authorFont,
            (image.getWidth() - authorTextWidth) / 2, // Centered X
            image.getHeight() - TEXT_MARGIN - 30, // Y position near bottom
            authorString,
            maxTextWidth // Max width for author string
        );

        const outputBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
        const quoteImageMedia = new MessageMedia('image/png', outputBuffer.toString('base64'), 'quote.png');

        await client.sendMessage(msg.from, quoteImageMedia, { caption: `💬 Quote by ${authorText}` });
        await chat.clearState();

    } catch (error) {
        console.error("Error in .quoteimg command:", error);
        await msg.reply(theme.messages.quoteImgCmd.error + ` (Details: ${error.message})`);
        await chat.clearState();
    }
}

module.exports = {
    handleQuoteImgCommand
};
