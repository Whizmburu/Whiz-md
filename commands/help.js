// Help Command for WHIZ-MD Bot
const config = require('../config');
const { commands } = require('../utils/commandHandler'); // Assuming commandHandler exports the commands map

// Helper function to generate the full menu text
// Exported for use in bot.js for the welcome message
function getFullMenuTextInternal() {
    const commandList = require('../utils/commandHandler').commands; // Ensure this is the map
    const loadedCommandsCount = commandList.size; // This counts aliases too if not careful, need unique command count
    // To get unique commands, we can convert the map values to a Set and get its size.
    const uniqueCommands = new Set(commandList.values());
    const uniqueCommandsCount = uniqueCommands.size;


    // Define categories and their commands as per the new format
    const categories = [
        { name: "📁 MEDIA TOOLS", commands: ["Play", "Ytmp3", "Ytmp4", "Tiktok", "Instagram", "Facebook", "Spotify", "Soundcloud", "Joox", "Pinterest", "Shazam", "Lyrics"] },
        { name: "🎨 TEXT IMAGE STYLES", commands: ["Steel", "Wood", "Fire", "Ice", "Neon", "Splash", "Glitchtxt", "Gradient", "Comic", "Textstyles"] },
        { name: "📷 IMAGE TOOLS", commands: ["Sticker", "Toimg", "Removebg", "Blur", "Invert", "Circle", "Sepia", "Triggered", "Glitchimg", "Wanted", "Ocr"] },
        { name: "🔧 UTILITIES & LOOKUP", commands: ["Wiki", "Translate", "Weather", "Time", "Date", "Calc", "Shorturl", "Ip", "Qr", "Ping", "Speedtest"] },
        { name: "🎭 FUN & TEXT GAMES", commands: ["Meme", "Joke", "Quote", "Fact", "8ball", "Truth", "Dare", "Ship", "Slap", "Hug", "Kiss", "Pat"] },
        { name: "🎮 INTERACTIVE GAMES", commands: ["Ttt", "Connect4", "Guess", "Sudoku", "Trivia", "Hangman", "Riddle", "Slot", "Roll", "Quiz"] },
        { name: "👥 GROUP TOOLS", commands: ["Add", "Kick", "Promote", "Demote", "Link", "Tagall", "Hidetag", "Mute", "Unmute", "Setname", "Setdesc", "Setpp"] },
        { name: "🧑‍💻 OWNER CONTROLS", commands: ["Block", "Unblock", "Broadcast", "Shutdown", "Restart", "Eval", "Send", "Getsession"] },
        { name: "📊 INFO & FETCHERS", commands: ["Profile", "Numberinfo", "Github", "Npm", "Anime", "Quoteimg", "Iplookup", "Covid"] },
        { name: "💡 AI & PROMPT TOOLS", commands: ["Chatgpt", "Bard", "Openai", "Dalle", "Image", "Caption", "Nameart", "Imgprompt"] },
        { name: "🧪 STATUS & EXTRAS", commands: ["Vv", "Emojimix", "Logomaker", "Qotd", "Birthday", "Autoreact", "Autoview", "Setreactions", "Priorityview", "Save"] },
        { name: "📋 BOT SYSTEM", commands: ["Menu", "Help", "Status", "Ping", "Runtime", "Info", "Version"] }
    ];

    let menuText = `*❀━【 💎* _*WHIZ‑MD BOT MENU*_ *╮*\n\n`; // Added extra newline for spacing
    menuText += `*❀* *Owner* : ${config.ownerName}\n`;
    menuText += `*❀* *Mode* : Public\n`;
    menuText += `*❀* *Prefix* : ${config.prefix}\n`;
    // Use uniqueCommandsCount for a more accurate "Loaded" count if commandHandler's size includes aliases.
    // However, the original spec example had "17 (Loaded)" which might be a specific count of primary commands.
    // For now, using uniqueCommandsCount for better accuracy reflecting distinct functionalities.
    menuText += `*❀* *Commands* : ${uniqueCommandsCount} (Loaded) / 119 (Planned)\n`;
    menuText += `*❀* *Version* : ${pjson.version || "1.0.0"}\n`; // Read from package.json
    menuText += `*❀* *Repo* : github.com/whizmburu/WHIZ‑MD\n`;
    menuText += `*❀━━━━━━━━━━━━━╯*\n\n`; // Added extra newline

    menuText += `*❀* _Type_ \`${config.prefix}help [command]\` _for command details_\n`;
    menuText += `*❀* _Type_ \`${config.prefix}menu\` _for the full command list (this message)_\n\n`; // Added extra newline

    categories.forEach(category => {
        menuText += `*❀━━━━━━━━━━━━❀*\n`;
        menuText += `*❀* ✦✦✦ *${category.name}* ✦✦✦\n`;
        category.commands.forEach(cmd => {
            // We need to ensure the command name casing matches how it's typed/defined if we were to link to help.
            // For display, Title Case is fine.
            menuText += `*❀* ┃ *${cmd}*\n`;
        });
    });

    menuText += `*❀━━━━━━━━━━━━❀*\n`; // Final separator before link
    menuText += `https://chat.whatsapp.com/JLmSbTfqf4I2Kh4SNJcWgM\n\n`; // Group link
    menuText += `*❀━━━━━━━━━━━━━━╯*`; // Final bottom border

    return menuText;
}

const pjson = require('../../package.json'); // For version

module.exports = {
    name: 'help',
    description: 'Shows the interactive help menu or info about a specific command.',
    aliases: ['h'],
    async execute(client, message, args) {
        const commandList = require('../utils/commandHandler').commands; // Re-require to ensure it's the map

        if (args.length > 0) {
            // Show help for a specific command
            const commandName = args[0].toLowerCase();
            const command = commandList.get(commandName);

            if (!command) {
                return message.reply(`Command \`${commandName}\` not found. Use \`${config.prefix}help\` to see all commands.`);
            }

            let helpMessage = `*Command: ${config.prefix}${command.name}*\n`;
            if (command.description) {
                helpMessage += `Description: ${command.description}\n`;
            }
            if (command.aliases && command.aliases.length > 0) {
                helpMessage += `Aliases: ${command.aliases.map(a => `\`${config.prefix}${a}\``).join(', ')}\n`;
            }
            if (command.usage) {
                helpMessage += `Usage: \`${config.prefix}${command.name} ${command.usage}\`\n`;
            }
            // Add more details if needed (e.g., permissions)

            return message.reply(helpMessage);
        } else {
            // Show the full interactive menu
            const fullMenu = getFullMenuTextInternal();
            return message.reply(fullMenu);
        }
    },
    // Exporting the internal function with a different name for clarity if accessed from outside
    __getFullMenuText: getFullMenuTextInternal
};

// The duplicate getFullMenuText() function that was here has been removed.
// getFullMenuTextInternal() is now the sole source for the full menu text.
