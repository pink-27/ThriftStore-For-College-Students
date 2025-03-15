# Use Node.js 18 base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client (DO NOT RUN MIGRATIONS HERE)
RUN npx prisma generate

# Expose the service port
EXPOSE 5014

# Start the service with migrations applied at runtime
CMD npx prisma migrate deploy && npm start



# docker build -t wishlist-service .
# docker run -p 5010:5010 wishlist-service