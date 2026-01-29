FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 👇 เพิ่มบรรทัดนี้ (ถ้าโปรเจคเป็น TypeScript)
# RUN npm run build 

EXPOSE 3000

CMD ["npm", "start"]