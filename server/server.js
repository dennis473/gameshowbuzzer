
/**********Add packages***********/
const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const fs = require("fs");
const os = require("os");
var bodyParser = require("body-parser");
//const {generateMessage,generateLocationMessage} = require("./utils/message.js");
const {isRealString} = require("./utils/validation.js");
const {Users} = require("./utils/users.js");

const publicPath = path.join(__dirname,"../public");
const port = process.env.PORT || 3000;

var app = express();
app.set('view engine', 'ejs');

var server = http.createServer( app );
var io = socketIO(server);

var users = new Users();

var buzzersActive = false;
const logoDirectory = "./public/logos/";
var logos;

app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/*********Routes*********************************/
app.get("/", function(request,response){
    response.render("./../views/index.ejs");
});

app.get("/buzzer", function(request,response){
    response.render("./../views/buzzer.ejs");
});

app.get("/login",function(request,response){
    response.render("./../views/login.ejs");
});

app.post("/mc", function(request,response){
    var requestedUser=  request.body.mc;
    var u = requestedUser.username;
    var p = requestedUser.password;
    console.log("Password: " + process.env.PASS);
    if( (u === process.env.ADMIN1 && p===process.env.PASS) ||
        ( u=== process.env.ADMIN2 && p === process.env.PASS))
    {
        response.render("./../views/mc.ejs");
    }
    else {
        response.send("Invalid username and/or password");
    }

});

/********Event Handling*********************/

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
            var dir = logoDirectory+"logo1/";
            console.log("directory: " + dir);
            fs.readdir(dir, (error,files)=>{
                if(error)
                {
                    logos = [];
                    console.log("Error reading logos");
                }
                else {
                    logos = files;
                    console.log("logos: " + logos[1]);
                    io.to("mc").emit("logos",{type:"logo",directory:"logos/logo1/", questions: logos});
                }
            });
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

    socket.on("requestFiles",(params,callback)=>{
        console.log("Params: " + params.type + ", " + params.folder);
        if(params.type === "logo")
        {

            var dir = logoDirectory+ params.folder + "/";
            console.log("directory: " + dir);
            fs.readdir(dir, (error,files)=>{
                if(error)
                {
                    logos = [];
                    console.log("Error reading logos");
                }
                else {
                    logos = files;
                    console.log("logos: " + logos[1]);
                    io.to("mc").emit("logos",{type:"logo",directory:"logos/" + params.folder + "/",
                                                                            questions: logos});
                }
            });
        }
        else if( params.type === "question")
        {
            var dir = logoDirectory;
            fs.readFile(dir + params.folder + ".txt","utf8" ,(error,file)=>{
                if(error)
                {
                    throw error;
                }
                console.log(file);
                var questions = file.split(os.EOL);
                console.log(questions);
                io.to("mc").emit("logos",{type:"question",directory:"logos/" ,
                    questions: questions});

            });
        }

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

/************Start Server***************************/
server.listen(port, () =>{
    console.log("Server is up on port : " + port);
});