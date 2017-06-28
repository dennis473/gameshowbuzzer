
var socket =  io();   //initialize connection

var currentLogo = 0;
var nextButton = $("#nextButton");
var acceptButton = $("#acceptButton");
var rejectButton = $("#rejectButton");
var secondChanceButton = $("#secondChanceButton");
var gameOverDiv = $("#gameOverDiv");
var logoImage = $("#logoImage");
var users = $("#users");
var applause = $("#applause")[0];
var gameover = $("#gameover")[0];
var boo = $("#boo")[0];
var zap = $("#zap")[0];
var logosList = [];
var userList = [];
var firstPlayer;
var firstPlayerListItem;

users.css("font-size","1.5em");

socket.on("connect", function(){
    //  console.log("Connected to server");
    var params = {name: "mc", room: "mc"};

    socket.emit("join",params, function(error){
        if(error)
        {
            alert(error);
           // window.location.href = "/mc.html";
        }
        else {
            console.log("Successfully joined gameshow");
        }
    });
});
socket.on("disconnect", function(){
    console.log("Disconnected from server");
});

socket.on("updateUserList", function(users){
    //console.log("Users list: ", users);
    userList = users;
    console.log(userList);
    var ol = $("<ol></ol>");
    ol.id = "userList";
    users.forEach( function(user){
        ol.append($("<li></li>").text(user.name));
    });
    $("#users").html(ol);
});

socket.on("logos",function(logos){
    console.log(logos);
    logosList = logos;
});

socket.on("firstPlayerBuzzed",function(player){
    console.log("buzzed: " + player.id + ", " +player.name + ", " + player.score);
    firstPlayer = null;
    for(var i=0; i < userList.length; i++)
    {
        if( userList[i].name === player.name)
        {
            firstPlayer = userList[i];
            zap.play();
            break;
        }
    }
   // var ol = $("<ol></ol>");
    listItems = $("#users li");
    for(var i=0; i < listItems.length; i++)
    {
        li = listItems.eq(i);
        console.log(li.html());
        if (li.html().startsWith(firstPlayer.name))
        {
            li.text(firstPlayer.name + ":  " + firstPlayer.score);
            li.css('background-color', 'green');
            firstPlayerListItem = li;
        }
    }

});


acceptButton.on("click",function(evt){
    applause.play();
    firstPlayer.score += 10;
    firstPlayerListItem.text(firstPlayer.name + ":  " + firstPlayer.score);
    firstPlayerListItem.css("background-color","#888");
    if(currentLogo == logosList.length)
    {
        nextButton.attr("disabled","disabled");
        rejectButton.attr("disabled","disabled");
        acceptButton.attr("disabled","disabled");
        gameOverDiv.css("visibility","visible");
        gameover.play();

    }
});

rejectButton.on("click",function(evt){
    boo.play();
    firstPlayer.score -= 10;
    firstPlayerListItem.text(firstPlayer.name + ":  " + firstPlayer.score);
    firstPlayerListItem.css("background-color","#888");
    if(currentLogo == logosList.length)
    {
        nextButton.attr("disabled","disabled");
        rejectButton.attr("disabled","disabled");
        acceptButton.attr("disabled","disabled");
        gameOverDiv.css("visibility","visible");
        gameover.play();

    }
});

secondChanceButton.on("click", function(evt){
    socket.emit("secondChance",firstPlayer,function(data){
        console.log(data);
    });
});


nextButton.on("click", function(evt){
    socket.emit("nextLogo",{
        text: "next logo"
    },function(data){
        console.log(data);
    });

    logoImage.attr("src","logos/" + logosList[currentLogo]);
    currentLogo++;
    if(currentLogo == logosList.length)
    {
        nextButton.attr("disabled","disabled");


    }
});

