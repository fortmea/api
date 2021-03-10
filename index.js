let mysql = require('mysql');
let connection = mysql.createConnection({
    host: '68.183.126.19',
    user: 'joaoi',
    password: 'Leitecomcafe',
    database: 'db_web'
});
connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  
    console.log('Connected to the MySQL server.');
  });