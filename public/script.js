// IMPORTS
const socket = io("/")
const userGrid = document.getElementById("user-grid");
console.log(PART)
// SETUP
const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "4000"
})

const peers = {}

console.log(SESSION_ID) // sessionID set in the session.ejs
let videoStream;

// AUDIO ELEMENT SETUP
const video = document.createElement("video")

video.muted = true;
video.controls = "controls"

// GET USER MEDIA
const getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;

getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    videoStream = stream;
    addVideoStream(video, videoStream)

    peer.on("call", call => {
        call.answer(stream)
        const video = document.createElement("video")
        video.innerText = "Hello World"
        video.muted = true;
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on("user-connected", ({userID, part}) => {
        connectToNewUser(userID, stream, part)
    })

})

socket.on("user-disconnected", userID => {
    peers[userID] && peers[userID].close()
})


peer.on("open", id => {
    console.log(id)
    socket.emit("join-session", {sessionID: SESSION_ID, userID: id, part: PART})
})



/* 
::::::::::::::::::::::
:: ADD AUDIO STREAM ::
::::::::::::::::::::::
*/
const addVideoStream = (video, stream, part=PART) => {
    video.controls = "controls"
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
        video.play();
    })

    const videoContainer = document.createElement("div")
    videoContainer.setAttribute("class", "video-container")
    userGrid.append(videoContainer)

    const header = document.createElement("p")
    header.innerText = part
    header.setAttribute("class", "video-part")

    videoContainer.append(header)
    videoContainer.append(video)

    // userGrid.append(video)

}

/* 
:::::::::::::::::::::::::
:: CONNECT TO NEW USER ::
:::::::::::::::::::::::::
*/
const connectToNewUser = (userID, stream, part) => {
    const call = peer.call(userID, stream)
    peers[userID] = call; // keep track of peers for disconnecting

    const video = document.createElement("video");
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream, part)
    })
    call.on("close", () => {
        video.remove()
    })

}