function renderUserFeed(users) {
  var el_title = document.createElement('h1');
  el_title.id = 'title';
  el_title.innerHTML = window.location.pathname;
  var el_span = document.createElement('span');
  el_span.className += "right";

  for (id in users) {
    var user = users[id];
    var el_user = document.createElement('img');
    el_user.className += 'img-circle pps';
    el_user.setAttribute('src', user.img);

    el_user.onclick = function() {
      focusOther(id);
    };

    el_span.appendChild(el_user);
  }

  el_title.appendChild(el_span);
  while (el_users.firstChild) {
    el_users.removeChild(el_users.lastChild);
  }

  el_users.appendChild(el_title);
}
