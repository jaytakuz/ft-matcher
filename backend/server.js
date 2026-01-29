const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// หน้าแรก
app.get('/', (req, res) => {
  res.send('✅ Backend is running successfully!');
});

// API Test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Data from Backend Container", 
    time: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});