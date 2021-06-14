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
const redis = require('redis');
//const redisStore = require('connect-redis')(session);
const client = redis.createClient({
    port: 6379, // replace with your port
    host: redis_host, // replace with your hostanme or IP address
    password: redis_password, // replace with your password
});

const nodemailer = require('nodemailer');
const session = require('express-session');
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
    let usuario_senha = req.body.senha;
    dbConn.query('SELECT * FROM `usuario` where `email`=?', usuario_email, function (error, results, fields) { //Procura usuário no banco de dados
        if (error) {
            return res.status(500).send({ message: 'erro interno' }); //Retorna erro no servidor, evita crash caso haja problema com o banco de dados
        }
        if (results[0]) { //caso haja usuário cadastrado com o email informado
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(usuario_senha).digest("hex"); //gera hash do usuário
            if (hash == results[0].pw) {
                var ip = req.header('x-forwarded-for') || req.remoteAddress; //pega ip do usuário
                var data = new Date();
                const time = data.getTime();
                var strb = results[0].nome + results[0].id;
                var hue = strb + time;
                const md5Hasher = crypto.createHmac("md5", secret);
                var sessionhash = md5Hasher.update(hue).digest("hex"); //gera hash da sessão
                var data = new Date();
                data.setSeconds(0, 0);
                var stamp = data.toISOString().replace(/T/, " ").replace(/:00.000Z/, "");
                stamp = stamp.replace("00:00", "");
                res.send({ error: 'false', message: 'Logado com sucesso!', data: sessionhash });
                client.sadd([sessionhash, "id_" + results[0].id, ip, stamp, "level@" + results[0].level], function (err, reply) { //cria sessão no servidor redis
                    if (err) { //caso haja erro com o servidor redis:
                        res.send({ error: 'true', message: '<br>Erro interno.' });
                    }
                });
                client.expire(sessionhash, 3600); //define duração de uma hora para uma sessão

            } else { //caso o hash gerado seja diferente do que o usuário informou:
                console.log("Login error!");
                res.send({ error: 'true', message: '<br>Senha incorreta' });
            }
        } else { //caso usuário não seja encontrado:
            res.send({ error: 'true', message: '<br>Usuário não encontrado!' })
        }
    });
});
//Logout
app.post('/logout/', function (req, res) {
    let sessionhash = req.body.session; //recebe hash da sessão
    client.del(sessionhash, function (err, reply) { //deleta sessão
        if (err) { //caso erro:
            return res.send({ error: true, message: 'Falha ao Finalizar sessão' });
        }
        return res.send({ error: false }); //envia sinal para deletar cookies e redirecionar usuário
    });
});
//Pega dados da sessão
app.post('/sessiondata', function (req, res) {
    let sessionhash = req.body.session; //recebe hash da sessão
    client.smembers(sessionhash, function (err, reply) { //recebe objeto com os membros do set
        if (err) {
            console.log(err);
            return res.status(500);
        }
        if (reply) { //caso haja erro:
            if (!reply[0]) {
                return res.send({ error: true, message: "Sessão não encontrada", data: "undo" });
            } else {
                return res.send({ error: false, data: reply }); //envia objeto com os membros do set
            }
        }

    });
});
//procurar nome de usuário por ID
app.post('/usuario/', function (req, res) {
    let usuario_id = req.body.id; //recebe id do usuário
    if (!usuario_id) { //se id for vazio:
        return res.status(400).send({ error: true, message: 'Informe um nome de usuário!' });
    }
    dbConn.query('SELECT * FROM usuario where id=?', usuario_id, function (error, results, fields) { //query para buscar os dados do usuário no banco de dados mysql
        if (error) { //se ocorrer erro, retorna. evita crash no servidor.
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) { //caso encontre um usuário com o id informado:
            return res.send({ error: false, data: results[0], message: 'Ok.' }); //envia objeto com os dados do usuário
        } else { //caso não encontre:
            return res.send({ error: true, data: "Não encontrado!", message: 'Usuário não encontrado.' }); //informa que não foi encontrado
        }
    });
});

//Carregar postagens
app.post('/post/', function (req, res) {
    dbConn.query('SELECT * FROM post WHERE visibilidade = 1 ORDER BY id DESC', function (error, results, fields) { //seleciona todas as postagens
        if (error) { //caso ocorra erro:
            return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
        }
        return res.send({ error: false, data: results }); //envia objeto com as postagens
    });
});
//Carregar postagem específica
app.post('/uniquepost/', function (req, res) {
    console.log(req.body.id);
    if ((req.body.id != null) && (req.body.id != "")) {
        dbConn.query('SELECT * FROM post WHERE id = ?', req.body.id, function (error, results, fields) { //seleciona todas as postagens
            if (error) { //caso ocorra erro:
                return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
            }
            if (results) {
                return res.send({ error: false, data: results[0] }); //envia objeto com a postagem
            } else {
                return res.send({ error: true }); //envia mensagem de erro
            }
        });
    } else {
        return res.send({ error: true }); //envia mensagem de erro
    }
});
//Carrega projetos, mesmo funcionamento que o /post
app.post('/proj/', function (req, res) {
    dbConn.query('SELECT * FROM proj ORDER BY id DESC', function (error, results, fields) { //seleciona todos os projetos
        if (error) { //caso erro:
            return res.status(500).send({ message: 'erro interno' }); //evia mensagem de erro
        }
        return res.send({ error: false, data: results }); //envia objeto com os projetos.
    });
});
//Carrega postagens de um determinado usuário
app.post('/userpost/', function (req, res) {
    let sessionhash = req.body.session || 0; //recebe hash da sessão
    client.smembers(sessionhash, function (err, reply) { //recebe objeto com os membros do set
        if (err) {
            console.log(err);
            return res.status(500);
        }
        if (reply) { //caso haja erro:
            if (!reply[0]) {
                dbConn.query('SELECT * FROM post WHERE `autor` = ? ORDER BY id DESC', req.body.uid, function (error, results, fields) { //seleciona todos os posts de um determinado usuário com base no id
                    if (error) { //caso haja erro:
                        return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
                    }
                    return res.send({ error: false, data: results, is_owner: false }); //envia objeto com as postagens do usuário
                });
            } else {
                dbConn.query('SELECT * FROM post WHERE `autor` = ? ORDER BY id DESC', req.body.uid, function (error, results, fields) { //seleciona todos os posts de um determinado usuário com base no id
                    if (error) { //caso haja erro:
                        return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
                    }
                    for (var i = 0; i < reply.length; i++) {
                        if (reply[i].indexOf('_') > 0) {
                            let id = reply[i].split("_").pop();
                            if (req.body.uid == id) {
                                return res.send({ error: false, data: results, is_owner: true }); //envia objeto com as postagens do usuário
                            } else {
                                return res.send({ error: false, data: results, is_owner: false }); //envia objeto com as postagens do usuário
                            }
                        }
                    }
                });
            }
        }

    });

});
//adicionar postagem
app.post('/addpost/', function (req, res) {
    let session_hash = req.body.session; //|recebe o hash da sessão
    var usuario_id;
    client.smembers(session_hash, function (err, reply) {
        if (err) {
            return res.status(500).send({ message: 'erro interno' });
        }
        for (var i = 0; i < reply.length; i++) {
            if (reply[i].indexOf('_') > 0) {
                usuario_id = reply[i].split("_").pop();
            }
        }
        dbConn.query('SELECT `confirmado`,`level` FROM `usuario` where `id`=?', usuario_id, function (error, results, fields) { //seleciona as informações do usuário
            if (error) { //caso haja erro:
                return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
            }
            if (results[0]) {
                var usuario_confirmado = results[0].confirmado; //|insere as informações obtidas do Banco de Dados MySql
                var usuario_level = results[0].level; //|
                console.log(usuario_level);
                if (usuario_confirmado == 1) { //caso usuário seja confirmado:
                    if (usuario_level < 1) { //caso o usuário não tenha permissão para postar:
                        return res.send({ error: 'true', data: "Usuário não tem permissão para fazer publicações!<br>Caso discorde disso, entre em contato em <a href='mailto:suporte@" + email_server + "'>suporte@" + email_server + "</a> ou <a href='mailto:" + admin + "@" + email_server + "'>" + admin + "@" + email_server + "</a>." });
                    } else { //caso tenha permissão para postar:
                        const today = new Date();
                        const day = today.getDate();
                        const month = today.getMonth();
                        const year = today.getFullYear();
                        let data1 = year + '-' + (month + 1) + '-' + day; //data da postagem
                        dbConn.query("INSERT INTO `post`(`nome`,`conteudo`,`data`,`autor`,`resumo`) Values(?,?,?,?,?)", [req.body.titulo, req.body.conteudo, data1, usuario_id, req.body.subtitulo], function (error, results, fields) { //insere a postagem no banco de dados
                            if (error) { //caso haja erro:
                                return res.send({ error: 'true', data: "Erro interno" }); //envia mensagem de erro
                            }
                            return res.send({ error: 'false', data: "Post adicionado com sucesso!", pid: results.insertId }); //envia mensagem de sucesso;
                        })
                    }
                } else {
                    return res.send({ error: 'true', data: "Usuário não confirmado. Por favor, verifique seu email e tente novamente!" }); //Pede para o usuário verificar email
                }
            } else {
                return res.send({ error: 'true', data: "Usuário não encontrado!" }); //Envia mensagem informando que o usuário informou um email incorreto
            }
        })
    });
});
//adicionar projeto, função idêntica à /addpost, porem com suporte a link do projeto em questão
app.post('/addproj/', function (req, res) {
    let session_hash = req.body.session; //|recebe o hash da sessão
    var usuario_id;
    client.smembers(session_hash, function (err, reply) {
        if (err) {
            return res.status(500).send({ message: 'erro interno' });
        }
        for (var i = 0; i < reply.length; i++) {
            if (reply[i].indexOf('_') > 0) {
                usuario_id = reply[i].split("_").pop();
            }
        }
        dbConn.query('SELECT `confirmado`,`level` FROM `usuario` where `id`=?', usuario_id, function (error, results, fields) {
            if (error) {
                return res.status(500).send({ message: 'erro interno' });
            }
            if (results[0]) {
                var usuario_confirmado = results[0].confirmado;
                var usuario_level = results[0].level;
                if (usuario_confirmado == 1) {
                    if (usuario_level != 1) {
                        return res.send({ error: 'true', data: "Usuário não tem permissão para adicionar projetos!<br>Caso discorde disso, entre em contato em <a href='mailto:suporte@" + email_server + "'>suporte@" + email_server + "</a> ou <a href='mailto:" + admin + "@" + email_server + "'>" + admin + "@" + email_server + "</a>." });
                    } else {
                        const today = new Date();
                        const day = today.getDate();
                        const month = today.getMonth();
                        const year = today.getFullYear();
                        let data1 = year + '-' + (month + 1) + '-' + day;
                        dbConn.query("INSERT INTO `proj`(`nome`,`conteudo`,`data`,`autor`,`resumo`,`addr`) Values(?,?,?,?,?,?)", [req.body.titulo, req.body.conteudo, data1, usuario_id, req.body.subtitulo, req.body.addr], function (error, results, fields) {
                            if (error) {
                                throw error;
                            }
                            return res.send({ error: 'false', data: "Projeto adicionado com sucesso!" });
                        })
                    }
                } else {
                    return res.send({ error: 'true', data: "Usuário não confirmado. Por favor, verifique seu email e tente novamente!" });
                }
            } else {
                return res.send({ error: 'true', data: "Usuário não encontrado!" });
            }
        })
    });
});

//confirmar conta de usuário
app.post('/confirmar/', function (req, res) {
    let acr = req.body.acr;
    if (acr) { //verifica input
        var usuario_confirmado;
        dbConn.query('SELECT * FROM `acr` where `id_acr`=?', acr, function (error, results, fields) { //procura usuário no banco
            if (error) { //verifica erro
                return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
            }
            if (results[0]) { //se encontrou usuário
                dbConn.query('SELECT * FROM `usuario` where `id`=?', results[0].usuario, function (error, resultsacr, fields) { //procura usuário no banco
                    if (error) { //verifica erro
                        return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro
                    }
                    usuario_confirmado = resultsacr[0].confirmado; //|
                    if (usuario_confirmado == 0) { //verifica se usuário não foi confirmado
                        let usuario_id = results[0].usuario; //popula id
                        var query = 'UPDATE `db_web`.`usuario` SET `confirmado`="1" WHERE  `id`="' + usuario_id + '"';
                        dbConn.query(query, function (error, results, fields) { //atualiza banco de dados 
                            if (error) { //se ocorrer erro,
                                return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro no servidor
                            }
                            return res.send({ error: 'false', data: "Usuário confirmado com sucesso!" }); //envia mensagem de sucesso.
                        })

                    } else { //se usuário já foi confirmado:
                        return res.send({ error: 'true', data: "Usuário já confirmado!" }); //envia mensagem de que usuário já foi confirmado
                    }
                });
            } else { //caso usuário não seja encontrado:
                return res.send({ error: 'true', data: "Usuário não encontrado!" }); //envia mensagem de que usuário não foi encontrado
            }
        });
    } else { //caso o usuário não tenha informado email ou senha:
        return res.send({ error: 'true', data: "Ação incorreta!" }); //envia mensagem de que falta campos:
    }
});
//Pedido para gerar novo hash
app.post('/passwordrequest', function (req, res) {
    let usuario_email = req.body.email;
    var queryv = "SELECT * FROM `usuario` WHERE email='" + usuario_email + "'";
    dbConn.query(queryv, function (error, results, fields) { //busca as informações do usuário no banco de dados
        if (error) { //se ocorrer erro:
            return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro, evita crash
        }
        if (!results[0]) { //se não encontrar usuário:
            return res.send({ error: true, data: "Usuário não encontrado!" }); //envia mensagem de que usuário não foi encontrado
        } else { //se encontrar:
            var data = new Date();
            const time = data.getTime();
            var datb = time + results[0].pwdate;
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(datb).digest("hex"); //gera código para a solicitação
            dbConn.query("INSERT INTO pcr(`id`,`id_usuario`) values(?,?)", [hash, results[0].id], function (error) { //insere a solicitação no banco de dados
                if (error) { //se ocorrer erro:
                    return res.status(500).send({ message: 'erro interno' }); //envia mensagem de erro, evita crash
                }
                let transporter = nodemailer.createTransport({
                    host: 'mail.' + email_server,
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'suporte',
                        pass: email_pass
                    }
                }); //define configurações do servidor de email

                let mailOptions = {
                    from: '"Suporte - Contas" <suporte@' + website + '>',
                    to: usuario_email,
                    subject: "Solicitação de alteração de senha",
                    //text: emailData.text,
                    html: `<p>Olá, ` + results[0].nome + `!</p><br><h4>Seu link para fazer a alteração:</h4><br><a href='https://` + website + `/novasenha.html?pc=` + hash + `'>Mudar minha senha</a><br>
                    <h4 style='color:orangered'>Caso não consiga clicar no link acima, copie o link: </h4><br><h4 style='color:blue'>https://` + website + `/novasenha.html?pc=` + hash + `</h4><br>
                    <h4>Caso não tenha solicitado uma alteração na sua senha, apenas ignore o email.</h4>
                            `
                }; //define opções de email

                //Envia email
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) { //se ocorrer erro:
                        return console.log(error.message); //loga mensagem de erro
                    }
                    console.log('Message sent: %s', info.messageId);
                });
                return res.send({ error: false, data: "Email com link de alteração de senha enviado com sucesso!", message: "Ok." }); //envia mensagem de sucesso e solicita que o usuário verifique o email.
            });
        }
    });
});
//muda o hash
app.post('/changepassword', function (req, res) {
    let request_id = req.body.request_id;
    let nsenha = req.body.senha;
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
            const md5Hasher = crypto.createHmac("md5", secret);
            const hash = md5Hasher.update(nsenha).digest("hex");
            dbConn.query("UPDATE usuario SET `pwdate` = ?, `pw` = ? where `id` = ?", [time, hash, results[0].id_usuario], function (error) {
                if (error) {
                    return res.status(500).send({ error: true, message: 'Erro interno. Não Foi possível alterar sua senha.' });
                }
                dbConn.query("SELECT `nome`, `email` from `usuario` where `id` = ?", results[0].id_usuario, function (error, resultsw) {
                    dbConn.query("DELETE from pcr where `id_usuario` = ?", results[0].id_usuario, function (error) { });
                    return res.send({ error: false, data: "Sucesso!", message: "Ok." });
                });

            });
        }
    });
});
//deletar postagem
app.post('/delete/', function (req, res) {
    let post = req.body.post;
    let session = req.body.session;
    var usuario_id;
    var usuario_level;
    if ((post) && (session)) {
        client.smembers(session, function (err, reply) { //recebe objeto com os membros do set
            if (err) {
                console.log(err);
                return res.status(500);
            } else {
                for (var i = 0; i < reply.length; i++) {
                    if (reply[i].indexOf('_') > 0) {
                        usuario_id = reply[i].split("_").pop();
                    }
                    if (reply[i].indexOf('@') > 0) {
                        usuario_level = reply[i].split("@").pop();
                    }
                }
                if (reply) {
                    if (!reply[0]) {
                        return res.send({ error: true, message: "Sessão não encontrada", data: "undo" });
                    } else {
                        dbConn.query("SELECT * FROM `post` WHERE id= ? ", post, function (error, results, fields) {
                            if (results[0].autor == usuario_id || usuario_level == 2) {
                                dbConn.query("DELETE from post where `id` = ?", post, function (error) {
                                    if (error) {
                                        res.status(500).send();
                                    } else {
                                        return res.send({ error: false, data: "Sucesso!", message: "Ok." });
                                    }
                                });
                            } else {
                                return res.send({ error: true, data: "Usuário não tem permissão para deletar essa postagem!", message: "Ok." });
                            }
                        });

                    }
                }
            }
        });
    } else {
        return res.send({ error: true, data: 'Informações insuficientes.' });
    }
});
//registrar novo usuário
app.post('/register/', function (req, res) {
    let usuario_nome = req.body.nome;
    let usuario_email = req.body.email;
    let imagem_usuario = req.body.imagem;
    let senha = req.body.senha;
    let cominf = req.body.cominf;
    var data = new Date();
    const time = data.getTime();
    const md5Hasher = crypto.createHmac("md5", secret);
    const hash = md5Hasher.update(senha).digest("hex");
    if ((!usuario_nome)) {
        return res.status(400).send({ error: true, message: 'informe um nome de usuário.' });
    } else
        if ((!usuario_email)) {
            return res.status(400).send({ error: true, message: 'informe um email.' });
        }
        else
            if ((!senha)) {
                return res.status(400).send({ error: true, message: 'informe uma senha.' });
            }
    var queryv = "SELECT * FROM `usuario` WHERE email='" + usuario_email + "'";
    dbConn.query(queryv, function (error, results, fields) {
        if (error) {
            return res.status(500).send({ message: 'erro interno' });
        }
        if (results[0]) {
            return res.send({ error: true, data: "Usuário já existe!" });
        } else {

            dbConn.query("INSERT INTO usuario(`nome`,`email`,`pwdate`,`image`,`pw`,`cominf`) values(?,?,?,?,?,?)", [usuario_nome, usuario_email, time, imagem_usuario, hash, cominf], function (error, resultsins) {
                if (error) {
                    return res.status(500).send({ message: 'erro interno' });
                }
                const md5Hasher = crypto.createHmac("md5", secret);
                const hashacr = md5Hasher.update(time + usuario_email).digest("hex");
                dbConn.query("INSERT INTO acr(`id_acr`,`usuario`) values(?,?)", [hashacr, resultsins.insertId], function (error) {
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
                        html: "<p>Olá, " + usuario_nome + "!</p><br><h4>Confirme seu email no link abaixo:</h4><br><a href='https://" + website + "/confirmar.html?acr=" + hashacr + "'>Confirmar</a>"
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            return console.log(error.message);
                        }
                        console.log('Message sent: %s', info.messageId);
                    });
                    return res.send({ error: false, data: "Registro realizado com sucesso!", message: "Ok." });
                });
            });
        }
    });
});
//verificar existência e enviar dados sobre pedido de mudança de senha
app.post('/pcr/', function (req, res) {
    let pcr = req.body.pcr;
    if (pcr) {
        var queryv = "SELECT u.email as 'email' FROM `pcr` p INNER JOIN `usuario` u ON(p.id_usuario=u.id) WHERE p.id='" + pcr + "'";
        dbConn.query(queryv, function (error, results, fields) {
            if (error) {
                return res.status(500).send({ message: 'erro interno' });
            }
            if (!results[0]) {
                return res.send({ error: true, data: "Link inválido!<br>Talvez você já tenha usado-o. Caso queira gerar uma nova senha,<br>faça uma nova soliciatação e verifique seu email." });
            } else {
                res.send({ error: false, data: results[0].email });
            }
        });
    } else {
        res.send({ erro: true, data: "Informe um código." })
    }
});

app.listen(process.env.PORT || 5000, function () {
    for (var i = 0; i < 50; i++) {
        process.stdout.write(".");
    }
    console.log("\nServidor iniciado...");
});
client.on('connect', function () { });
module.exports = app;