FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Copy .env file
COPY .env .env

# Start the application
CMD ["npm", "start"]

# docker build -t pink27/chat-service:latest .