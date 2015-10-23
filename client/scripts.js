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

// if (document.readyState === "complete") {
window.onload = function() {
  if (!window.WebSocket) {
    //If the user's browser does not support WebSockets, give an alert message
    alert("Your browser does not support the WebSocket API!");
  } else {

    // setup the websocket connection
    var wsurl = "ws://localhost:5000";
    //get status element
    var connstatus = document.getElementById("connectionstatus");
    var submitBtn = document.getElementById('submit-btn');
    // the default realm for our protocol
    var commRealm = 'robotics';
    // create the websocket object
    var webSock = new WebSocket(wsurl, ["protocolOne", "protocolTwo"]);

    // Handle any errors that occur.
    webSock.onerror = function(error) {
      console.log('WebSocket Error: ' + error);
    };

    webSock.onopen = function(event) {
      // do stuff when the connection opens
      console.log(event);
    };

    webSock.onmessage = function(event) {
      // parse the packet
      msg = JSON.parse(data);
      if (msg.realm == listeningRealm) {
        // create an empty response message initially
        var res = new Msg('', listeningRealm, '');
        var replyNeeded = false;

        // handle the corresponding event
        switch (msg.proto) {
          case "submit_cords":
            var info = msg.data;
            // we copy the receive coordinate info so we can send it to everyone in our realm
            res.data = info;
            res.proto = 'add_user_cords';
            replyNeeded = false;
            console.log("Received submission: %dx%d (set %d).", info.cords.x, info.cords.y, info.set);
            break;

          case "add_user_cords":
            replyNeeded = false;
            console.log("Sending new point to connected users.");
            break;

          case "renew_num_clients":
            replyNeeded = false;
            console.log("Received invalid packet destined for clients.");
            break;

          default:
            replyNeeded = false;
            console.log("Received unknown protocol message.");
            break;
        }

        if (replyNeeded) {
          // send a reply if we need to by the protocol standards that we defined
        }
      }
      console.log(event.data);
    };

    webSock.onclose = function(event) {
      // do stuff when the connection closes
    };

    submitBtn.onclick = function(e) {
      var cord_x = document.getElementById("form_x").value;
      var cord_y = document.getElementById("form_y").value;
      var image_set = 1;

      // make sure we have valid coordinates to send
      if (cord_x != null && cord_y != null) {
        // check to see if the websocket object exists
        if (webSock) {
          // create our data object to send
          var data = {
            cords: {
              x: cord_x,
              y: cord_y
            },
            set: image_set
          };
          // construct a message object, placing the data as the payload
          var msg = new Msg('submit_cords', data, commRealm);
          // Send the msg object as a JSON-formatted string.
          webSock.send(JSON.stringify(msg));
          // console.log(msg);
        } else {
          console.log("No socket connection");
        }
      } else {
        console.log("No coordinates set");
      }
    };

  }
}