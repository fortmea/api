var express = require('express');
var app = express();
var mysql = require('mysql');
var cors = require('cors')
const crypto = require("crypto");
const secret = process.env.secret;
const redis_host = process.env.redis_host;
const redis_password = process.env.redis_pwd;
const website = process.env.website;
const email_server = process.env.email;
const admin = process.env.admin;
const email_pass = process.env.email_pass;
/*const session = require('express-session');
const router = express.Router();*/
const redis = require('redis');
//const redisStore = require('connect-redis')(session);
const client = redis.createClient({
    port      : 6379,               // replace with your port
    host      : redis_host,        // replace with your hostanme or IP address
    password  : redis_password,    // replace with your password
});

const nodemailer = require('nodemailer');
app.use(express.urlencoded({extended:true,limit:'25mb'}));
app.use(express.json({limit: '25mb'}));
app.use(cors());
app.get('/', function (req, res) {
return res.send({ error: true, message: 'hello' })
});
var dbConn = mysql.createConnection({
    host: process.env.host,
    user: process.env.db_user,
    password: process.env.db_pwd,
    database: process.env.db_name
});
dbConn.connect(); 
/*app.use(session({
    secret:process.env.secret ,
    store: new redisStore({ host: 'joaowalteramadeu.me', port: 6379, password: redis_password, client: client,ttl : 260}),
    saveUninitialized: false,
    resave: false
}));*/
app.post('/login/',(req,res) => {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    var usuario_nome;
    var usuario_timestamp;
    var usuario_foto;
    dbConn.query('SELECT * FROM `usuario` where `email`=?',usuario_email, function (error, results, fields) {
         if (error) {
           return res.status(500).send({message:'erro interno' });
        }
        if(results[0]){
        usuario_nome = results[0].nome;
        usuario_timestamp = results[0].date;
        usuario_foto = results[0].image||null;
        console.log(usuario_timestamp);
        var str = usuario_nome+usuario_email;
        var datb = usuario_timestamp+str;
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
});



//procurar nome de usuário por ID
app.post('/usuario/', function (req, res) {
let usuario_id = req.body.id;
if (!usuario_id) {
return res.status(400).send({ error: true, message: 'Informe um nome de usuário!' });
}
dbConn.query('SELECT * FROM usuario where id=?', usuario_id, function (error, results, fields) {
 if (error) {
           return res.status(500).send({message:'erro interno' });
        }
if(results[0]){
return res.send({ error: false, data: results[0], message: 'Ok.' });
}else{
    return res.send({ error: true, data: "Não encontrado!", message: 'Usuário não encontrado.' });  
}
});
});

//Carregar postagens
app.post('/post/', function (req, res) {
    dbConn.query('SELECT * FROM post ORDER BY id DESC', function (error, results, fields) {
     if (error) {
           return res.status(500).send({message:'erro interno' });
        }
    return res.send({ error: false, data: results });
    });
    });
app.post('/userpost/', function (req, res) {
    dbConn.query('SELECT * FROM post WHERE `autor` = ? ORDER BY id DESC',req.body.uid, function (error, results, fields) {
         if (error) {
           return res.status(500).send({message:'erro interno' });
        }
        return res.send({ error: false, data: results });
    });
});

//adicionar postagem
app.post('/addpost/', function (req, res) {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    var usuario_nome;
    var usuario_timestamp;
    var usuario_foto;
    var usuario_confirmado;
    dbConn.query('SELECT * FROM `usuario` where `email`=?',usuario_email, function (error, results, fields) {
         if (error) {
           return res.status(500).send({message:'erro interno' });
        }
            if(results[0]){
                usuario_nome = results[0].nome;
                usuario_timestamp = results[0].date;
                usuario_foto = results[0].image||null;
                usuario_confirmado = results[0].confirmado;
                usuario_level = results[0].level;
                console.log(usuario_timestamp);
                var str = usuario_nome+usuario_email;
                var datb = usuario_timestamp+str;
                const md5Hasher = crypto.createHmac("md5", secret);
                const hash =  md5Hasher.update(datb).digest("hex");
                if(usuario_confirmado==1){
                    if(usuario_level!=1){
                        return res.send({error:'true',data:"Usuário não tem permissão para fazer publicações!<br>Caso discorde disso, entre em contato em <a href='mailto:suporte@"+email_server+"'>suporte@"+email_server+"</a> ou <a href='mailto:"+admin+"@"+email_server+"'>"+admin+"@"+email_server+"</a>."});
                    }else{
            if((hash==usuario_hash)){
                const today = new Date();
                const day = today.getDate();
                const month = today.getMonth();
                const year = today.getFullYear();  
                let data1 = year +'-'+(month+1)+'-'+day;
                dbConn.query("INSERT INTO `post`(`nome`,`conteudo`,`data`,`autor`,`resumo`) Values(?,?,?,?,?)",[req.body.titulo, req.body.conteudo,data1,results[0].id, req.body.subtitulo], function (error, results, fields) {
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
         if (error) {
           return res.status(500).send({message:'erro interno' });
        }
            if(results[0]){
                usuario_nome = results[0].nome;
                usuario_timestamp = results[0].date;
                usuario_confirmado = results[0].confirmado;

                console.log(usuario_timestamp);
                var str = usuario_nome+usuario_email;
                var datb = usuario_timestamp+str;
                const md5Hasher = crypto.createHmac("md5", secret);
                const hash =  md5Hasher.update(datb).digest("hex");
                if(usuario_confirmado==0){
            if((hash==usuario_hash)){
                let usuario_id = results[0].id;
                var query = 'UPDATE `db_web`.`usuario` SET `confirmado`="1" WHERE  `id`="'+usuario_id+'"';
                dbConn.query(query, function (error, results, fields) {
        if (error) {
           return res.status(500).send({message:'erro interno' });
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
    let imagem_usuario = req.body.imagem;
    var str = usuario_nome+usuario_email;
    var data = new Date();
    const time = data.getTime();
    var datb = time+str;
    const md5Hasher = crypto.createHmac("md5", secret);
    const hash =  md5Hasher.update(datb).digest("hex");
    if ((!usuario_nome)) {
    return res.status(400).send({ error: true, message:'informe um nome de usuário'});
    }else if((!usuario_email)){
        return res.status(400).send({ error: true, message:'informe um email'});
    }
    var queryv = "SELECT * FROM `usuario` WHERE email='"+usuario_email+"'";
    dbConn.query(queryv, function(error, results, fields){
     if (error) {
           return res.status(500).send({message:'erro interno' });
        }
    if(results[0]){
        return res.send({ error: true, data: "Usuário já existe!"});
    }else{
        
        dbConn.query("INSERT INTO usuario(`nome`,`email`,`date`,`image`) values(?,?,?,?)",[usuario_nome,usuario_email,time,imagem_usuario], function (error){
         if (error) {
           return res.status(500).send({message:'erro interno' });
        }
        let transporter = nodemailer.createTransport({
            host: 'mail.'+email_server,
            port: 465, 
            secure: true, 
            auth: {
               user: 'suporte',
               pass: email_pass 
            }
         });
         
         let mailOptions = {
            from: '"Suporte - Contas" <suporte@'+website+'>', 
            to: usuario_email, 
            subject: "Confirme seu endereço de email", 
            //text: emailData.text,
            html:"<p>Olá, "+usuario_nome+"!</p><br><h4>Confirme seu email no link abaixo:</h4><br><a href='https://"+website+"/confirmar.html'>Confirmar</a>" 
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
    for(var i = 0;i<50;i++){
        process.stdout.write(".");
    }
    console.log("\nServidor iniciado...");
    
});
client.on('connect', function() {
    console.log('connected');
});
module.exports = app;