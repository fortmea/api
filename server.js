var express = require('express');
var app = express();
var mysql = require('mysql');
app.use(express.urlencoded({extended: true}));
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
app.get('/usuario', function (req, res) {
dbConn.query('SELECT * FROM usuario', function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'usuario list.' });
});
});
// Retrieve usuario with id 
app.get('/usuario/:id', function (req, res) {
let usuario_id = req.params.id;
if (!usuario_id) {
return res.status(400).send({ error: true, message: 'Please provide usuario_id' });
}
dbConn.query('SELECT * FROM usuario where id=?', usuario_id, function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results[0], message: 'usuario list.' });
});
});
// Login
app.get('/usuario/login/:nome&:senha', function (req, res) {
    let usuario_nome = req.params.nome;
    let usuario_senha = req.params.senha;
    console.log(req.params);
    if (!usuario_nome||!usuario_senha) {
    return res.status(400).send({ error: true, message: 'Please provide name' });
    }
    dbConn.query('SELECT * FROM usuario where nome=? and senha=?', usuario_id, usuario_senha, function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results[0], message: 'usuario list.' });
    });
    });
// set port
app.listen(process.env.PORT || 5000, function() {
    console.log("Server started.......");
});
module.exports = app;