// Runtime Command for WHIZ-MD Bot
const { uptime } = require('process'); // To get bot process uptime easily
let botStartTime = Date.now(); // Default, can be updated by status.js logic if preferred

module.exports = {
    name: 'runtime',
    description: 'Shows how long the bot has been running.',
    aliases: ['uptime'],
    execute(client, message, args) {
        // If status command's start time is available and more accurate, try to use it
        // This requires status.js to somehow expose its botStartTime or a function to get it.
        // For now, using its own startTime or process.uptime()
        // const currentUptime = formatUptime(Date.now() - botStartTime); // Using own start time
        const processUptime = formatUptime(process.uptime() * 1000); // More reliable for process

        message.reply(`WHIZ-MD has been running for: ${processUptime}`);
    },
    // Optional: if status.js sets a global start time, this command could use it
    // setStartTime: (time) => { botStartTime = time; }
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
