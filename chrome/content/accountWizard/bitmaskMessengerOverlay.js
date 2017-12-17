window.addEventListener("load", function() {
  overlayStartup();
}, false);

window.setInterval(function() {
  overlayStartup();
}, 3000);

function overlayStartup() {
  let myPanel = document.getElementById("bitmaskStatusBarPanel");

  // We just need to check if bitmaskd is running and if we were able to
  // authorize with it using the token from bitmask.js
  let promise = bitmask.core.status();
  promise.then(function(data) {
    myPanel.label = "bitmask is " + data["mail"];
    myPanel.style.color = "green";
  }, function(error) {
    myPanel.label = "bitmask is not running";
    myPanel.style.color = "red";
    console.log(error);
  });
}
