var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;
var Msg = require('./msg.js');

app.use(express.static(__dirname + "/"));
var server = http.createServer(app);

server.listen(port);
var ws = new WebSocketServer({
	server: server
});
console.log("WebSocket server running on port %d.", port);

var listeningRealm = 'robotics';

var testMsg = new Msg('renew_num_clients', listeningRealm, '3');
console.log(testMsg.prep());

var connList = [];
// a new connection gets forwared here
ws.on("connection", function(id) {
	// add connection object to array of all connections
	connList.push(id);
	console.log("User with ID of " + id + " has connected [%d current connections].", connList.length);

	// broadcast to all
	id.on("message", function(data, flags) {
		try {
			msg = JSON.parse(data);
			if (msg.realm == listeningRealm) {
				// create an empty response message initially
				var res = new Msg('', listeningRealm, '');
				var broadcastNeeded = false;

				// handle the corresponding event
				switch (msg.proto) {
					case "submit_cords":
						var info = msg.data;
						// we copy the receive coordinate info so we can send it to everyone in our realm
						res.data = info;
						res.proto = 'add_user_cords';
						broadcastNeeded = true;
						console.log("Received submission: %dx%d (set %d).", info.cords.x, info.cords.y, info.set);
						break;

					case "add_user_cords":
						broadcastNeeded = true;
						console.log("Sending new point to connected users.");
						break;

					case "renew_num_clients":
						broadcastNeeded = false;
						console.log("Received invalid packet destined for clients.");
						break;

					default:
						broadcastNeeded = false;
						console.log("Received unknown protocol message.");
						break;
				}

				// broadcast out the message if needed
				if (broadcastNeeded) {
					var myId = connList.indexOf(id);
					for (var i = 0; i < connList.length; ++i) {
						if (i != myId) {
							connList[i].send(res.prep(), function ack(err) {
								if (typeof err !== 'undefined') {
									// something went wrong
									console.log("ERROR SENDING BROADCAST MESSAGE TO:\n" + connList[i]);
								}
							});
						}
					}
				}
			}
		} catch (err) {
			console.log(err);
		}
	});

	id.on("close", function(idk) {
		connList.splice(connList.indexOf(id), 1);
		console.log("User with ID of " + id + " has disconnected.");
	});
});

// errors are forwarded into here
ws.on("error", function(err) {

});