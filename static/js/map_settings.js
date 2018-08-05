var Config = Config || {};

var roomSettings = new Vue({
  el: '#settings',
  data: {
    joinRoomName: '',
    avatars: Config.AVATARS,
  },
  methods: {
    changeAvatar: function(av) {
      console.log(av);
    }
  }
});

