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
});
// Retrieve usuario with id 
app.use((req, res, next) => {
    let validIps = ['::12', '127.0.0.1','::1','68.183.126.19','']; // Put your IP whitelist in this array
      if(validIps.includes(req.socket.remoteAddress)){
          // IP is ok, so go on
          console.log("IP "+req.socket.remoteAddress+" ok");
          next();
      }
      else{
          // Invalid ip
          console.log("Bad IP: " + req.socket.remoteAddress);
          const err = new Error("Bad IP: " + req.socket.remoteAddress);
          next(err);
      }
    })*/
app.post('/usuario/', function (req, res) {
    console.log(req.body);
let usuario_id = req.body.id;
//console.log(usuario_id)
if (!usuario_id) {
return res.status(400).send({ error: true, message: 'Please provide usuario_id' });
}
dbConn.query('SELECT `nome` FROM usuario where id=?', usuario_id, function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results[0], message: 'Ok.' });
});
});
app.post('/post/', function (req, res) {
    
    dbConn.query('SELECT * FROM post ORDER BY id DESC', function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results });
    });
    });
app.post('/addpost/', function (req, res) {
    let autor = req.body.id;
    let conteudo = req.body.conteudo;
    let nome = req.body.titulo;
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();  
    var dataf = year +'-'+(month+1)+'-'+day;
    var query = 'INSERT INTO `post`(`nome`,`conteudo`,`data`,`autor`) Values("'+nome+'","'+conteudo+'","'+dataf+'","'+autor+'")';
    console.log(query);
    dbConn.query(query, function (error, results, fields) {
    
    if (error) throw error;
    return res.send({ error: false});
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