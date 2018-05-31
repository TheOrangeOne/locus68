var LocusUI = {
  renderUserFeed: function(locus) {
    var users = locus.users;
    var el_title = document.createElement('h1');
    el_title.id = 'title';

    // TODO: temporary hack to get back to index on app
    var elBack = document.createElement('a');
    elBack.innerHTML = '🏠 ‖ ';
    elBack.onclick = function() { locus.nav('/'); };
    el_title.appendChild(elBack);

    var elTitle = document.createElement('span');
    elTitle.innerHTML = window.location.pathname;
    el_title.appendChild(elTitle);

    var el_span = document.createElement('span');
    el_span.className += "right";

    for (id in users) {
      var user = users[id];
      var el_user = document.createElement('img');
      el_user.className += 'img-circle pps';
      el_user.setAttribute('src', user.img);

      el_user.onclick = function() {
        locus.focusOther(id);
      };

      el_span.appendChild(el_user);
    }

    el_title.appendChild(el_span);
    while (el_users.firstChild) {
      el_users.removeChild(el_users.lastChild);
    }

    el_users.appendChild(el_title);
  },

  renderUserGroup: function(locus) {
    var map = locus.map;
    var user = locus.user;
    var users = locus.users;

    // remove the previous control if it exists
    if (locus.melGroupLock) {
      map.removeControl(locus.melGroupLock);
    }

    var groupControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function(map) {
        var list = L.DomUtil.create('div', '');
        list.setAttribute('id', 'group');

        var el = L.DomUtil.create('img', 'group-item', list);
        el.setAttribute('style', 'transform: rotate(270deg) translate(0px, 0px) rotate(-270deg);');
        el.setAttribute('src', user.img);

        var i = 0;
        var nusers = Object.keys(users).length
        for (userid in users) {
          var u = users[userid];
          var offsetAngle = 360 / nusers;
          var rotateAngle = offsetAngle * i++;

          var el = L.DomUtil.create('img', 'group-item', list);
          el.setAttribute('style', 'transform: rotate(' + rotateAngle + 'deg) translate(0px, -20px) rotate(-' + rotateAngle + 'deg);');
          el.setAttribute('src', u.img);
        }

        locus.elGroupLock = list;
        list.onclick = locus.toggleGroupLock;
        return list;
      }
    });

    locus.melGroupLock = new groupControl();
    map.addControl(locus.melGroupLock);
  }
};
