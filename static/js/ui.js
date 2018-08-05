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
