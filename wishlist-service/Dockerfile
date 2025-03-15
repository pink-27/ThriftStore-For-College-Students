# Use a base image
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



# docker build -t wishlist-service .
# docker run -p 5010:5010 wishlist-service