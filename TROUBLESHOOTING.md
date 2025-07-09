# WHIZ-MD Bot Troubleshooting

This file provides solutions to common issues you might encounter while setting up or running WHIZ-MD.

## Issue: Puppeteer Fails to Launch Browser (`ENOENT chrome.exe` error on Windows, or similar on other OSes)

You might see an error message similar to this in your console when starting the bot:
```
WHIZ-MD: Client initialization error Error: Failed to launch the browser process!
spawn C:\Users\YourUser\Path\To\Project\node_modules\puppeteer-core\.local-chromium\win64-xxxxxx\chrome-win\chrome.exe ENOENT
...
```
Or on Linux/Mac, it might be a different path or error related to missing libraries or sandbox issues.

This error generally means that Puppeteer, the library `whatsapp-web.js` uses to control a headless browser (Chromium), could not find or launch the Chromium executable it expected.

Here are the recommended troubleshooting steps:

### 1. Force Puppeteer to Re-download Chromium (Recommended First Step for most users)

Sometimes, the initial download of Chromium by Puppeteer might have been corrupted, incomplete, or blocked. This is the most common cause.

*   **Stop the bot** if it's running.
*   **Delete `node_modules` folder:** In your project directory, delete the entire `node_modules` folder.
*   **Delete `package-lock.json` file (or `yarn.lock` if using Yarn):** Delete this file from your project directory.
*   **Reinstall dependencies:** Open your terminal/command prompt in the project directory and run:
    ```bash
    npm install
    ```
    (If you use Yarn: `yarn install`)
    This command will re-download all dependencies, including Puppeteer, which should then attempt to download its compatible version of Chromium again.
*   **Try starting the bot again:** `npm start`

### 2. Check Antivirus / Firewall / Permissions

Your antivirus or firewall software might be preventing Puppeteer from downloading Chromium or preventing the downloaded `chrome.exe` (or `chrome` on Linux/Mac) from running. Ensure your user has permissions to execute files in the `node_modules` directory.

*   Temporarily disable your antivirus/firewall.
*   Attempt Step 1 again (reinstall dependencies).
*   If it works, add an exception for the `node_modules` folder or specifically for the Chromium executable found within `node_modules/puppeteer-core/.local-chromium/` (the exact sub-path might vary slightly with Puppeteer versions) to your antivirus/firewall. Remember to re-enable your security software.
*   On Windows, ensure that the system has not restricted execution of downloaded files (sometimes an "Unblock" option in file properties is needed).

### 3. Use Your System's Installed Chrome/Chromium (Alternative Method)

If Puppeteer's bundled Chromium continues to cause issues, you can configure Puppeteer to use an existing installation of Google Chrome or another Chromium-based browser on your system.

*   **Find your Chrome/Chromium executable path:**
    *   **Windows (common paths):**
        *   `C:\Program Files\Google\Chrome\Application\chrome.exe`
        *   `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
    *   **macOS:**
        *   `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
    *   **Linux (common paths):**
        *   `/usr/bin/google-chrome-stable`
        *   `/usr/bin/chromium-browser`
        *   `/snap/bin/chromium` (if installed via Snap)
        *   You can often find it with `which google-chrome-stable` or `which chromium-browser`.
*   **Edit `index.js`:**
    Open the `index.js` file. Find the `new Client(...)` section. Inside the `puppeteer` options, you'll see a commented-out line for `executablePath`.
    ```javascript
    // ...
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', // Important for Linux servers/Docker
            // ... other args
        ],
        // IMPORTANT: If Puppeteer fails to find its bundled Chromium:
        // Uncomment 'executablePath' and set it to your system's Chrome/Chromium.
        // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows example
        // executablePath: '/usr/bin/google-chrome-stable', // Linux example
        // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS example
    },
    // ...
    ```
*   **Uncomment and Update:** Uncomment the `executablePath` line relevant to your OS and replace the example path with the **actual path** to your Chrome/Chromium executable.
    *   **Important for Windows paths in JavaScript:** Use double backslashes `\\` (e.g., `'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'`) or forward slashes `/` (e.g., `'C:/Program Files/Google/Chrome/Application/chrome.exe'`).
*   **Save `index.js`** and try starting the bot again (`npm start`).

### 4. Linux: Missing Dependencies

On Linux systems (especially servers or minimal Docker images), Puppeteer's bundled Chromium might fail to launch due to missing shared library dependencies.

*   **Install common dependencies (Debian/Ubuntu):**
    ```bash
    sudo apt-get update && sudo apt-get install -y \
        ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 \
        libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
        libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
        libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
        libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
        libxtst6 lsb-release wget xdg-utils
    ```
    (This list is comprehensive; you might not need all of them depending on your base system.)
*   **`--no-sandbox` Argument:** The `args: ['--no-sandbox', ...]` option in `index.js` is often required when running in Docker or on Linux servers, especially as a non-root user or in environments where setting up a proper sandbox is difficult. **While this works, be aware it reduces security if you were to browse to untrusted web pages with Puppeteer (which `whatsapp-web.js` doesn't do for its core function).**
*   For an up-to-date list of dependencies, refer to the Puppeteer and Chromium documentation.

### 5. Check `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` Environment Variable

If you (or some other tool/script) have set an environment variable `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`, Puppeteer will not download its own version of Chromium during `npm install`. If this is set, you *must* provide a valid `executablePath` (Step 3). If you want Puppeteer to use its own version, ensure this environment variable is not set or is set to `false`.

### 6. Puppeteer Cache Directory (`PUPPETEER_CACHE_DIR`)

Puppeteer downloads browsers to `~/.cache/puppeteer`. If the home directory (`~`) is not available or writable (e.g., in some CI/CD or restricted environments), the download will fail. You can set the `PUPPETEER_CACHE_DIR` environment variable to a different writable path *before* running `npm install`.
Example:
```bash
PUPPETEER_CACHE_DIR=/tmp/puppeteer_cache npm install
```
Or configure it via a `.puppeteerrc.cjs` file as described in the official Puppeteer documentation.

### 7. Further Puppeteer Troubleshooting

If none of the above steps work, consult the official Puppeteer troubleshooting guide, which is an excellent resource:
[https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md)
(The content you provided previously is a very good version of this guide).

---

If you encounter other issues, please check the console logs for specific error messages when starting the bot.
```
