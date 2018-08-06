// /* step 1:
//  * attempt to access the geolocation api and get the initial location.
//  *
//  * on success:
//  * call step2 with the coordinates
//  *
//  * on failure:
//  * display an overlay indicating failure and stop
//  */
// function step1() {
//   if (navigator.geolocation) {
//     navigator
//       .geolocation
//       .getCurrentPosition(
//         // on success
//         function(pos) {
//           console.log('step 1: location ✓');
//           step2(pos);
//         },
//         // on error
//         function(err) {
//           console.error('error:', err.code, err.message);
//           elLocOverlay.style.display = 'block';
//         },
//         // options
//         {
//           enableHighAccuracy: true,
//           timeout: 15000,            // wait 15s for location
//           maximumAge: 0              // fetch latest location
//         }
//       )
//   }
//   else {
//   }
// };
// 
// /*
//  * A callback for getCurrentPosition
//  */
// function step2(pos) {
//   var pathname = window.location.pathname;
// 
//   if (pathname.substr(0, 3) === '/r/') {
//     var room;
//     room = pathname.substr(3, pathname.length);
//     //locus = Locus(room, '', pos);
//     console.log('step 2: starting normal room ✓');
//     locus = new Locus({roomName: room, pass: '', lat: pos.coords.latitude, lng: pos.coords.longitude});
//   } else if (pathname === '/x' || pathname === '/x/') {
//     elKeyOverlay.style.display = 'block';
//     elKeyForm.onsubmit = function() {
//       return step3(pos);
//     }
//   }
// };
// 
// /*
//  * onsubmit event handler for the room key
//  */
// function step3(pos) {
//   var pass = elRoomKey.value;
//   elKeyOverlay.style.display = 'none';
// 
//   // the room name is hash(pass)
//   locus = Locus('', pass, pos);
//   // locus = Locus({roomName: '', pass: pass, loc: pos});
//   return false;
// };
// 
// 
// /* onload we want to accomplish the following in order, before starting the
//  * main app:
//  * 1) ask permission for location access and get an initial location
//  * 2) get the key to use for the room
//  * 3) kick off the locus instance with the above data
//  */
// window.onload = function() {
//   step1();
// };
// 
