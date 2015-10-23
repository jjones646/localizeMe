function pointIt(event) {
  pos_x = event.offsetX ? (event.offsetX) : event.pageX - document.getElementById("pointer-div").offsetLeft;
  pos_y = event.offsetY ? (event.offsetY) : event.pageY - document.getElementById("pointer-div").offsetTop;
  var mrkElem = document.getElementById("marker");
  var offsetVal = mrkElem.offsetWidth / 2;
  mrkElem = mrkElem.style;
  mrkElem.left = (pos_x - offsetVal);
  mrkElem.top = (pos_y - offsetVal);
  mrkElem.visibility = "visible";
  document.pointform.form_x.value = pos_x;
  document.pointform.form_y.value = pos_y;
}

// Send text to all users through the server
function sendCords(ws) {
  var msg = {
    proto: "submit_cords",
    realm: "robotics",
    data: {
      cords: {
        x: document.getElementById("form_x").value,
        y: document.getElementById("form_y").value
      },
      set: 2
    }
  };

  // Send the msg object as a JSON-formatted string.
  ws.send(JSON.stringify(msg));
  console.log(msg);
}

// $(document).ready(function() {

function
var webSock = new WebSocket("ws://localhost:5000", ["protocolOne", "protocolTwo"]);

webSock.onopen = function(event) {
  // webSock.send("Here's some text that the server is urgently awaiting!");
  console.log(event.data);
};

webSock.onmessage = function(event) {

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
  }

  console.log(event.data);
}

// webSock.close();

document.getElementById("submit-btn").onclick = sendCords(webSock);

// });