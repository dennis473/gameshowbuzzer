
var socket =  io();   //initialize connection

var button = $("#button");
button.fadeTo(0,.5);
var buttonActive = false;

socket.on("connect", function(){
    //  console.log("Connected to server");
    var params = $.deparam(window.location.search);
   console.log(params);
    socket.emit("join",params, function(error){
        if(error)
        {
            alert(error);
            window.location.href = "/";
        }
        else {
            console.log("No Error");
        }
    });
});
socket.on("disconnect", function(){
    console.log("Disconnected from server");
});

socket.on("activateButton", function(){
    buttonActive = true;
    console.log("activeate button");
    button.fadeTo(0,1);

});
socket.on("deactivateButton",function(){
    buttonActive = false;
    console.log("Deactivating button");
    button.fadeTo(0,.5);
});


button.on("click", function(evt){
    if(buttonActive)
    {
        console.log("click event");
        socket.emit("response",{
            text: "responded"
        },function(data){
            console.log(data);
        });

    }

});

