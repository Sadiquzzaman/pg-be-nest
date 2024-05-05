# Use an official Node.js runtime as a parent image
FROM node:18.12.1-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install -g pnpm@6.32.11
RUN pnpm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port that the application will listen on
EXPOSE 5000

# Start the application
CMD [ "pnpm", "run", "start" ]
