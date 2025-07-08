// Help Command for WHIZ-MD Bot
const config = require('../config');
const { commands } = require('../utils/commandHandler'); // Assuming commandHandler exports the commands map

// Helper function to generate the full menu text
// Exported for use in bot.js for the welcome message
function getFullMenuTextInternal(botVersion) { // Accepts botVersion as a parameter
    // Removed direct require of package.json
    // Removed direct require of commandHandler to avoid circular dependency issues here.
    // Command count will be fetched when commandHandler is stable or passed in.
    // For now, using a placeholder for uniqueCommandsCount.

    const commandHandler = require('../utils/commandHandler');
    const uniqueCommands = new Set(commandHandler.commands.values());
    const uniqueCommandsCount = uniqueCommands.size || "N/A";


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

    let menuText = `*❀━【 💎* _*WHIZ‑MD BOT MENU*_ *╮*\n\n`;
    menuText += `*❀* *Owner* : ${config.ownerName}\n`;
    menuText += `*❀* *Mode* : Public\n`;
    menuText += `*❀* *Prefix* : ${config.prefix}\n`;
    menuText += `*❀* *Commands* : ${uniqueCommandsCount} (Loaded) / 119 (Planned)\n`;
    menuText += `*❀* *Version* : ${botVersion || config.getBotVersion() || "1.0.0"}\n`; // Use passed version or fallback
    menuText += `*❀* *Repo* : github.com/whizmburu/WHIZ‑MD\n`;
    menuText += `*❀━━━━━━━━━━━━━╯*\n\n`;

    menuText += `*❀* _Type_ \`${config.prefix}help [command]\` _for command details_\n`;
    menuText += `*❀* _Type_ \`${config.prefix}menu\` _for the full command list (this message)_\n\n`;

    categories.forEach(category => {
        menuText += `*❀━━━━━━━━━━━━❀*\n`;
        menuText += `*❀* ✦✦✦ *${category.name}* ✦✦✦\n`;
        category.commands.forEach(cmd => {
            menuText += `*❀* ┃ *${cmd}*\n`;
        });
    });

    menuText += `*❀━━━━━━━━━━━━❀*\n`;
    menuText += `https://chat.whatsapp.com/JLmSbTfqf4I2Kh4SNJcWgM\n\n`;
    menuText += `*❀━━━━━━━━━━━━━━╯*`;

    return menuText;
}

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
