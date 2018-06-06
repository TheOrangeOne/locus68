var roomSettings = new Vue({
  el: '#settings',
  data: {
    joinRoomName: '',
    avatars: AVATARS,
  },
  methods: {
    changeAvatar: function(av) {
      console.log(av);
    }
  }
});

