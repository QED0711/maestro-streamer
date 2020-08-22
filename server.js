const fs = require('fs');
const express = require("express")
const app = express()
const cors = require("cors");

const server = require("https").createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
}, app)

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

// ROUTES
app.get("/", (req,res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get("/:sessionID", (req,res) => {
    res.render("session", {sessionID: req.params.sessionID})
})

// SOCKET IO
io.on("connection", socket => {
    socket.on("join-session", ({sessionID, userID}) => {
        console.log({sessionID, userID})
        
        socket.join(sessionID);
        socket.to(sessionID).broadcast.emit("user-connected", userID)
        
        socket.on("disconnect", () => {
            socket.to(sessionID).broadcast.emit("user-disconnected", userID)
        })
    })
})



// PORT ASSIGNMENT
server.listen(process.env.PORT || 4000, () => {
    console.log("Listening on port " + (process.env.PORT || 4000))
    console.log(`https://localhost:` + (process.env.PORT || 4000))
})