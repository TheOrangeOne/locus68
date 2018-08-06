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
