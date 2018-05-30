var dashboard = new Vue({
  el: '#dash',
  data: {
    joinRoomName: ''
  },
  methods: {
    joinRoom: function(roomName) {
      this.loadRoom({name: roomName});
      return false;
    },
    loadRoom: function(room) {
      var url = '/r/' + room.name;
      window.location.href = url;
    }
  }
});
