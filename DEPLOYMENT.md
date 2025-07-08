# WHIZ-MD Bot Deployment Guide

This guide provides instructions on how to deploy the WHIZ-MD WhatsApp bot using Docker.

## Prerequisites

1.  **Docker**: Ensure Docker is installed and running on your deployment server or local machine. You can download it from [docker.com](https://www.docker.com/get-started).
2.  **Git**: To clone the repository.
3.  **Bot Source Code**: Clone the WHIZ-MD repository:
    ```bash
    git clone https://github.com/whizmburu/WHIZ-MD.git
    cd WHIZ-MD
    ```
4.  **Assets (Optional but Recommended)**:
    *   For the `.triggered` command to work with its intended label, place an image named `triggered_label.png` inside the `assets/images/` directory in the project root.
    *   For the `.wanted` command, place a template image named `wanted_template.png` inside `assets/images/`. You will also need to adjust the coordinates within the `commands/image/wanted.js` file to match your template.

## Environment Configuration

The bot requires certain environment variables to run correctly.

1.  **Create a `.env` file**:
    In the root of the project directory, create a file named `.env`. You can copy the `env.example` file:
    ```bash
    cp env.example .env
    ```

2.  **Edit `.env` file**:
    Open the `.env` file and fill in the required values:

    *   `WHIZMD_SESSION_UNIQUEKEY`: **(Required)** This is your WhatsApp session string.
        *   The bot will print a QR code to the console on its first run if no session is found. Scan this QR code with your WhatsApp (Linked Devices -> Link a device).
        *   After scanning, the bot will generate a session string and print it or save it (depending on `LocalAuth` strategy). You need to capture this string.
        *   Alternatively, if you are using an external service (like the one mentioned: `https://whizmdsessions.onrender.com` or your own) to generate the session string from a QR scan, use that string here.
        *   The variable name *must* start with `WHIZMD_`. For example: `WHIZMD_MYSESSION="VERY_LONG_SESSION_STRING_HERE"`

    *   `OWNER_NUMBER`: **(Recommended)** Your WhatsApp number without any symbols or '+', e.g., `254754783683`. This is used for owner-specific commands.
    *   `OWNER_NAME`: **(Recommended)** Your name or the desired bot owner name to be displayed in menus and info.
    *   `REMOVE_BG_API_KEY`: **(Optional)** API key from [remove.bg](https://www.remove.bg/dashboard#api-key) if you want to use the `.removebg` command.

    **Example `.env` content:**
    ```env
    WHIZMD_SESSION_MYBOT="your_actual_session_string_from_qr_scan"
    OWNER_NUMBER="1234567890"
    OWNER_NAME="YourBotOwnerName"
    REMOVE_BG_API_KEY="your_remove_bg_api_key_if_any"
    ```
    **Important**: Do NOT commit your actual `.env` file with sensitive credentials to Git. The `.gitignore` file should already be configured to ignore `.env`.

## Building the Docker Image

Navigate to the root directory of the project (where the `Dockerfile` is located) and run the following command to build the Docker image:

```bash
docker build -t whiz-md .
```
This will create a Docker image named `whiz-md`.

## Running the Docker Container

Once the image is built, you can run the bot as a Docker container.

**Method 1: Using `.env` file (Recommended with Docker Compose, or if your Docker version supports `--env-file` directly with `docker run`)**

If your `docker run` command or setup supports reading directly from a `.env` file (Docker Compose is excellent for this), it simplifies things. For `docker run` itself:

```bash
docker run -d --name whiz-md-container --env-file .env whiz-md
```
*(Note: `--env-file` support in `docker run` might depend on Docker version or require specific configurations. Docker Compose is generally preferred for managing environment variables from files.)*

**Method 2: Passing Environment Variables Individually**

If not using `--env-file`, you must pass each environment variable explicitly:

```bash
docker run -d --name whiz-md-container \
  -e WHIZMD_SESSION_MYBOT="your_actual_session_string_from_qr_scan" \
  -e OWNER_NUMBER="1234567890" \
  -e OWNER_NAME="YourBotOwnerName" \
  -e REMOVE_BG_API_KEY="your_remove_bg_api_key_if_any" \
  whiz-md
```

*   `-d`: Runs the container in detached mode (in the background).
*   `--name whiz-md-container`: Assigns a name to your container for easier management.
*   `-e VARIABLE_NAME="value"`: Sets an environment variable. Replace the example values with your actual credentials from your `.env` file.
*   `whiz-md`: The name of the Docker image you built.

**To view logs (especially on first run for QR code if session is not pre-set):**

If running in detached mode, you can view logs with:
```bash
docker logs -f whiz-md-container
```

If you want to run it interactively to see the QR code directly in the terminal (if no session is provided via env var):
```bash
docker run -it --rm --name whiz-md-interactive \
  -e OWNER_NUMBER="1234567890" \
  -e OWNER_NAME="YourBotOwnerName" \
  # Add other env vars as needed, but omit WHIZMD_SESSION_... to trigger QR scan
  whiz-md
```
Scan the QR code shown in the terminal with WhatsApp. The session data will be stored inside the container in a `.wwebjs_auth` folder (due to `LocalAuth` strategy). For persistence across container restarts, this folder should ideally be mounted as a volume:

```bash
# Create a local directory for session data
mkdir -p .wwebjs_auth_session
# Run with volume mount
docker run -d --name whiz-md-container \
  -v $(pwd)/.wwebjs_auth_session:/usr/src/app/.wwebjs_auth \
  -e WHIZMD_SESSION_MYBOT="your_session_id_after_first_scan_if_any" \
  -e OWNER_NUMBER="1234567890" \
  # ... other env vars
  whiz-md
```
If `WHIZMD_SESSION_...` is provided, the bot will attempt to use that session directly, bypassing QR scan. The `LocalAuth` strategy with a `clientId` based on this session ID will also create its own persistent storage folder, typically like `.wwebjs_auth/session-WHIZMD_SESS_XXXXX`. Mounting `/usr/src/app/.wwebjs_auth` covers this.

## Updating the Bot

1.  Pull the latest changes:
    ```bash
    git pull
    ```
2.  Stop the current container:
    ```bash
    docker stop whiz-md-container
    docker rm whiz-md-container
    ```
3.  Rebuild the image:
    ```bash
    docker build -t whiz-md .
    ```
4.  Run the new container with the same `docker run` command you used previously (including environment variables and volume mounts).

## Notes

*   **Tesseract.js Language Data**: The OCR command (`.ocr`) uses Tesseract.js. Language data for English ('eng') will be downloaded by Tesseract.js on its first run inside the container. This might make the very first use of the OCR command a bit slower.
*   **Resource Usage**: Running a WhatsApp bot, especially with Puppeteer, can be resource-intensive. Ensure your deployment server has sufficient RAM (at least 1-2GB recommended).
*   **Troubleshooting**: Check container logs (`docker logs whiz-md-container`) for any errors during startup or operation.

---
Happy Deploying WHIZ-MD! 🚀
