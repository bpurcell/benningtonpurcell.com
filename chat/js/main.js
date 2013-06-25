var name = $.cookie('name');
if(name == "undefined") { 
    var name = prompt("Your name?", "Guest");
    $.cookie('name', name);
}

var currentStatus = "★";

var userListRef = new Firebase("https://purcellchat.firebaseIO.com/userlist");

var myUserRef = userListRef.push();

var connectedRef = new Firebase("https://purcellchat.firebaseIO.com/.info/connected");
connectedRef.on("value", function(isOnline) {
  if (isOnline.val()) {
    myUserRef.onDisconnect().remove();
    setUserStatus("★");
  } else {

    setUserStatus(currentStatus);
  }
});

function setUserStatus(status) {
  currentStatus = status;
  myUserRef.set({ name: name, status: status });
}

userListRef.on("child_added", function(snapshot) {
  var user = snapshot.val();
  $("#presenceDiv").append($("<div/>").attr("id", snapshot.name()));
  $("#" + snapshot.name()).text(user.name + "  " + user.status);
});

userListRef.on("child_removed", function(snapshot) {
  $("#" + snapshot.name()).remove();
});

userListRef.on("child_changed", function(snapshot) {
  var user = snapshot.val();
  $("#" + snapshot.name()).text(user.name + " " + user.status);
});

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
      messagesRef.push({name:name, text:text, data: new Date()});
      $('#messageInput').val('');
    }
  });


  var limits = 20;
  
  // Add a callback that is triggered for each chat message.
  messagesRef.limit(limits).on('child_added', function (snapshot) {
    var message = snapshot.val();
        
    var cont = $('<tr/>');
    $('<td/>').addClass('nameCol').text(message.name).appendTo(cont);
    $('<td/>').addClass('msgCol').html(linkify(message.text)).appendTo(cont);
    
    
    cont.appendTo('#messagesDiv');
    $('#messageWrap').height( $(window).height()-($('#chatWrap').height()) );
      
    $('#messageWrap').scrollTop($('#messageWrap')[0].scrollHeight);
  });
    
  $('#messageWrap').scrollTop($('#messageWrap')[0].scrollHeight);
  
  function linkify(inputText) {
      var replacedText, replacePattern1, replacePattern2, replacePattern3;

      //URLs starting with http://, https://, or ftp://
      replacePattern1 = /(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/i;
      replacedText = inputText.replace(replacePattern1, '<img src="$1">');
      return replacedText;
      
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
  