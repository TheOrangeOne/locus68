// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
// https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions
function setWatchLocation(handleChangedLocation) {
  if (navigator.geolocation) {
    navigator
      .geolocation
      .watchPosition(
        handleChangedLocation,
        function(error) {
          console.warn('ERROR('+error.code+'): '+error.message);
        }, {
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
  } else {
    // TODO: handle this
  }
}

// return the initial location of the user or null if retrieving fails
function initLocation(handleChangedLocation) {
  if (navigator.geolocation) {
    navigator
      .geolocation
      .watchPosition(
        handleChangedLocation,
        function(error) {
          console.warn('ERROR('+error.code+'): '+error.message);
        }, {
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
  } else {
    // TODO: handle this
  }
}
