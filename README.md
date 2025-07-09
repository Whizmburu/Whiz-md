# ✨ WHIZ-MD — Advanced WhatsApp Bot ✨

<p align="center">
  <img src="https://i.ibb.co/dsbcdSPX/whizmd.png" alt="WHIZ-MD Logo" width="200"/>
</p>

**WHIZ-MD** is a sleek, powerful WhatsApp bot with over 119 commands, built for creativity and automation. It saves, views, and reacts to statuses, manages groups, fetches info, generates AI text & art — all wrapped in an elegant and user-friendly menu system.

This bot is designed to be extensible and fun, bringing a wide array of functionalities directly to your WhatsApp chat.

---

## 🌟 Key Features

*   **Extensive Command Library:** 119+ commands across various categories.
*   **Interactive Menu System:**
    *   `.menu`: Shows the full, beautifully formatted command list.
    *   `.help`: Provides a tiered help system – view categories, commands within categories, or specific command details.
*   **Status Management:**
    *   `save`: Reply to a status with "save" to download its media/text.
    *   `.autoview on/off`: Toggle automatic viewing of contacts' statuses.
    *   `.autoreact on/off`: Toggle automatic reaction to contacts' statuses.
    *   `.setreactions <emojis...>`: Customize emojis used for auto-reactions.
*   **Media Tools:** Download audio/video from YouTube (`.play`, `.ytmp3`, `.ytmp4`), fetch lyrics (`.lyrics`), and more.
*   **Text & Image Styling:** Generate creative text images with effects like `.fire`, `.neon`, `.glitchtxt`, and many others.
*   **Image Manipulation:** Create stickers (`.sticker`), convert stickers to images (`.toimg`), remove backgrounds (`.removebg`), apply filters (`.blur`, `.sepia`, etc.), create wanted posters (`.wanted`).
*   **AI Powered Tools:**
    *   Generate images from prompts using DALL-E (`.image`, `.dalle`).
    *   *(More AI features like ChatGPT/Bard integration planned for future versions)*
*   **Utility & Lookup:** Translate text (`.translate`), get weather (`.weather`), search Wikipedia (`.wiki`), perform calculations (`.calc`), generate QR codes (`.qr`), and more.
*   **Fun & Games:** Memes (`.meme`), jokes (`.joke`), quotes (`.quote`), text-based games (`.8ball`, `.truth`, `.dare`), and interactive games like Tic-Tac-Toe (`.ttt`), Connect4 (`.c4`), Sudoku (`.sudoku`), and more.
*   **Group Management:** Add/kick members, promote/demote admins, get group link, tag all members, etc. (requires admin privileges for the bot).
*   **Owner Controls:** Broadcast messages, manage users (block/unblock), shutdown/restart the bot, get session data, and evaluate code (owner only).
*   **Information Fetchers:** Get user profiles (`.profile`), GitHub info (`.github`), NPM package details (`.npm`), anime search (`.anime`), COVID stats (`.covid`).

---

## 🚀 Deployment

WHIZ-MD is designed to be deployed using Docker, but can also be run directly with Node.js if your environment is set up correctly.

### Prerequisites:
*   Node.js (v16.x or higher recommended)
*   npm (usually comes with Node.js)
*   ffmpeg (for some media commands, especially audio/video processing) - The Dockerfile includes this.

### Using Docker (Recommended):
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/whizmburu/WHIZ-MD.git
    cd WHIZ-MD
    ```
2.  **Environment Variables (`.env` file):**
    Create a `.env` file in the root of the project by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and fill in the necessary values:
    *   `WHIZMD_SESSION_DATA`: **Crucial for bot operation.** This is your WhatsApp session string, Base64 encoded, and **must** start with `WHIZMD_`.
        *   Generate your session ID at: [https://whizmdsessions.onrender.com](https://whizmdsessions.onrender.com) (or any other QR code scanning method for `whatsapp-web.js` that provides the session JSON, then Base64 encode it and prepend `WHIZMD_`).
    *   `OWNER_NUMBER`: Your WhatsApp number in the format `1234567890@c.us` (replace with your actual number). This grants you owner privileges for the bot.
    *   `BOT_PREFIX`: The prefix for commands (default is `.`).
    *   `OPENAI_API_KEY`: Your API key from OpenAI for DALL-E image generation (`.image`, `.dalle` commands).
    *   `REMOVEBG_API_KEY`: Your API key from remove.bg for the `.removebg` command.
    *   `OPENWEATHERMAP_API_KEY`: Your API key from OpenWeatherMap for the `.weather` command.
    *(Other API keys might be needed for full functionality of placeholder commands if they get implemented).*

3.  **Build the Docker image:**
    ```bash
    docker build -t whiz-md .
    ```
4.  **Run the Docker container:**
    ```bash
    docker run -d --env-file .env --name whiz-md-container whiz-md
    ```
    To view logs:
    ```bash
    docker logs -f whiz-md-container
    ```

### Running Directly with Node.js:
1.  **Clone the repository** (if not already done).
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables** as described in the Docker section (either in a `.env` file or as system environment variables).
4.  **Ensure `ffmpeg` is installed** and accessible in your system's PATH if you plan to use all media commands.
5.  **Start the bot:**
    ```bash
    npm start
    ```
    You will likely see a QR code in your terminal on the first run (if `WHIZMD_SESSION_DATA` is not provided or invalid). Scan this with your WhatsApp application (Linked Devices -> Link a device). Subsequent runs should use the saved session if `LocalAuth` is working correctly and the session data is persisted (default: `./whizmd_session_data/` folder). The `WHIZMD_SESSION_DATA` env var aims to make this process more portable.

---

## 🤖 Basic Usage

Once the bot is running and connected to your WhatsApp account:

*   **View the main menu:**
    `.menu`
*   **Get help:**
    *   `.help`: Shows a list of command categories.
    *   `.help <category_name_or_number>`: Lists commands in that category.
    *   `.help <command_name>`: Shows detailed information for a specific command.

---

## 🤝 Community & Support

*   **Join our WhatsApp Group:** [WHIZ-MD WhatsApp Group](https://chat.whatsapp.com/JLmSbTfqf4I2Kh4SNJcWgM)
*   **Contribute or Report Issues:** [GitHub Issues Page](https://github.com/whizmburu/WHIZ-MD/issues) (Assuming this is the correct repo link based on previous context)

---

## 📜 License

This project is open-source. (A specific license like MIT, Apache 2.0, etc., can be added here. For now, keeping it general).

---
*Powered by WHIZ-MD*
*Developed by WHIZ*
