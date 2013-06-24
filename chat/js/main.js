var name = $.cookie('name');
if(name == "undefined") { 
    var name = prompt("Your name?", "Guest");
    $.cookie('name', name);
}

var currentStatus = "★";

var userListRef = new Firebase("https://purcellchat.firebaseIO.com/userlist");

// Generate a reference to a new location for my user with push.
var myUserRef = userListRef.push();

// Get a reference to my own presence status.
var connectedRef = new Firebase("https://purcellchat.firebaseIO.com/.info/connected");
connectedRef.on("value", function(isOnline) {
  if (isOnline.val()) {
    // If we lose our internet connection, we want ourselves removed from the list.
    myUserRef.onDisconnect().remove();

    // Set our initial online status.
    setUserStatus("★");
  } else {

    // We need to catch anytime we are marked as offline and then set the correct status. We
    // could be marked as offline 1) on page load or 2) when we lose our internet connection
    // temporarily.
    setUserStatus(currentStatus);
  }
});

// A helper function to let us set our own state.
function setUserStatus(status) {
  // Set our status in the list of online users.
  currentStatus = status;
  myUserRef.set({ name: name, status: status });
}

// Update our GUI to show someone"s online status.
userListRef.on("child_added", function(snapshot) {
  var user = snapshot.val();
  $("#presenceDiv").append($("<div/>").attr("id", snapshot.name()));
  $("#" + snapshot.name()).text(user.name + "  " + user.status);
});

// Update our GUI to remove the status of a user who has left.
userListRef.on("child_removed", function(snapshot) {
  $("#" + snapshot.name()).remove();
});

// Update our GUI to change a user"s status.
userListRef.on("child_changed", function(snapshot) {
  var user = snapshot.val();
  $("#" + snapshot.name()).text(user.name + " " + user.status);
});

// Use idle/away/back events created by idle.js to update our status information.
document.onIdle = function () {
  setUserStatus("☆");
}
document.onAway = function () {
  setUserStatus("☄");
}
document.onBack = function (isIdle, isAway) {
  setUserStatus("★");
}

setIdleTimeout(10000);
setAwayTimeout(60000);



  // Get a reference to the root of the chat data.
  var messagesRef = new Firebase('https://purcellchat.firebaseIO.com/chats');

  // When the user presses enter on the message input, write the message to firebase.
  $('#messageInput').keypress(function (e) {
    if (e.keyCode == 13) {
      var text = $('#messageInput').val();
      messagesRef.push({name:name, text:text});
      $('#messageInput').val('');
    }
  });


  var limits = 20;
  
  // Add a callback that is triggered for each chat message.
  messagesRef.limit(limits).on('child_added', function (snapshot) {
    var exp = "/(\b(http?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig";
    
    
    var message = snapshot.val();
    
    var urls = findUrls(message);
        
    var cont = $('<div/>').addClass('row-fluid');
    $('<div/>').addClass('span2').text(message.name).appendTo(cont);
    $('<div/>').addClass('span10').html(linkify(message.text)).appendTo(cont);
    
    
    cont.appendTo('#messagesDiv');
      
      console.log(urls);
      
    $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
  });
  
  function linkify(inputText) {
      var replacedText, replacePattern1, replacePattern2, replacePattern3;

      //URLs starting with http://, https://, or ftp://
      replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
      replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

      //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
      replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
      replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

      //Change email addresses to mailto:: links.
      replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
      replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

      return replacedText;
  }
  
  
  function findUrls( text )
  {
      var source = (text || '').toString();
      var urlArray = [];
      var url;
      var matchArray;

      // Regular expression to find FTP, HTTP(S) and email URLs.
      var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

      // Iterate through any URLs in the text.
      while( (matchArray = regexToken.exec( source )) !== null )
      {
          var token = matchArray[0];
          urlArray.push( token );
      }

      return urlArray;
  }