// IMPORTS
const socket = io("/")
console.log(socket)
const userGrid = document.getElementById("user-grid");

// SETUP
const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "4000"
})

console.log(SESSION_ID) // sessionID set in the session.ejs
let videoStream;

// AUDIO ELEMENT SETUP
const video = document.createElement("video")

video.muted = false;
video.controls = "controls"

// GET USER MEDIA
const getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;

getUserMedia({
    video: false,
    audio: true
}).then(stream => {
    videoStream = stream;
    addVideoStream(video, videoStream)

    peer.on("call", call => {
        console.log("GOT THE CALL")
        call.answer(stream)
        const video = document.createElement("video")
        video.muted = true;
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on("user-connected", userID => {
        connectToNewUser(userID, stream)
    })

})



peer.on("open", id => {
    console.log(id)
    socket.emit("join-session", {sessionID: SESSION_ID, userID: id})
})



/* 
::::::::::::::::::::::
:: ADD AUDIO STREAM ::
::::::::::::::::::::::
*/
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    })
    userGrid.append(video)
}

/* 
:::::::::::::::::::::::::
:: CONNECT TO NEW USER ::
:::::::::::::::::::::::::
*/
const connectToNewUser = (userID, stream) => {
    const call = peer.call(userID, stream)
    const video = document.createElement("video");
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on("close", () => {
        video.remove()
    })

    
}