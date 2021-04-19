var express = require('express');
var app = express();
var mysql = require('mysql');
var cors = require('cors')
const crypto = require("crypto");
const secret = process.env.secret;
const redis_host = process.env.redis_host;
const redis_password = process.env.redis_pwd;
const website = process.env.website;
const email_server = process.env.email_server;
const admin = process.env.admin;
const email_pass = process.env.email_pass;
/*const session = require('express-session');
const router = express.Router();*/
const redis = require('redis');
//const redisStore = require('connect-redis')(session);
const client = redis.createClient({
    port: 6379,               // replace with your port
    host: redis_host,        // replace with your hostanme or IP address
    password: redis_password,    // replace with your password
});

const nodemailer = require('nodemailer');
const { request } = require('http');
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.json({ limit: '25mb' }));
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
    store: new redisStore({ host: 'redis_host', port: 6379, password: redis_password, client: client,ttl : 260}),
    saveUninitialized: false,
    resave: false
}));*/

//Login
app.post('/login/', function (req, res) {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    var usuario_timestamp;
    dbConn.query('SELECT * FROM `usuario` where `email`=?', usuario_email, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) {
            console.log(results[0].pwdate + "\n" + results[0].nome);
            usuario_timestamp = results[0].pwdate;
            var str = results[0].nome + usuario_email;
            var datb = usuario_timestamp + str;
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(datb).digest("hex");
            if (hash == usuario_hash) {
                var data = new Date();
                const time = data.getTime();
                var strb = results[0].nome + results[0].id;
                var hue = strb + time;
                const md5Hasher = crypto.createHmac("md5", secret);
                var sessionhash = md5Hasher.update(hue).digest("hex");
                let date_ob = new Date();
                let date = ("0" + date_ob.getDate()).slice(-2);
                let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                let year = date_ob.getFullYear();
                let hours = date_ob.getHours();
                let seconds = date_ob.getSeconds();
                let minutes = date_ob.getMinutes();
                var ip = req.header('x-forwarded-for') || req.remoteAddress;
                var instante = (date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds);
                res.send({ error: 'false', message: 'Logado com sucesso!', data: sessionhash });
                client.sadd([hash, results[0].id, ip, instante], function (err, reply) {
                    if(err){
                        res.send({error:'true', message:'Problema com o login<br>Erro interno.'});
                    }
                });
                client.expire(hash, 3600);

            } else {
                console.log("Login error!");
                res.send({ error: 'true', message: 'Erro no login!' });
            }
        } else {
            res.send({ error: 'true', message: 'Usuário não encontrado!' })
        }
    });
});
app.post('/logout/', function (req, res) {
    let sessionhash = req.body.session;
    client.del(sessionhash, function(err, reply) {
        if(err){
            return res.send({error:true, message:'Falha ao Finalizar sessão'});
        }
        return res.send({error:false});
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
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) {
            return res.send({ error: false, data: results[0], message: 'Ok.' });
        } else {
            return res.send({ error: true, data: "Não encontrado!", message: 'Usuário não encontrado.' });
        }
    });
});

//Carregar postagens
app.post('/post/', function (req, res) {
    dbConn.query('SELECT * FROM post ORDER BY id DESC', function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        return res.send({ error: false, data: results });
    });
});
app.post('/proj/', function (req, res) {
    dbConn.query('SELECT * FROM proj ORDER BY id DESC', function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        return res.send({ error: false, data: results });
    });
});
app.post('/userpost/', function (req, res) {
    dbConn.query('SELECT * FROM post WHERE `autor` = ? ORDER BY id DESC', req.body.uid, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
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
    var usuario_confirmado;
    dbConn.query('SELECT * FROM `usuario` where `email`=?', usuario_email, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) {
            usuario_nome = results[0].nome;
            usuario_timestamp = results[0].pwdate;
            usuario_confirmado = results[0].confirmado;
            usuario_level = results[0].level;
            console.log(usuario_timestamp);
            var str = usuario_nome + usuario_email;
            var datb = usuario_timestamp + str;
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(datb).digest("hex");
            if (usuario_confirmado == 1) {
                if (usuario_level != 1) {
                    return res.send({ error: 'true', data: "Usuário não tem permissão para fazer publicações!<br>Caso discorde disso, entre em contato em <a href='mailto:suporte@" + email_server + "'>suporte@" + email_server + "</a> ou <a href='mailto:" + admin + "@" + email_server + "'>" + admin + "@" + email_server + "</a>." });
                } else {
                    if ((hash == usuario_hash)) {
                        const today = new Date();
                        const day = today.getDate();
                        const month = today.getMonth();
                        const year = today.getFullYear();
                        let data1 = year + '-' + (month + 1) + '-' + day;
                        dbConn.query("INSERT INTO `post`(`nome`,`conteudo`,`data`,`autor`,`resumo`) Values(?,?,?,?,?)", [req.body.titulo, req.body.conteudo, data1, results[0].id, req.body.subtitulo], function (error, results, fields) {
                            if (error) {
                                throw error;
                            }
                            return res.send({ error: 'false', data: "Post adicionado com sucesso!" });
                        })
                    } else {
                        return res.send({ error: 'true', data: "Informações de login incorretas!" });
                    }
                }
            } else {
                return res.send({ error: 'true', data: "Usuário não confirmado. Por favor, verifique seu email e tente novamente!" });
            }
        } else {
            return res.send({ error: 'true', data: "Usuário não encontrado!" });
        }
    })
});
app.post('/addproj/', function (req, res) {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    var usuario_nome;
    var usuario_timestamp;
    var usuario_confirmado;
    dbConn.query('SELECT * FROM `usuario` where `email`=?', usuario_email, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) {
            usuario_nome = results[0].nome;
            usuario_timestamp = results[0].pwdate;
            usuario_foto = results[0].image || null;
            usuario_confirmado = results[0].confirmado;
            usuario_level = results[0].level;
            //console.log(usuario_timestamp);
            var str = usuario_nome + usuario_email;
            var datb = usuario_timestamp + str;
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(datb).digest("hex");
            if (usuario_confirmado == 1) {
                if (usuario_level != 1) {
                    return res.send({ error: 'true', data: "Usuário não tem permissão para adicionar projetos!<br>Caso discorde disso, entre em contato em <a href='mailto:suporte@" + email_server + "'>suporte@" + email_server + "</a> ou <a href='mailto:" + admin + "@" + email_server + "'>" + admin + "@" + email_server + "</a>." });
                } else {
                    if ((hash == usuario_hash)) {
                        const today = new Date();
                        const day = today.getDate();
                        const month = today.getMonth();
                        const year = today.getFullYear();
                        let data1 = year + '-' + (month + 1) + '-' + day;
                        dbConn.query("INSERT INTO `proj`(`nome`,`conteudo`,`data`,`autor`,`resumo`,`addr`) Values(?,?,?,?,?,?)", [req.body.titulo, req.body.conteudo, data1, results[0].id, req.body.subtitulo, req.body.addr], function (error, results, fields) {
                            if (error) {
                                throw error;
                            }
                            return res.send({ error: 'false', data: "Projeto adicionado com sucesso!" });
                        })
                    } else {
                        return res.send({ error: 'true', data: "Informações de login incorretas!" });
                    }
                }
            } else {
                return res.send({ error: 'true', data: "Usuário não confirmado. Por favor, verifique seu email e tente novamente!" });
            }
        } else {
            return res.send({ error: 'true', data: "Usuário não encontrado!" });
        }
    })
});

//confirmar conta de usuário
app.post('/confirmar/', function (req, res) {
    let usuario_email = req.body.email;
    let usuario_hash = req.body.hash;
    if ((usuario_email) && (usuario_hash)) {
        var usuario_nome;
        var usuario_timestamp;
        var usuario_confirmado;
        dbConn.query('SELECT * FROM `usuario` where `email`=?', usuario_email, function (error, results, fields) {
            if (error) {
                return res.status(500).send({ message: 'erro interno' });
            }
            if (results[0]) {
                usuario_nome = results[0].nome;
                usuario_timestamp = results[0].pwdate;
                usuario_confirmado = results[0].confirmado;

                //console.log(usuario_timestamp);
                var str = usuario_nome + usuario_email;
                var datb = usuario_timestamp + str;
                const md5Hasher = crypto.createHmac("md5", secret);
                const hash = md5Hasher.update(datb).digest("hex");
                if (usuario_confirmado == 0) {
                    if ((hash == usuario_hash)) {
                        let usuario_id = results[0].id;
                        var query = 'UPDATE `db_web`.`usuario` SET `confirmado`="1" WHERE  `id`="' + usuario_id + '"';
                        dbConn.query(query, function (error, results, fields) {
                            if (error) {
                                return res.status(500).send({ message: 'erro interno' });
                            }
                            return res.send({ error: 'false', data: "Usuário confirmado com sucesso!" });
                        })
                    } else {
                        return res.send({ error: 'true', data: "Código hash incorreto!" });
                    }
                } else {
                    return res.send({ error: 'true', data: "Usuário já confirmado!" });
                }
            } else {
                return res.send({ error: 'true', data: "Usuário não encontrado!" });
            }
        });
    } else {
        return res.send({ error: 'true', data: "Informe nome de usuário e email!" });
    }
});
app.post('/passwordrequest', function (req, res) {
    let usuario_email = req.body.email;
    var queryv = "SELECT * FROM `usuario` WHERE email='" + usuario_email + "'";
    dbConn.query(queryv, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (!results[0]) {
            return res.send({ error: true, data: "Usuário não encontrado!" });
        } else {
            var data = new Date();
            const time = data.getTime();
            var datb = time + results[0].pwdate;
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(datb).digest("hex");
            dbConn.query("INSERT INTO pcr(`id`,`id_usuario`) values(?,?)", [hash, results[0].id], function (error) {
                if (error) {
                    return res.status(500).send({ message: 'erro interno' });
                }
                let transporter = nodemailer.createTransport({
                    host: 'mail.' + email_server,
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'suporte',
                        pass: email_pass
                    }
                });

                let mailOptions = {
                    from: '"Suporte - Contas" <suporte@' + website + '>',
                    to: usuario_email,
                    subject: "Solicitação de alteração de senha",
                    //text: emailData.text,
                    html: `<p>Olá, ` + results[0].nome + `!</p><br><h4>Seu link para fazer a alteração:</h4><br><a href='https://` + website + `/senha.html?pc=` + hash + `'>Mudar minha senha</a><br>
                    <h4 style='color:orangered'>Caso não consiga clicar no link acima, copie o link: </h4><br><h4 style='color:blue'>https://` + website + `/novasenha.html?pc=` + hash + `</h4><br>
                    <h4>Caso não tenha solicitado uma alteração na sua senha, apenas ignore o email.</h4>
                    `
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error.message);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
                return res.send({ error: false, data: "Email com link de alteração de senha enviado com sucesso!", message: "Ok." });
            });
        }
    });
});
app.post('/changepassword', function (req, res) {
    let request_id = req.body.request_id;
    var queryv = "SELECT * FROM `pcr` WHERE id='" + request_id + "'";
    dbConn.query(queryv, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (!results[0]) {
            return res.send({ error: true, data: "Link inválido!<br>Talvez você já tenha usado-o. Caso queira gerar uma nova senha,<br>faça uma nova soliciatação e verifique seu email." });
        } else {
            var data = new Date();
            const time = data.getTime();
            const dtime = time;
            dbConn.query("UPDATE usuario SET `pwdate` = ? where `id` = ?", [time, results[0].id_usuario], function (error) {
                if (error) {
                    return res.status(500).send({ error: true, message: 'Erro interno. Não Foi possível alterar sua senha.' });
                }
                dbConn.query("SELECT `nome`, `email` from `usuario` where `id` = ?", results[0].id_usuario, function (error, resultsw) {
                    var str = resultsw[0].nome + resultsw[0].email;
                    var datb = dtime + str;
                    const md5Hasher = crypto.createHmac("md5", secret);
                    const hash = md5Hasher.update(datb).digest("hex");
                    dbConn.query("DELETE from pcr where `id_usuario` = ?", results[0].id_usuario, function (error) { });
                    return res.send({ error: false, data: "Sucesso!<br>Sua nova senha é:<br><b>" + hash + "</b>", message: "Ok." });
                });

            }
            );
        }
    });
});

//registrar novo usuário
app.post('/register/', function (req, res) {
    let usuario_nome = req.body.nome;
    let usuario_email = req.body.email;
    let imagem_usuario = req.body.imagem;
    var str = usuario_nome + usuario_email;
    var data = new Date();
    const time = data.getTime();
    var datb = time + str;
    const md5Hasher = crypto.createHmac("md5", secret);
    const hash = md5Hasher.update(datb).digest("hex");
    if ((!usuario_nome)) {
        return res.status(400).send({ error: true, message: 'informe um nome de usuário' });
    } else if ((!usuario_email)) {
        return res.status(400).send({ error: true, message: 'informe um email' });
    }
    var queryv = "SELECT * FROM `usuario` WHERE email='" + usuario_email + "'";
    dbConn.query(queryv, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) {
            return res.send({ error: true, data: "Usuário já existe!" });
        } else {

            dbConn.query("INSERT INTO usuario(`nome`,`email`,`pwdate`,`image`) values(?,?,?,?)", [usuario_nome, usuario_email, time, imagem_usuario], function (error) {
                if (error) {
                    return res.status(500).send({ message: 'erro interno' });
                }
                let transporter = nodemailer.createTransport({
                    host: 'mail.' + email_server,
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'suporte',
                        pass: email_pass
                    }
                });

                let mailOptions = {
                    from: '"Suporte - Contas" <suporte@' + website + '>',
                    to: usuario_email,
                    subject: "Confirme seu endereço de email",
                    //text: emailData.text,
                    html: "<p>Olá, " + usuario_nome + "!</p><br><h4>Confirme seu email no link abaixo:</h4><br><a href='https://" + website + "/confirmar.html'>Confirmar</a>"
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error.message);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
                return res.send({ error: false, data: hash, message: "Ok." });
            });
        }
    });
});

app.listen(process.env.PORT || 5000, function () {
    for (var i = 0; i < 50; i++) {
        process.stdout.write(".");
    }
    console.log("\nServidor iniciado...");

});
client.on('connect', function () {
    console.log('connected');
});
module.exports = app;