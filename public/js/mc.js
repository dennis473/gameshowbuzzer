
var socket =  io();   //initialize connection

var currentLogo = 0;
var nextButton = $("#nextButton");
var acceptButton = $("#acceptButton");
var rejectButton = $("#rejectButton");
var secondChanceButton = $("#secondChanceButton");
var gameOverDiv = $("#gameOverDiv");
var logoImage = $("#logoImage");
var questionDiv = $("#questionDiv");
var users = $("#users");
var quizSelect = $("#quizSelect");
var loadButton = $("#loadButton");
var applause = $("#applause")[0];
var gameover = $("#gameover")[0];
var boo = $("#boo")[0];
var zap = $("#zap")[0];
var logosList = [];
var userList = [];
var firstPlayer;
var firstPlayerListItem;
var secondChance = false;
var fileType = "logo";
var cachedImages = [];

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
    users.forEach( function(user){
        ol.append($("<li></li>").text(user.name));
    });
    $("#users").html(ol);
});

socket.on("logos",function(logos){
    console.log("Logos:",logos);
    logosList = logos;
    if( logos.type === "logo")
    {
        questionDiv.css({display: "none"});
        logoImage.css({display: "inline-block"});
        for(var i=0; i < logos.questions.length;i++)
        {
            var path = logos.directory;
            console.log("path: " + path);
            var img = new Image();
            img.src = path + logos.questions[i];
            cachedImages.push(img);
        }
    }
    else if(logos.type === "question")
    {
        questionDiv.css({display: "inline-block"});
        logoImage.css({display: "none"});
    }
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

loadButton.on("click",function(evt){
    var s = quizSelect.val();
    console.log("Selected value: ", s);
    fileType="logo";
    if( s.startsWith("q"))
    {
        fileType = "question";
    }
    socket.emit("requestFiles",{type:fileType,folder:s},function(data){
        console.log(data);
    });
});



acceptButton.on("click",function(evt){
    applause.play();
    firstPlayer.score += 10;
    firstPlayerListItem.text(firstPlayer.name + ":  " + firstPlayer.score);
    firstPlayerListItem.css("background-color","#888");
    if(currentLogo == logosList.questions.length)
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
    if(currentLogo == logosList.questions.length)
    {
        nextButton.attr("disabled","disabled");
        if(secondChance)
        {
            //nextButton.attr("disabled","disabled");
            rejectButton.attr("disabled","disabled");
            acceptButton.attr("disabled","disabled");
            gameOverDiv.css("visibility","visible");
            gameover.play();

        }

    }
});

secondChanceButton.on("click", function(evt){
    socket.emit("secondChance",firstPlayer,function(data){
        console.log(data);
    });
    secondChance = true;

});

nextButton.on("click", function(evt){
    socket.emit("nextLogo",{
        text: "next logo"
    },function(data){
        console.log(data);
    });
    if(logosList.type === "logo")
    {
        logoImage.attr("src",logosList.directory + logosList.questions[currentLogo]);
    }
    else if(logosList.type === "question")
    {
        questionDiv.html(logosList.questions[currentLogo]);
    }

    currentLogo++;
    secondChance = false;
    if(currentLogo == logosList.questions.length)
    {
        nextButton.attr("disabled","disabled");


    }
});

