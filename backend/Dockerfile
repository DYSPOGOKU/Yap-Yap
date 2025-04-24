    FROM node:18-alpine

    WORKDIR /app

    # Copy package.json and package-lock.json
    COPY package*.json ./

    # Install dependencies
    RUN npm install

    # Copy source code
    COPY . .

    # Expose port
    EXPOSE 5000

    # Start the backend server
    CMD ["node", "index.js"]