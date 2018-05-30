var rooms = [];

// TODO: temp hack
var i;
for (i = 0; i < localStorage.length; ++i) {
  var roomName = localStorage.key(i);
  var room;

  try {
    room = JSON.parse(localStorage.getItem(roomName));
  } catch (err) {
    console.warn('failed to parse room');
  }

  if (room) {
    room.name = roomName;
    rooms.push(room);
  }
}

// sort rooms descending
rooms.sort(function(a, b) {
  return b.ts - a.ts;
});

var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

// TODO: improve this
// rejoin the most recent room if there wasn't a clean exit
// this should only apply to iOS
if (iOS && rooms.length > 0 && !rooms[0].cleanExit && (Date.now()-rooms[0].ts)/1000 < AUTO_REJOIN) {
  var url = '/r/' + rooms[0].name;
  window.location.href = url;
}

var dashboard = new Vue({
  el: '#dash',
  data: {
    joinRoomName: '',
    rooms: rooms
  },
  methods: {
    joinRoom: function(roomName) {
      this.loadRoom({name: roomName});
      return false;
    },
    loadRoom: function(room) {
      var url = '/r/' + room.name;
      window.location.href = url;
    },
    roomText: function(room) {
      var td = (Date.now() - room.ts) / 1000;
      var hours   = Math.floor(td / 3600);
      var minutes = Math.floor((td - (hours * 3600)) / 60);
      var seconds = Math.floor(td - (hours * 3600) - (minutes * 60));

      if (hours   < 10) hours   = '0'+hours;
      if (minutes < 10) minutes = '0'+minutes;
      if (seconds < 10) seconds = '0'+seconds;
      var time = hours+':'+minutes+':'+seconds;
      return room.name + ' (' + time + ')';
    },
  }
});

