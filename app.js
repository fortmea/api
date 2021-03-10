const express = require('express')
const app = express()
//const port = 3000

app.get('/', (req, res) => res.send("Hello World!"))
app.listen(process.env.PORT,'127.0.0.1', () => console.log(`Application listening on port ${port}!`))