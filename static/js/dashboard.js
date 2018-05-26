var rooms = [];
var user = {
  loggedin: false,
  img: getRandomPP()
};

function init() {
}

init();

var dashboard = new Vue({
  el: '#dash',
  data: {
    user: user,
    rooms: rooms,
    newRoomName: '',
    joinRoomName: ''
  },
  methods: {
    joinRoom: function(roomName) {
      this.loadRoom({name: roomName});
      return false;
    },
    loadRoom: function(room) {
      var url = '/'+room.name;
      window.location.href = url;
    },
    createRoom: function() {
      $.ajax({
        type: 'POST',
        url: '/api/create',
        data: JSON.stringify({
          roomName: this.newRoomName
        }),
        contentType: 'application/json'
      })
      .error(function(e) {
        console.log(e);
      })
      .success(function(data) {
        window.location.href = data.newRoomURL;
      });
    }
  }
});
