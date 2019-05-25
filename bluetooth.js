//bluetooth.js

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    var options = {
      acceptAllDevices: true,
    };
    navigator.bluetooth
      .requestDevice(options)
      .then(function(device) {
        console.log(device);
        // Do something with the device.
      })
      .catch(function(error) {
        console.log('Something went wrong. ' + error);
      });
  });
})();
