var express = require('express');
var app = express();
var mysql = require('mysql');
var cors = require('cors')
const crypto = require("crypto");
/*const session = require('express-session');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const client  = redis.createClient();
const router = express.Router();*/
//var qs = require('querystring');
const nodemailer = require('nodemailer');
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.get('/', function (req, res) {
return res.send({ error: true, message: 'hello' })
});
var dbConn = mysql.createConnection({
    host: '68.183.126.19',
    user: 'joaoi',
    password: 'Leitecomcafe',
    database: 'db_web'
});
dbConn.connect(); 
/*app.use(session({
    secret: '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',
    store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl : 260}),
    saveUninitialized: false,
    resave: false
}));
/* app.use((req, res, next) => {
    let validIps = ['::12', '127.0.0.1','::1','68.183.126.19']; // Put your IP whitelist in this array
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
    })
    
app.post('/login/',(req,res) => {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    var usuario_nome;
    var usuario_timestamp;
    var usuario_foto;
    dbConn.query('SELECT * FROM `usuario` where `email`=?',usuario_email, function (error, results, fields) {
        if (error) throw error;
        if(results[0]){
        usuario_nome = results[0].nome;
        usuario_timestamp = results[0].date;
        usuario_foto = results[0].image||null;
        console.log(usuario_timestamp);
        var str = usuario_nome+usuario_email;
        var datb = usuario_timestamp+str;
        const secret = "KNq72SajoZ2mNtzpBuCxo1ANOYKr7wllYAOzTL7fAZQgrwdHnl2gwizXShYQEBiB1QqC5sdsEkXum0jaWtIwcz57d1l9zGACI68HgPHwENbAdZejG1LlB3XdGyGJE7hEVNVAjF2ByiMoFExmDwQiITsFNPR78MKHXGPpmjPGVjtZ1ShrG3nZpkq7dWfDpmmriGHp0jJI";
        const md5Hasher = crypto.createHmac("md5", secret);
        const hash =  md5Hasher.update(datb).digest("hex");
        console.log(hash);
        if(hash==usuario_hash){
            //req.session.email = req.body.email;
            //req.session.nome = usuario_nome;
            //req.session.foto = usuario_foto;
            console.log('Login successful');
            res.send({error: 'false',data:'Logado com sucesso!'});
        }else{
            console.log("Login error!");
            res.send({error:'true',data:'Erro no login!'});
        }
    }else{
        res.send({error:'true',data:'usuário não encontrado!'})
    }
        });
});*/



//procurar nome de usuário por ID
app.post('/usuario/', function (req, res) {
let usuario_id = req.body.id;
if (!usuario_id) {
return res.status(400).send({ error: true, message: 'Informe um nome de usuário!' });
}
dbConn.query('SELECT `nome` FROM usuario where id=?', usuario_id, function (error, results, fields) {
if (error) throw error;
return res.send({ error: false, data: results[0], message: 'Ok.' });
});
});

//Carregar postagens
app.post('/post/', function (req, res) {
    
    dbConn.query('SELECT * FROM post ORDER BY id DESC', function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results });
    });
    });
app.post('/addpost/', function (req, res) {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    var usuario_nome;
    var usuario_timestamp;
    var usuario_foto;
    var usuario_confirmado;
    dbConn.query('SELECT * FROM `usuario` where `email`=?',usuario_email, function (error, results, fields) {
        if (error) throw error;
            if(results[0]){
                usuario_nome = results[0].nome;
                usuario_timestamp = results[0].date;
                usuario_foto = results[0].image||null;
                usuario_confirmado = results[0].confirmado;
                usuario_level = results[0].level;
                console.log(usuario_timestamp);
                var str = usuario_nome+usuario_email;
                var datb = usuario_timestamp+str;
                const secret = "KNq72SajoZ2mNtzpBuCxo1ANOYKr7wllYAOzTL7fAZQgrwdHnl2gwizXShYQEBiB1QqC5sdsEkXum0jaWtIwcz57d1l9zGACI68HgPHwENbAdZejG1LlB3XdGyGJE7hEVNVAjF2ByiMoFExmDwQiITsFNPR78MKHXGPpmjPGVjtZ1ShrG3nZpkq7dWfDpmmriGHp0jJI";
                const md5Hasher = crypto.createHmac("md5", secret);
                const hash =  md5Hasher.update(datb).digest("hex");
                if(usuario_confirmado==1){
                    if(usuario_level!=1){
                        return res.send({error:'true',data:"Usuário não tem permissão para fazer publicação!"});
                    }else{
            if((hash==usuario_hash)){
                let autor = results[0].id;
                let conteudo = req.body.conteudo;
                let nome = req.body.titulo;
                let subtitulo = req.body.subtitulo;
                const today = new Date();
                const day = today.getDate();
                const month = today.getMonth();
                const year = today.getFullYear();  
                var dataf = year +'-'+(month+1)+'-'+day;
                var query = 'INSERT INTO `post`(`nome`,`conteudo`,`data`,`autor`,`resumo`) Values("'+nome+'","'+conteudo+'","'+dataf+'","'+autor+'","'+subtitulo+'")';
                dbConn.query(query, function (error, results, fields) {
        if (error) {
            throw error;
        }
            return res.send({ error: 'false',data:"Post adicionado com sucesso!"});
        })
}else{
    return res.send({ error: 'true',data:"Informações de login incorretas!"});
}
}
}else{
    return res.send({ error: 'true',data:"Usuário não confirmado. Por favor, verifique seu email e tente novamente!"});
}
}else{
    return res.send({ error: 'true',data:"Usuário não encontrado!"});
}})
});


//confirmar conta de usuário
app.post('/confirmar/',function(req,res){
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    if((usuario_email)&&(usuario_hash)){
    var usuario_nome;
    var usuario_timestamp;
    var usuario_confirmado;
    dbConn.query('SELECT * FROM `usuario` where `email`=?',usuario_email, function (error, results, fields) {
        if (error) throw error;
            if(results[0]){
                usuario_nome = results[0].nome;
                usuario_timestamp = results[0].date;
                usuario_confirmado = results[0].confirmado;

                console.log(usuario_timestamp);
                var str = usuario_nome+usuario_email;
                var datb = usuario_timestamp+str;
                const secret = "KNq72SajoZ2mNtzpBuCxo1ANOYKr7wllYAOzTL7fAZQgrwdHnl2gwizXShYQEBiB1QqC5sdsEkXum0jaWtIwcz57d1l9zGACI68HgPHwENbAdZejG1LlB3XdGyGJE7hEVNVAjF2ByiMoFExmDwQiITsFNPR78MKHXGPpmjPGVjtZ1ShrG3nZpkq7dWfDpmmriGHp0jJI";
                const md5Hasher = crypto.createHmac("md5", secret);
                const hash =  md5Hasher.update(datb).digest("hex");
                if(usuario_confirmado==0){
            if((hash==usuario_hash)){
                let usuario_id = results[0].id;
                var query = 'UPDATE `db_web`.`usuario` SET `confirmado`="1" WHERE  `id`="'+usuario_id+'"';
                dbConn.query(query, function (error, results, fields) {
        if (error) {
            throw error;
        }
            return res.send({ error: 'false',data:"Usuário confirmado com sucesso!"});
        })
}else{
    return res.send({ error: 'true',data:"Código hash incorreto!"});
}
}else{
    return res.send({ error: 'true',data:"Usuário já confirmado!"});
}
}else{
    return res.send({ error: 'true',data:"Usuário não encontrado!"});
}
});
}else{
    return res.send({ error: 'true',data:"Informe nome de usuário e email!"});
}
});


//registrar novo usuário
app.post('/register/', function (req, res) {
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
    var queryv = "SELECT * FROM `usuario` WHERE email='"+usuario_email+"'";
    dbConn.query(queryv, function(error, results, fields){
    if (error) throw error;
    if(results[0]){
        return res.send({ error: true, data: "Usuário já existe!"});
    }else{
        var querys = "INSERT INTO usuario(`nome`,`email`,`date`) values('"+usuario_nome+ "','"+usuario_email+"','"+time+"') ";
        dbConn.query(querys, function (error){
        if (error) throw error;
        let transporter = nodemailer.createTransport({
            host: 'mail.piroca.ninja',
            port: 465, 
            secure: true, 
            auth: {
               user: 'suporte',
               pass: 'suportesuporte' 
            }
         });
         
         let mailOptions = {
            from: "suporte@joaowalteramadeu.me", 
            to: usuario_email, 
            subject: "Confirme seu endereço de email", 
            //text: emailData.text,
            html:"<p>Olá, "+usuario_nome+"!</p><br><h4>Confirme seu email no link abaixo:</h4><br><a href='https://joaowalteramadeu.me/confirmar.html'>Confirmar</a>" 
         };
         
         // send mail with defined transport object
         transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
               return console.log(error.message);
            }
            console.log('Message sent: %s', info.messageId);
         });
            return res.send({ error: false, data: hash,message:"Ok."});
        });
    }
    });    
});

app.listen(process.env.PORT || 5000, function() {
    console.log("Server started.......");
});

module.exports = app;