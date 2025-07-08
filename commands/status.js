// Status Command for WHIZ-MD Bot
const config = require('../config');
const os = require('os');
const { uptime } = require('process'); // Import uptime from process module

let botStartTime = Date.now(); // Define botStartTime at the module level or pass it around

module.exports = {
    name: 'status',
    description: 'Shows the bot status, including uptime and server info.',
    aliases: ['stats', 'botstatus'],
    execute(client, message, args) {
        const currentTime = Date.now();
        const botUptime = formatUptime(currentTime - botStartTime);
        const systemUptime = formatUptime(os.uptime() * 1000); // os.uptime is in seconds

        const pushname = client.info.pushname || 'N/A';
        const botNumber = client.info.wid.user;

        const statusMessage = `❀┏━【 📊 WHIZ‑MD STATUS ━┓
❀ Owner     : ${config.ownerName}
❀ Bot Name  : ${config.botName}
❀ Bot Number: ${botNumber}
❀ Logged In : ${pushname}
❀ Prefix    : ${config.prefix}
❀ Mode      : Public
❀ Version   : 1.0.0
❀ Library   : whatsapp-web.js
❀ Plattform : ${os.platform()}
❀ Arch      : ${os.arch()}
❀ CPU Model : ${os.cpus()[0].model}
❀ RAM Free  : ${(os.freemem() / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB
❀ Bot Uptime: ${botUptime}
❀ Sys Uptime: ${systemUptime}
❀ Repo      : github.com/whizmburu/WHIZ‑MD
❀━━━━━━━━━━━━━━━┛`;

        message.reply(statusMessage);
    },
    // Function to set start time, can be called from bot.js
    setBotStartTime: (time) => {
        botStartTime = time;
    }
};

function formatUptime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds %= 60;
    minutes %= 60;
    hours %= 24;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
