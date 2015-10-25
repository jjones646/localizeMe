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
var currentSet = 0;
var pointList = [];
var connList = [];
// a new connection gets forwared here
ws.on("connection", function(id) {
	// add connection object to array of all connections
	connList.push(id);
	console.log("User with ID of " + id + " has connected [%d current connections].", connList.length);

	var clientUpd = new Msg('renew_num_clients', connList.length, listeningRealm);
	for (var i = 0; i < connList.length; ++i) {
		connList[i].send(clientUpd.prep(), function() {});
	}

	// broadcast to all
	id.on("message", function(data, flags) {
		try {
			msg = JSON.parse(data);
			if (msg.realm == listeningRealm) {
				// create an empty response message initially
				var res = new Msg('', '', listeningRealm);
				var broadcastNeeded = false;
				var resetUs = false;

				// handle the corresponding event
				switch (msg.proto) {
					case "submit_cords":
						var info = msg.data;
						// we copy the receive coordinate info so we can send it to everyone in our realm
						res.data = info;
						res.proto = 'add_user_cords';
						pointList.push(res);
						// broadcastNeeded = true;
						console.log("Received submission: %dx%d (set %d).", info.cords.x, info.cords.y, info.set);
						break;

					case "add_user_cords":
						broadcastNeeded = true;
						console.log("Sending new point to connected users.");
						break;

					case "renew_num_clients":
						console.log("Received invalid packet destined for clients.");
						break;

					case "ground_truth":
						res.proto = 'ground_truth';
						// res.data = ...
						console.log("Sending ground truth to clients.");
						break;

					case "request_next_set":
						currentSet = msg.data;
						res.data = msg.data;
						res.proto = 'reset_set';
						broadcastNeeded = true;
						resetUs = true;
						pointList = [];
						break;

					case "send_out_points":
						for (var i = 0; i < connList.length; ++i) {
							for (var j = 0; j < pointList.length; ++j) {
								var message = pointList[j];
								connList[i].send(message.prep(), function ack(err) {
									if (typeof err !== 'undefined') {
										// something went wrong
										console.log("ERROR SENDING BROADCAST MESSAGE TO:\n" + connList[i]);
									}
								});
							}
						}
						//broadcastNeeded = true;
						console.log("Sending current points to client.");
						break;

					default:
						console.log("Received unknown protocol message.");
						console.log(data);
						break;
				}

				// broadcast out the message if needed
				if (broadcastNeeded) {
					console.log("Sending broadcast messages");
					var myId = connList.indexOf(id);
					for (var i = 0; i < connList.length; ++i) {
						if (i != myId || resetUs == true) {
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