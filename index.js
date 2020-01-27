const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

var path = require('path')
const port = 3000;

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules'));
app.get('/control', (req, res) => res.sendFile( path.join(__dirname, 'control.html')))
app.get('/', (req, res) => res.sendFile( path.join(__dirname, 'index.html')));



//socketio stuff

io.on('connection', (client)=> {
    console.log("connected");

    client.on('join', console.log);

    client.on('click', (e)=> {
        console.log(e);
        io.emit('command', e)
    });
    client.on('heartbeat', (data)=> {
        io.emit('data', data);
    })
})



//start server
server.listen(port, () => console.log(`Starting Canvas Prompter on port ${port}`));
