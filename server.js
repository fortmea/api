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
// Add a new usuario  
app.post('/usuario', function (req, res) {
let usuario = req.body.usuario;
if (!usuario) {
return res.status(400).send({ error:true, message: 'Please provide usuario' });
}
dbConn.query("INSERT INTO usuario SET ? ", { usuario: usuario }, function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'New usuario has been created successfully.' });
});
});
//  Update usuario with id
app.put('/usuario', function (req, res) {
let usuario_id = req.body.usuario_id;
let usuario = req.body.usuario;
if (!usuario_id || !usuario) {
return res.status(400).send({ error: usuario, message: 'Please provide usuario and usuario_id' });
}
dbConn.query("UPDATE usuario SET usuario = ? WHERE id = ?", [usuario, usuario_id], function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'usuario has been updated successfully.' });
});
});
//  Delete usuario
app.delete('/usuario', function (req, res) {
let usuario_id = req.body.usuario_id;
if (!usuario_id) {
return res.status(400).send({ error: true, message: 'Please provide usuario_id' });
}
dbConn.query('DELETE FROM usuario WHERE id = ?', [usuario_id], function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results, message: 'usuario has been updated successfully.' });
});
}); 
// set port
app.listen(process.env.PORT || 5000, function() {
    console.log("Server started.......");
});
module.exports = app;