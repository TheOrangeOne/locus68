window.onload = function () {
  var conn;
  var msg = document.getElementById("msg");
  var log = document.getElementById("log");
  var keyElement = document.getElementById("key");
  var key;
  var room;

  function appendLog(item) {
    var doScroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1;
    log.appendChild(item);
    if (doScroll) {
      log.scrollTop = log.scrollHeight - log.clientHeight;
    }
  }

  // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript#comment39476298_1349404
  var id = window.localStorage.id || Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
  window.localStorage.id = id;

  var item = document.createElement("div");
  item.innerText = "My id is " + id;
  appendLog(item);

  function updateRoom(room) {
    var md = forge.md.sha512.create();
    md.update(keyElement.value);
    key = md.digest().toHex();
    if (keyElement.value) {
      md.update(key);
      room = md.digest().toHex()
    } else {
      room = "__DEFAULT__";
    }

    if (!window["WebSocket"]) {
      var item = document.createElement("div");
      item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
      appendLog(item);
      return;
    }

    if (conn) {
      conn.onclose = undefined;
      conn.close();
    }

    conn = new WebSocket("ws://" + document.location.host + "/ws/" + room + "?id=" + id);

    conn.onclose = function (evt) {
      var item = document.createElement("div");
      item.innerHTML = "Connection closed.";
      appendLog(item);
    };

    conn.onmessage = function (evt) {
      var messages = evt.data.split('\n');
      for (var i = 0; i < messages.length; i++) {
        var item = document.createElement("div");
        item.innerText = messages[i];
        appendLog(item);
      }
    };

    var item = document.createElement("div");
    item.innerHTML = "Joined room " + room.substr(0, 12) + " with key " + key.substr(0,12);
    appendLog(item);
  }

  document.getElementById("form").onsubmit = function () {
    if (!conn) {
      return false;
    }
    if (!msg.value) {
      return false;
    }
    conn.send(msg.value);
    msg.value = "";
    return false;
  };

  keyElement.onchange = updateRoom;

  updateRoom();
};
