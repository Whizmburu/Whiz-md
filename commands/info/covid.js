const axios = require('axios');

// Helper to format numbers with commas
function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper to format timestamp to readable date
function formatDateFromTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) + ' (UTC)'; // disease.sh updated field is UTC timestamp
    } catch (e) {
        return 'N/A';
    }
}

async function handleCovidCommand(msg, args, client, theme, botPrefix) {
    const countryQuery = args.join(' ').trim();
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    let apiUrl;
    let loadingMessage;

    if (countryQuery) {
        apiUrl = `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(countryQuery)}`;
        loadingMessage = theme.messages.covidCmd.fetchingCountry.replace('{country}', countryQuery);
    } else {
        apiUrl = `https://disease.sh/v3/covid-19/all`;
        loadingMessage = theme.messages.covidCmd.fetchingGlobal;
    }

    try {
        await msg.reply(loadingMessage);
        const response = await axios.get(apiUrl, { timeout: 8000 });

        if (response.data) {
            const data = response.data;
            let resultMsg;

            if (countryQuery) { // Country specific
                if (data.message && data.message.toLowerCase().includes("country not found")) {
                     await msg.reply(theme.messages.covidCmd.notFound.replace('{country}', countryQuery));
                     await chat.clearState();
                     return;
                }
                resultMsg = theme.messages.covidCmd.countryStats
                    .replace('{country}', data.country || countryQuery)
                    .replace('{cases}', formatNumber(data.cases))
                    .replace('{deaths}', formatNumber(data.deaths))
                    .replace('{recovered}', formatNumber(data.recovered))
                    .replace('{active}', formatNumber(data.active))
                    .replace('{critical}', formatNumber(data.critical))
                    .replace('{todayCases}', formatNumber(data.todayCases))
                    .replace('{todayDeaths}', formatNumber(data.todayDeaths))
                    .replace('{casesPerOneMillion}', formatNumber(data.casesPerOneMillion))
                    .replace('{deathsPerOneMillion}', formatNumber(data.deathsPerOneMillion))
                    .replace('{updated}', formatDateFromTimestamp(data.updated));
            } else { // Global
                resultMsg = theme.messages.covidCmd.globalStats
                    .replace('{cases}', formatNumber(data.cases))
                    .replace('{deaths}', formatNumber(data.deaths))
                    .replace('{recovered}', formatNumber(data.recovered))
                    .replace('{active}', formatNumber(data.active))
                    .replace('{todayCases}', formatNumber(data.todayCases))
                    .replace('{todayDeaths}', formatNumber(data.todayDeaths))
                    .replace('{updated}', formatDateFromTimestamp(data.updated));
            }
            await msg.reply(resultMsg);
        } else {
            await msg.reply(theme.messages.covidCmd.apiError + " (Empty response from API)");
        }
        await chat.clearState();

    } catch (error) {
        console.error(`Error in .covid command for "${countryQuery || 'global'}":`, error.message);
        if (error.response && error.response.status === 404) {
            await msg.reply(theme.messages.covidCmd.notFound.replace('{country}', countryQuery));
        } else if (error.response && error.response.data && error.response.data.message) {
             await msg.reply(theme.messages.covidCmd.apiError + ` (API: ${error.response.data.message})`);
        } else if (error.code === 'ECONNABORTED') {
            await msg.reply(theme.messages.covidCmd.apiError + " (API request timed out)");
        }
        else {
            await msg.reply(theme.messages.covidCmd.apiError);
        }
        await chat.clearState();
    }
}

module.exports = {
    handleCovidCommand
};
