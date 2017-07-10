/**********Add packages***********/
const path = require("path");
const http = require("http");
var multer = require("multer");
const express = require("express");
var session = require("express-session");
const socketIO = require("socket.io");
const fs = require("fs");
const os = require("os");
var bodyParser = require("body-parser");
var rimraf = require("rimraf");  //allows rm -rf option to delete folders with files

const {isRealString} = require("./utils/validation.js");
const {Users} = require("./utils/users.js");

const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;

var app = express();
app.set("view engine", "ejs");

var server = http.createServer(app);
var io = socketIO(server);

var users = new Users();

var buzzersActive = false;
const logoDirectory = "./public/logos/";
var logos;
var sess;


app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({secret: "**Dennis is cool*??",resave:true,saveUninitialized:true}));

var storage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, "./uploads");
    },
    filename: function (request, file, callback) {
        callback(null, file.originalname);
    }
});
var uploadPhoto = multer({storage: storage}).array("userPhoto", 20);
var uploadQuiz = multer({storage: storage}).array("quiz", 20);

/*********Routes*********************************/

function getFoldersAndQuizzes(path, request, files) {
    var quizzes = [];
    var folders = [];
    for (var i = 0; i < files.length; i++) {
        if (fs.lstatSync(path + files[i]).isDirectory()) {
            folders.push(files[i]);
        }
        else {
            quizzes.push(files[i]);
        }
    }
    return {files: files, folders: folders, quizzes: quizzes};
}



app.get("/notauthorized", function (request, response) {
    response.render("notauthorized");
});

app.get("/", function (request, response) {
    response.render("index");
});

app.get("/buzzer", function (request, response) {
    response.render("buzzer");
});

app.get("/login", function (request, response) {
    response.render("login");
});

/*******Protected Routes - Need Authentication ***************/

app.get("/admin", function (request, response) {
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("admin", data);

    });
});

app.get("/addFolder", function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("addFolder", data);
    });
});
app.post("/addfolder", function (request, response) {
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }

    fs.mkdirSync(publicPath + "/logos/" + request.body.folderText);
    fs.readdir(publicPath + "/logos", function (err, files) {

        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        data.message = "Folder " + request.body.folderText + " successfully created";
        response.render("addFolder", data);
    });
});

app.get("/uploadImages",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("uploadImages", data);
    });
});
app.post("/uploadImages", function (request, response) {
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    uploadPhoto(request,response,function(err) {

        if(err) {
            console.log("Error: ",err);
            return response.end("Error uploading file.");
        }
        var temp = request.files;
        for(var i=0; i < temp.length; i++)
        {
            var original = "./uploads/" + temp[i].originalname;
            var newfile = publicPath + "/logos/" + request.body.folderSelect +
                                                "/" + temp[i].originalname;
            if (newfile.includes(" ")){
                newfile = newfile.replace(/\ /g,"_");
            }
            fs.rename(original,
                newfile,function(err){
                    if(err){ throw err;}
                });
        }
        fs.readdir(publicPath + "/logos", function (err, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            data.message = "Images uploaded: " ;
            response.render("uploadImages", data);
        });
    });

});

app.get("/uploadQuizzes",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("uploadQuizzes", data);
    });
});

app.post("/uploadQuizzes", function (request, response) {
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    uploadQuiz(request,response,function(err) {

        if(err) {
            console.log("Error: ",err);
            return response.end("Error uploading file.");
        }
        var temp = request.files;
        for(var i=0; i < temp.length; i++)
        {
            var original = "./uploads/" + temp[i].originalname;
            var newfile = publicPath + "/logos/" + temp[i].originalname;
            fs.rename(original,
                newfile,function(err){
                    if(err){ throw err;}
                });
        }
        fs.readdir(publicPath + "/logos", function (err, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            data.message = "Quizzes uploaded successfully " ;
            response.render("uploadQuizzes", data);
        });
    });

});

app.get("/mc",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("mc", data);
    });
});

app.post("/mc", function (request, response) {
    var requestedUser = request.body.mc;
    var u = requestedUser.username;
    var p = requestedUser.password;
    if ((u === process.env.ADMIN1 && p === process.env.PASS) ||
        ( u === process.env.ADMIN2 && p === process.env.PASS)) {
        sess = request.session;
        sess.authorized = true;
        fs.readdir(publicPath + "/logos", function (err, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            response.render("mc", data);
        });
    }
    else {
        response.redirect("notauthorized");
    }

});

app.get("/viewImages",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("viewImages", data);
    });
});

app.post("/viewImages",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos/" + request.body.folderSelect , function (err, images) {
        fs.readdir(publicPath + "/logos/" , function (error, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            data.imagePath = request.body.folderSelect;
            data.images = images;
                response.render("viewImages", data);

        });

    });

});

app.get("/viewQuiz",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("viewQuiz", data);
    });
});

app.post("/viewQuiz",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    var filePath = publicPath + "/logos/" + request.body.quizSelect;
    fs.readFile(filePath,"utf8",function(err,fileContents){
        console.log("contents: ",fileContents);
        console.log("type: ",typeof fileContents);
        var questions = fileContents.split(os.EOL);
        fs.readdir(publicPath + "/logos", function (err, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            data.questions = questions;
            response.render("viewQuiz", data);
        });
    });
});

app.get("/deleteFolder",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("deleteFolder", data);
    });
});

app.post("/deleteFolder",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    var dir = logoDirectory + request.body.folderSelect;
    rimraf(dir, function(err) {
        if (err) { throw err; }
        console.log("Folder deleted");
        fs.readdir(publicPath + "/logos", function (err, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            data.message = request.body.folderSelect + " was deleted";
            response.render("deleteFolder", data);
        });
    })
});
app.get("/deleteQuiz",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    fs.readdir(publicPath + "/logos", function (err, files) {
        var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
        response.render("deleteQuiz", data);
    });
});

app.post("/deleteQuiz",function(request,response){
    if (!request.session || request.session.authorized !== true) {
        response.redirect("notauthorized");
    }
    var dir = logoDirectory + request.body.folderSelect;
    fs.unlinkSync(dir);
        fs.readdir(publicPath + "/logos", function (err, files) {
            var data = getFoldersAndQuizzes(publicPath + "/logos/", request, files);
            data.message = request.body.folderSelect + " was deleted";
            response.render("deleteQuiz", data);
        });
});

/********Event Handling*********************/

io.on("connection", function (socket) {
    console.log("New User connected");


    socket.on('join', (params, callback) => {
        if (!isRealString(params.name)) {
            return callback('Name is required.');
        }
        socket.join(params.room);
        console.log(params.name + " connected in room " + params.room);
        //socket.leave("params.room")  // is how to leave the room
        users.removeUser(socket.id); //remove user from other room if joining this room.
        users.addUser(socket.id, params.name, params.room);
        if (params.room !== "mc") {
            io.to("mc").emit("updateUserList", users.getUserList("player"));
        }
        else {
            console.log("mc has connected");

            fs.readdir(publicPath + "/logos", function (err, files) {
                var data = getFoldersAndQuizzes(publicPath + "/logos/", null, files);
                var firstDirectory = data.folders[0];
                var dir = publicPath + "/logos/" + firstDirectory;
                console.log("join 1st Directory: ",dir);
                fs.readdir(dir, (error, images)=> {
                    if (error) {
                        logos = [];
                        console.log("Error reading logos");
                    }
                    else {
                        logos = images;
                        io.to("mc").emit("logos", {type: "logo", directory: "logos/"+firstDirectory + "/",
                                                                                    questions: logos});
                    }
                });
            });

        }


        // socket.emit("newMessage",generateMessage("Admin","Welcome to the chat app"));
        //  socket.broadcast.to(params.room).emit("newMessage",generateMessage("Admin", params.name + " has joined"));
        callback();
    });

    socket.on("nextLogo", (params, callback)=> {
        io.to("player").emit("activateButton");
        buzzersActive = true;
    });

    socket.on("response", (params, callback)=> {
        if (buzzersActive) {
            buzzersActive = false;
            var user = users.getUser(socket.id);
            io.to("player").emit("deactivateButton");
            io.to("mc").emit("firstPlayerBuzzed", user);
            console.log("first clicker: " + user.name);
        }

    });

    socket.on("secondChance", (params, callback)=> {
        buzzersActive = true;
        var id = params.id;
        var f = io.sockets.connected[id];
        f.broadcast.emit("activateButton");
        io.to(f.id).emit("deactivateButton");

    });

    socket.on("requestFiles", (params, callback)=> {
        console.log("Params: " + params.name );
        if (params.type === "logo") {

            var dir = logoDirectory + params.folder + "/";
            console.log("directory: " + dir);
            fs.readdir(dir, (error, files)=> {
                if (error) {
                    logos = [];
                    console.log("Error reading logos");
                }
                else {
                    logos = files;
                    console.log("logos: " + logos[1]);
                    io.to("mc").emit("logos", {
                        type: "logo", directory: "logos/" + params.folder + "/",
                        questions: logos
                    });
                }
            });
        }
        else if (params.type === "quiz") {
            var dir = logoDirectory;
            fs.readFile(dir + params.folder , "utf8", (error, file)=> {
                if (error) {
                    throw error;
                }
                console.log(file);
                var questions = file.split(os.EOL);
                console.log(questions);
                io.to("mc").emit("logos", {
                    type: "quiz", directory: "logos/",
                    questions: questions
                });

            });
        }

    });


    socket.on("disconnect", ()=> {
        // console.log("User was disconnected");
        var user = users.removeUser(socket.id);
        if (user) {
            io.to(user.room).emit("updateUserList", users.getUserList(user.room));

        }
    });

});

/************Start Server***************************/
server.listen(port, () => {
    console.log("Server is up on port : " + port);
});