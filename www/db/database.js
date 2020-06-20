 const mysql = require('mysql');
const connection = mysql.createConnection({
  
  host: '127.0.0.1',
  user: 'admin',
  password: '',
  database: ''


});
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database!');
});

module.exports = connection;