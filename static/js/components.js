Vue.component('btn-full', {
  props: ['text'],
  template: '<button type=button class="pure-button full">{{ text }}</button>'
});

Vue.component('btn-room', {
  props: ['text'],
  template: '<button type=button class="pure-button full room-button">{{ text }}</button>'
});
