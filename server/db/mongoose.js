
var mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gameshow",
    undefined,
    function(error){
        if(error)
        {
           return console.log("error connecting to mongodb");

        }
        console.log("Connected to MongoDB just fine");
    });


module.exports = {
    mongoose: mongoose
};