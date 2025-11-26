# Stage 1: Build Hexo static site
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (use cache when possible)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the blog source
COPY . .

# Generate static files into /app/public
RUN npx hexo generate

# Stage 2: Serve with nginx
FROM nginx:alpine

# Clean default nginx html directory
RUN rm -rf /usr/share/nginx/html/*

# Copy generated static files from builder stage
COPY --from=builder /app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
