const mysql = require('mysql2');
require('dotenv').config();

// Connection Pool መጠቀም ብዙ ተጠቃሚዎች በአንድ ጊዜ ሲመጡ ሰርቨሩ እንዳይጨናነቅ ይረዳል
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise-based ፑል መጠቀም async/await እንድንጠቀም ያስችለናል
module.exports = pool.promise();