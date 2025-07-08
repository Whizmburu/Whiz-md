// Help Command for WHIZ-MD Bot
const config = require('../config');
const { commands } = require('../utils/commandHandler'); // Assuming commandHandler exports the commands map

// Helper function to generate the full menu text
// Exported for use in bot.js for the welcome message
function getFullMenuTextInternal() {
    const commandList = require('../utils/commandHandler').commands; // Ensure this is the map
    return `❀┏━【 💎 WHIZ‑MD BOT MENU ━┓
❀ Owner     : ${config.ownerName}
❀ Mode      : Public
❀ Prefix    : ${config.prefix}
❀ Commands  : ${commandList.size} (Loaded) / 119 (Planned)
❀ Version   : 1.0.0
❀ Repo      : github.com/whizmburu/WHIZ‑MD
❀━━━━━━━━━━━━━━━┛

❀ Type \`${config.prefix}help [command]\` for command details
❀ Type \`${config.prefix}menu\` for the full command list (this message)

❀━━━━━━━━━━━━❀
❀ 📁 MEDIA TOOLS
❀ ${config.prefix}play / ${config.prefix}ytmp3 / ${config.prefix}ytmp4 / ${config.prefix}tiktok / ${config.prefix}instagram / ${config.prefix}facebook / ${config.prefix}spotify / ${config.prefix}soundcloud / ${config.prefix}joox / ${config.prefix}pinterest / ${config.prefix}shazam / ${config.prefix}lyrics
╰───────────── ⬇️ read more ⬇️

❀━━━━━━━━━━━━❀
❀ 🎨 TEXT IMAGE STYLES
❀ ${config.prefix}steel / ${config.prefix}wood / ${config.prefix}fire / ${config.prefix}ice / ${config.prefix}neon / ${config.prefix}splash / ${config.prefix}glitchtxt / ${config.prefix}gradient / ${config.prefix}comic / ${config.prefix}textstyles

❀━━━━━━━━━━━━❀
❀ 📷 IMAGE TOOLS
❀ ${config.prefix}sticker / ${config.prefix}toimg / ${config.prefix}removebg / ${config.prefix}blur / ${config.prefix}invert / ${config.prefix}circle / ${config.prefix}sepia / ${config.prefix}triggered / ${config.prefix}glitchimg / ${config.prefix}wanted / ${config.prefix}ocr

❀━━━━━━━━━━━━❀
❀ 🔧 UTILITIES & LOOKUP
❀ ${config.prefix}wiki / ${config.prefix}translate / ${config.prefix}weather / ${config.prefix}time / ${config.prefix}date / ${config.prefix}calc / ${config.prefix}shorturl / ${config.prefix}ip / ${config.prefix}qr / ${config.prefix}ping / ${config.prefix}speedtest

❀━━━━━━━━━━━━❀
❀ 🎭 FUN & TEXT GAMES
❀ ${config.prefix}meme / ${config.prefix}joke / ${config.prefix}quote / ${config.prefix}fact / ${config.prefix}8ball / ${config.prefix}truth / ${config.prefix}dare / ${config.prefix}ship / ${config.prefix}slap / ${config.prefix}hug / ${config.prefix}kiss / ${config.prefix}pat

❀━━━━━━━━━━━━❀
❀ 🎮 INTERACTIVE GAMES
❀ ${config.prefix}ttt / ${config.prefix}connect4 / ${config.prefix}guess / ${config.prefix}sudoku / ${config.prefix}trivia / ${config.prefix}hangman / ${config.prefix}riddle / ${config.prefix}slot / ${config.prefix}roll / ${config.prefix}quiz

❀━━━━━━━━━━━━❀
❀ 👥 GROUP TOOLS
❀ ${config.prefix}add / ${config.prefix}kick / ${config.prefix}promote / ${config.prefix}demote / ${config.prefix}link / ${config.prefix}tagall / ${config.prefix}hidetag / ${config.prefix}mute / ${config.prefix}unmute / ${config.prefix}setname / ${config.prefix}setdesc / ${config.prefix}setpp

❀━━━━━━━━━━━━❀
❀ 🧑‍💻 OWNER CONTROLS
❀ ${config.prefix}block / ${config.prefix}unblock / ${config.prefix}broadcast / ${config.prefix}shutdown / ${config.prefix}restart / ${config.prefix}eval / ${config.prefix}send / ${config.prefix}getsession

❀━━━━━━━━━━━━❀
❀ 📊 INFO & FETCHERS
❀ ${config.prefix}profile / ${config.prefix}numberinfo / ${config.prefix}github / ${config.prefix}npm / ${config.prefix}anime / ${config.prefix}quoteimg / ${config.prefix}iplookup / ${config.prefix}covid

❀━━━━━━━━━━━━❀
❀ 💡 AI & PROMPT TOOLS
❀ ${config.prefix}chatgpt / ${config.prefix}bard / ${config.prefix}openai / ${config.prefix}dalle / ${config.prefix}image / ${config.prefix}caption / ${config.prefix}nameart / ${config.prefix}imgprompt

❀━━━━━━━━━━━━❀
❀ 🧪 STATUS & EXTRAS
❀ ${config.prefix}vv / ${config.prefix}emojimix / ${config.prefix}logomaker / ${config.prefix}qotd / ${config.prefix}birthday / ${config.prefix}autoreact / ${config.prefix}autoview / ${config.prefix}setreactions / ${config.prefix}priorityview / ${config.prefix}save

❀━━━━━━━━━━━━❀
❀ 📋 BOT SYSTEM
❀ ${config.prefix}menu / ${config.prefix}help / ${config.prefix}status / ${config.prefix}ping / ${config.prefix}runtime / ${config.prefix}info / ${config.prefix}version`;
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



// This function will generate the full menu text as specified in the initial requirements
// It's good to centralize this if used in multiple places (e.g. welcome message, .menu, .help)
function getFullMenuText() { // This is now a duplicate, will be removed. Keeping the internal one.
    return `❀┏━【 💎 WHIZ‑MD BOT MENU ━┓
❀ Owner     : ${config.ownerName}
❀ Mode      : Public
❀ Prefix    : ${config.prefix}
❀ Commands  : ${commands.size} (Loaded) / 119 (Planned)
❀ Version   : 1.0.0
❀ Repo      : github.com/whizmburu/WHIZ‑MD
❀━━━━━━━━━━━━━━━┛

❀ Type \`${config.prefix}help [command]\` for command details
❀ Type \`${config.prefix}menu\` for the full command list (this message)

❀━━━━━━━━━━━━❀
❀ 📁 MEDIA TOOLS
❀ ${config.prefix}play / ${config.prefix}ytmp3 / ${config.prefix}ytmp4 / ${config.prefix}tiktok / ${config.prefix}instagram / ${config.prefix}facebook / ${config.prefix}spotify / ${config.prefix}soundcloud / ${config.prefix}joox / ${config.prefix}pinterest / ${config.prefix}shazam / ${config.prefix}lyrics
╰───────────── ⬇️ read more ⬇️

❀━━━━━━━━━━━━❀
❀ 🎨 TEXT IMAGE STYLES
❀ ${config.prefix}steel / ${config.prefix}wood / ${config.prefix}fire / ${config.prefix}ice / ${config.prefix}neon / ${config.prefix}splash / ${config.prefix}glitch / ${config.prefix}gradient / ${config.prefix}comic / ${config.prefix}textstyles

❀━━━━━━━━━━━━❀
❀ 📷 IMAGE TOOLS
❀ ${config.prefix}sticker / ${config.prefix}toimg / ${config.prefix}removebg / ${config.prefix}blur / ${config.prefix}invert / ${config.prefix}circle / ${config.prefix}sepia / ${config.prefix}triggered / ${config.prefix}glitch / ${config.prefix}wanted / ${config.prefix}ocr

❀━━━━━━━━━━━━❀
❀ 🔧 UTILITIES & LOOKUP
❀ ${config.prefix}wiki / ${config.prefix}translate / ${config.prefix}weather / ${config.prefix}time / ${config.prefix}date / ${config.prefix}calc / ${config.prefix}shorturl / ${config.prefix}ip / ${config.prefix}qr / ${config.prefix}ping / ${config.prefix}speedtest

❀━━━━━━━━━━━━❀
❀ 🎭 FUN & TEXT GAMES
❀ ${config.prefix}meme / ${config.prefix}joke / ${config.prefix}quote / ${config.prefix}fact / ${config.prefix}8ball / ${config.prefix}truth / ${config.prefix}dare / ${config.prefix}ship / ${config.prefix}slap / ${config.prefix}hug / ${config.prefix}kiss / ${config.prefix}pat

❀━━━━━━━━━━━━❀
❀ 🎮 INTERACTIVE GAMES
❀ ${config.prefix}ttt / ${config.prefix}connect4 / ${config.prefix}guess / ${config.prefix}sudoku / ${config.prefix}trivia / ${config.prefix}hangman / ${config.prefix}riddle / ${config.prefix}slot / ${config.prefix}roll / ${config.prefix}quiz

❀━━━━━━━━━━━━❀
❀ 👥 GROUP TOOLS
❀ ${config.prefix}add / ${config.prefix}kick / ${config.prefix}promote / ${config.prefix}demote / ${config.prefix}link / ${config.prefix}tagall / ${config.prefix}hidetag / ${config.prefix}mute / ${config.prefix}unmute / ${config.prefix}setname / ${config.prefix}setdesc / ${config.prefix}setpp

❀━━━━━━━━━━━━❀
❀ 🧑‍💻 OWNER CONTROLS
❀ ${config.prefix}block / ${config.prefix}unblock / ${config.prefix}broadcast / ${config.prefix}shutdown / ${config.prefix}restart / ${config.prefix}eval / ${config.prefix}send / ${config.prefix}getsession

❀━━━━━━━━━━━━❀
❀ 📊 INFO & FETCHERS
❀ ${config.prefix}profile / ${config.prefix}numberinfo / ${config.prefix}github / ${config.prefix}npm / ${config.prefix}anime / ${config.prefix}quoteimg / ${config.prefix}iplookup / ${config.prefix}covid

❀━━━━━━━━━━━━❀
❀ 💡 AI & PROMPT TOOLS
❀ ${config.prefix}chatgpt / ${config.prefix}bard / ${config.prefix}openai / ${config.prefix}dalle / ${config.prefix}image / ${config.prefix}caption / ${config.prefix}nameart / ${config.prefix}imgprompt

❀━━━━━━━━━━━━❀
❀ 🧪 STATUS & EXTRAS
❀ ${config.prefix}vv / ${config.prefix}emojimix / ${config.prefix}logomaker / ${config.prefix}qotd / ${config.prefix}birthday / ${config.prefix}autoreact / ${config.prefix}autoview / ${config.prefix}setreactions / ${config.prefix}priorityview / ${config.prefix}save

❀━━━━━━━━━━━━❀
❀ 📋 BOT SYSTEM
❀ ${config.prefix}menu / ${config.prefix}help / ${config.prefix}status / ${config.prefix}ping / ${config.prefix}runtime / ${config.prefix}info / ${config.prefix}version`;
}
