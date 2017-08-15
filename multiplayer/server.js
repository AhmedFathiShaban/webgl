var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);


var Eureca = require('eureca.io');

//initialise eurecaServer object and allow client side welcome() and send() methods to be called from server
//those allowed methods should be declared under tchat namespace in the client side

var eurecaServer = new Eureca.Server({ allow: ['tchat.welcome', 'tchat.send'] });


//attach eureca to express server
eurecaServer.attach(server);

//serve index.html as default static file
app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});



//connections holder
var connections = {};

//register connections
eurecaServer.onConnect(function (connection) {
    console.log('New client ' ,  connection.id,  connection.eureca.remoteAddress);
    connections[connection.id] = { nick: null, client: eurecaServer.getClient(connection.id) };
});

//unregister connections
eurecaServer.onDisconnect(function (connection) {
    console.log('Client quit', connection.id);
    delete connections[connection.id];
});

//a namespace for chat methods on the server side
var tchatServer = eurecaServer.exports.tchatServer = {};

//simulate authentication, this can be a login/password check but for this tutorial
//we just check for non empty nick
tchatServer.login = function (nick) {
    console.log('Client %s auth with %s', this.connection.id, nick);
    var id = this.connection.id;
    if (nick !== undefined) //here we can check for login/password validity for example
    {
        connections[id].nick = nick;
        connections[id].client.tchat.welcome();
    }
}

//clients will call this method to send messages
tchatServer.send = function (message) {
    var sender = connections[this.connection.id];
    for (var c in connections) // just loop and send message to all connected clients
    {
        if (connections[c].nick) //simulate authentication check
            connections[c].client.tchat.send(sender.nick, message);
    }
}
//------------------------------------------

console.log('Eureca.io tchat server listening on port 8000')
server.listen(8000);
