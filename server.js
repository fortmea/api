var express = require('express');
var app = express();
var mysql = require('mysql');
var cors = require('cors')
//var qs = require('querystring');
app.use(express.urlencoded({extended:true}));
app.use(cors());
// default route
app.get('/', function (req, res) {
return res.send({ error: true, message: 'hello' })
});
// connection configurations
var dbConn = mysql.createConnection({
    host: '68.183.126.19',
    user: 'joaoi',
    password: 'Leitecomcafe',
    database: 'db_web'
});
// connect to database
dbConn.connect(); 
// Retrieve all usuario 

/*app.post('/usuario', function (req, res) {
dbConn.query('SELECT * FROM usuario', function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'usuario list.' });
});
});*/
// Retrieve usuario with id 
app.use((req, res, next) => {
    let validIps = ['::12', '127.0.0.1','::1','68.183.126.19']; // Put your IP whitelist in this array
        console.log(req.originalUrl);
      if(validIps.includes(req.socket.remoteAddress)){
          // IP is ok, so go on
          console.log("IP "+req.socket.remoteAddress+" ok");
          next();
      }
      else{
          // Invalid ip
          console.log("Bad IP: " + req.connection.remoteAddress);
          const err = new Error("Bad IP: " + req.connection.remoteAddress);
          next(err);
      }
    })
app.post('/usuario/', function (req, res) {
let usuario_id = req.body.id;
if (!usuario_id) {
return res.status(400).send({ error: true, message: 'Please provide usuario_id' });
}
dbConn.query('SELECT * FROM usuario where id=?', usuario_id, function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results[0], message: 'Ok.' });
});
});
// Login
app.post('/login/', function (req, res) {
    let usuario_nome = req.body.nome;
    let usuario_senha = req.body.senha;
    //console.log("Parametros: "+JSON.stringify(req.body)+"       ");
    if ((!usuario_nome) || (!usuario_senha)) {
    return res.status(400).send({ error: true, message: 'Please provide name' });
    }
    var querys = "SELECT * FROM usuario where nome='"+usuario_nome+ "' and senha='"+usuario_senha+"' ";
    //console.log(querys);
    dbConn.query(querys, function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results,message:"Ok."});
    });
    });
// set port
app.listen(process.env.PORT || 5000, function() {
    console.log("Server started.......");
});

module.exports = app;