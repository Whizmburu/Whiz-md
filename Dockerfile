# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Environment variable for session data (will be adapted)
ENV WHIZMD_SESSION_DATA=""

# Command to run the application
CMD ["node", "index.js"]
