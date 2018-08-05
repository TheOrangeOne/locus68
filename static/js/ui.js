var LocusUI = {
  renderUserFeed: function(locus) {
    var users = locus.users;
    var elTitle = document.createElement('h1');
    elTitle.id = 'title';

    // TODO: temporary hack to get back to index on app
    var elBack = document.createElement('a');
    elBack.innerHTML = '🏠 ';
    elBack.className += 'clickable';
    elBack.onclick = function() { locus.nav('/'); };
    elTitle.appendChild(elBack);

    var elPath = document.createElement('span');
    elPath.innerHTML = locus.room; // window.location.pathname;
    elTitle.appendChild(elPath);

    var elSpan = document.createElement('span');
    elSpan.className += 'right';

    for (var id in users) {
      var user = users[id];
      var elUser = document.createElement('img');
      elUser.className += 'img-circle pps';
      elUser.setAttribute('src', user.img);

      elUser.onclick = function(id) {
        return function() {
          locus.focusOther(id);
        };
      }(id);

      elSpan.appendChild(elUser);
    }

    elTitle.appendChild(elSpan);
    while (elUsers.firstChild) {
      elUsers.removeChild(elUsers.lastChild);
    }

    elUsers.appendChild(elTitle);
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
        list.className += 'clickable';
        return list;
      }
    });

    locus.melGroupLock = new groupControl();
    map.addControl(locus.melGroupLock);
  }
};


// map controls
function makeMapIcon(size, img, active) {
  var classes = 'img-circle ';
  classes += active ? 'pulse-active' : 'inactive';
  return L.icon({
    iconUrl: img,
    iconSize: [size,size],
    iconAnchor: [25,50],
    popupAnchor: [0,-54],
    className: classes
  });
};
