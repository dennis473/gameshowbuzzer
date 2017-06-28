const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const fs = require("fs");

const {generateMessage,generateLocationMessage} = require("./utils/message.js");
const {isRealString} = require("./utils/validation.js");
const {Users} = require("./utils/users.js");

const publicPath = path.join(__dirname,"../public");
const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer( app );
var io = socketIO(server);

var users = new Users();

var buzzersActive = false;
const logoDirectory = "./public/logos/";
var logos;

fs.readdir(logoDirectory, (error,files)=>{
    if(error)
    {
        logos = [];
        console.log("Error reading logos");
    }
    else {
        logos = files;
        console.log("logos: " + logos[1]);

    }

});

app.use(express.static(publicPath));

io.on("connection", function(socket){
    console.log("New User connected");


    socket.on('join', (params, callback) => {
        if (!isRealString(params.name)) {
            return  callback('Name is required.');
        }
        socket.join(params.room);
        console.log(params.name + " connected in room " + params.room);
        //socket.leave("params.room")  // is how to leave the room
        users.removeUser(socket.id); //remove user from other room if joining this room.
        users.addUser(socket.id, params.name,params.room);
        if(params.room !== "mc")
        {
            io.to("mc").emit("updateUserList", users.getUserList("player"));
        }
        else {
            console.log("mc has connected");
            io.to("mc").emit("logos",logos);
        }


       // socket.emit("newMessage",generateMessage("Admin","Welcome to the chat app"));
     //  socket.broadcast.to(params.room).emit("newMessage",generateMessage("Admin", params.name + " has joined"));
        callback();
    });

    socket.on("nextLogo", (params, callback)=>{
        io.to("player").emit("activateButton");
        buzzersActive = true;
    });

    socket.on("response", (params,callback)=>{
        if(buzzersActive)
        {
            buzzersActive = false;
            var user =  users.getUser(socket.id);
            io.to("player").emit("deactivateButton");
            io.to("mc").emit("firstPlayerBuzzed",user);
            console.log("first clicker: " + user.name);
        }

    });

    socket.on("secondChance", (params,callback)=>{
        buzzersActive = true;
        var id = params.id;
        var f = io.sockets.connected[id];
        f.broadcast.emit("activateButton");
        io.to(f.id).emit("deactivateButton");

    });


    socket.on("disconnect", ()=>{
        // console.log("User was disconnected");
        var user = users.removeUser(socket.id);
        if(user)
        {
            io.to(user.room).emit("updateUserList",users.getUserList(user.room));
            io.to(user.room).emit("newMessage",generateMessage("Admin",user.name + " has left."));
        }
    });

});


server.listen(port, () =>{
    console.log("Server is up on port " + port);
});