var express = require('express');
var app = express();
var mysql = require('mysql');
var cors = require('cors')
const crypto = require("crypto");
const session = require('express-session');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const client  = redis.createClient();
const router = express.Router();
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
dbConn.connect(); 
app.use(session({
    secret: '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',
    store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
    saveUninitialized: false,
    resave: false
}));
/* app.use((req, res, next) => {
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
router.post('/login',(req,res) => {
    let usuario_email = req.body.email;
    var usuario_nome;
    var usuario_timestamp;
    var usuario_foto;
    dbConn.query('SELECT `nome` FROM usuario where id=?', usuario_id, function (error, results, fields) {
        if (error) throw error;
        usuario_nome = results[0].nome;
        usuario_timestamp = results[0].date;
        usuario_foto = results[0].image||null;
        });
    var str = usuario_nome+usuario_email;
    var datb = usuario_timestamp+str;
    const secret = "KNq72SajoZ2mNtzpBuCxo1ANOYKr7wllYAOzTL7fAZQgrwdHnl2gwizXShYQEBiB1QqC5sdsEkXum0jaWtIwcz57d1l9zGACI68HgPHwENbAdZejG1LlB3XdGyGJE7hEVNVAjF2ByiMoFExmDwQiITsFNPR78MKHXGPpmjPGVjtZ1ShrG3nZpkq7dWfDpmmriGHp0jJI";
    const md5Hasher = crypto.createHmac("md5", secret);
    const hash =  md5Hasher.update(datb).digest("hex");
 
    if(hash==req.body.hash){
        req.session.email = req.body.email;
        req.session.nome = usuario_nome;
        req.session.foto = usuario_foto;
        res.end('Pronto!');
    }else{
        res.end('Erro, usuário não encontrado');
    }
    
});
router.post('/usuario/', function (req, res) {
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
router.post('/post/', function (req, res) {
    
    dbConn.query('SELECT * FROM post ORDER BY id DESC', function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results });
    });
    });
router.post('/addpost/', function (req, res) {
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
router.post('/gerarhash/', function (req, res) {
    let usuario_nome = req.body.nome;
    let usuario_email = req.body.email;
    var str = usuario_nome+usuario_email;
    var data = new Date();
    const time = data.getTime();
    var datb = time+str;
    const secret = "KNq72SajoZ2mNtzpBuCxo1ANOYKr7wllYAOzTL7fAZQgrwdHnl2gwizXShYQEBiB1QqC5sdsEkXum0jaWtIwcz57d1l9zGACI68HgPHwENbAdZejG1LlB3XdGyGJE7hEVNVAjF2ByiMoFExmDwQiITsFNPR78MKHXGPpmjPGVjtZ1ShrG3nZpkq7dWfDpmmriGHp0jJI";
    const md5Hasher = crypto.createHmac("md5", secret);
    const hash =  md5Hasher.update(datb).digest("hex");
    if ((!usuario_nome)) {
    return res.status(400).send({ error: true, message:'informe um nome de usuário'});
    }else if((!usuario_email)){
        return res.status(400).send({ error: true, message:'informe um email'});
    }
    var querys = "INSERT INTO usuario(`nome`,`email`,`date`) values('"+usuario_nome+ "','"+usuario_email+"','"+time+"') ";
    dbConn.query(querys, function (error){
    if (error) throw error;
        return res.send({ error: false, data: hash,message:"Ok."});
    });
    });

router.post('/login/', function (req, res) {
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
app.use('/', router);
app.listen(process.env.PORT || 5000, function() {
    console.log("Server started.......");
});

module.exports = app;