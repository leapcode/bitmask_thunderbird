window.addEventListener("load", function() {
  overlayStartup();
}, false);

window.setInterval(function() {
  overlayStartup();
}, 3000);

function overlayStartup() {
  let myPanel = document.getElementById("bitmaskStatusBarPanel");
  let strBundle = document.getElementById("bitmaskMessengerStrings");

  // We just need to check if bitmaskd is running and if we were able to
  // authorize with it using the token from bitmask.js
  let promise = bitmask.core.status();
  promise.then(function(data) {
    myPanel.label = strBundle.getFormattedString("bitmaskStatusOn", [ data["mail"] ]);
    myPanel.style.color = "green";
    myPanel.src = "chrome://bitmask/skin/on.png";
  }, function(error) {
    myPanel.label = strBundle.getString("bitmaskStatusOff");
    myPanel.style.color = "red";
    myPanel.src = "chrome://bitmask/skin/off.png";
    console.log(error);
  });
}
