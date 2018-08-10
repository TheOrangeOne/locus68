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
if (iOS && rooms.length > 0 && !rooms[0].cleanExit && (Date.now()-rooms[0].ts)/1000 < Config.AUTO_REJOIN) {
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
      if (roomName) {
        this.loadRoom({name: roomName});
        return false;
      }
    },
    loadRoom: function(room) {
      if (room.isSecure) {
        window.location.href = '/x';
      }
      else {
        var url = '/r/' + room.name;
        window.location.href = url;
      }
    },
    roomText: function(room) {
      var lock = room.isSecure ? '🔒' : '';
      var roomName = room.roomName;
      var ellip = roomName.length > 16 ? '...' : '';
      roomName = lock + ' ' + roomName.substr(0, 16) + ellip;
      var td = Date.now() - room.ts;
      return roomName + ' (' + Lib.prettyTime(td) + ')';
    },
  }
});

