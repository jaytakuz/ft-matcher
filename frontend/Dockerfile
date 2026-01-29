FROM node:20-alpine AS builder

WORKDIR /app

# 1. ก็อป .env เข้าไป (สำคัญมาก! แก้จอขาว)
COPY .env ./
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Serve ด้วย Nginx ---
FROM nginx:alpine

# 2. ก๊อปไฟล์เว็บที่ Build แล้ว
COPY --from=builder /app/dist /usr/share/nginx/html

# 3. ✅ ก๊อปไฟล์ Config ของเราเข้าไปทับของเดิม (วิธีนี้ชัวร์กว่า)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 10610
CMD ["nginx", "-g", "daemon off;"]