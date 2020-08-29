const fs = require('fs');
const express = require("express")
const app = express()
const cors = require("cors");
const path = require("path")

const server = require("http").createServer(app)


// const server = require('http').Server(app)
const io = require("socket.io")(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

const {v4: uuidV4} = require("uuid");


// server configuration
app.use(cors())
app.use('/peerjs', peerServer)
app.set("view engine", "ejs")
app.use(express.static('public'))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// ROUTES
app.get("/", (req,res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get("/:sessionID", (req,res) => {
    const part = req.query.part
    res.render("session", {sessionID: req.params.sessionID, part})
})

// SOCKET IO
io.on("connection", socket => {
    console.log("CONNECTION")
    // socket.on("hello", () => {
    //     socket.emit("world", {message:"This is a message from the server socket"})
    // })

    
    socket.on("join-session", ({sessionID, userID, part}) => {
        
        socket.join(sessionID);
        // setTimeout(() => {
        //     socket.to(sessionID).broadcast.emit("user-connected", {userID, part})
        // }, 3000)
        
        socket.on("ring", ({sessionID, userID, authority}) => {
            console.log({userID, sessionID, authority})
            // for continuous ringing
            socket.to(sessionID).broadcast.emit("user-connected", {userID, authority})
        })

        socket.on("chat-message", ({name, message}) => {
            socket.to(sessionID).broadcast.emit("message-received", {name, message})
        })

        socket.on("user-leaving", data => {
            console.log("USER LEAVING")
            socket.to(sessionID).broadcast.emit("remove-stale-user", {...data})
        })

        socket.on("disconnect", () => {
            socket.to(sessionID).broadcast.emit("user-disconnected", userID)
        })


        socket.on("request-user-data", data => {
            socket.to(sessionID).broadcast.emit("data-requested", data)
        })

        socket.on("data-response", data => {
            socket.to(sessionID).broadcast.emit("user-data-response", data)
        })
    })
})



// PORT ASSIGNMENT
server.listen(process.env.PORT || 4000, () => {
    console.log("Listening on port " + (process.env.PORT || 4000))
    console.log(`https://localhost:` + (process.env.PORT || 4000))
})