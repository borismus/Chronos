$(function() { 
  // Activity events: keydown, mousemove
  $(document.body).bind('keydown mousemove', function() {
    // Notify background page that there was activity
    chrome.extension.sendRequest({activity: true}, function(response) {});
  });
});
