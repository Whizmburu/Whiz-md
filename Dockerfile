# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install necessary dependencies for whatsapp-web.js and sharp
# puppeteer dependencies for whatsapp-web.js
# build-essential and python for some Node.js native addons (like sharp might need)
RUN apt-get update && apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    build-essential \
    python3 \
    # Added for sharp, common dependencies:
    libvips-dev \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install --no-optional && npm cache clean --force
# Using --no-optional because some optional deps can cause issues in Docker for puppeteer

# If you have a .wwebjs_auth folder locally from a previous run that you want to include:
# COPY .wwebjs_auth ./ .wwebjs_auth

# Copy the rest of your application's source code
COPY . .

# Ensure assets directory is copied (if you have assets like triggered_label.png)
# This is covered by `COPY . .` if assets is in the root.
# If assets/images/triggered_label.png and wanted_template.png are needed, ensure they are present
# RUN mkdir -p /usr/src/app/assets/images
# COPY assets/images/triggered_label.png /usr/src/app/assets/images/triggered_label.png
# COPY assets/images/wanted_template.png /usr/src/app/assets/images/wanted_template.png
# This explicit copy is not needed if assets folder is at root and `COPY . .` is used.

# Tesseract language data:
# Tesseract.js downloads language data on first run to a cacheable directory.
# For Docker, to avoid re-downloading on every container start, you might:
# 1. Run the OCR command once locally to populate ~/.tessdata (or similar)
# 2. Copy that data into the Docker image.
# OR rely on it downloading on first run inside the container (simpler, but slower first start).
# For now, we'll let it download on first run.

# Your bot runs on Node.js, so specify the command to run it
CMD ["node", "bot.js"]

# Expose any port if your app listens on one (usually not needed for whatsapp-web.js bots unless they have a web interface)
# EXPOSE 3000
