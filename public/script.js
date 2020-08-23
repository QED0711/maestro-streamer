// IMPORTS
const socket = io("/")
const userGrid = document.getElementById("user-grid");
// SETUP
const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "4000"
})

const peers = {}
const seenStreams = {}

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
    addVideoStream(video, stream, PART) // for the users own video stream

    peer.on("call", call => {
        console.log("PEER ON CALL")
        
        stream.data = {part:PART}
        call.answer(stream)
        const video = document.createElement("video")        
        video.muted = true;

        
        call.on("stream", userVideoStream => {
            console.log("CALL ON STREAM")
            // userVideoStreams are from users who were already connected
            socket.emit("request-user-data", {streamID: userVideoStream.id}) // requests data from the user based on their stream id
            addVideoStream(video, userVideoStream)
        })

        call.on("close", () => {
            console.log("REMOVING")
            video.parentElement.remove()
            // video.remove()
        })
    })

    socket.on("user-connected", ({userID, part}) => {
        connectToNewUser(userID, stream, part)
    })

    socket.on("data-requested", (data) => { // responds to data requests based on own stream id
        if(data.streamID === stream.id){
            socket.emit("data-response", {streamID: stream.id, part: PART})
        }
    })

})


socket.on("user-data-response", data => {
    const header = document.getElementById(`header-${data.streamID}`)
    header.innerText = data.part
})

socket.on("user-disconnected", userID => {
    peers[userID] && peers[userID].close()
})


peer.on("open", id => {    
    socket.emit("join-session", {sessionID: SESSION_ID, userID: id, part: PART})
})



/* 
::::::::::::::::::::::
:: ADD AUDIO STREAM ::
::::::::::::::::::::::
*/
const addVideoStream = (video, stream, part) => {
    console.log("ADDING VIDEO STREAM")
    // prevents function from getting called twice on same stream
    if(seenStreams[stream.id]) return

    seenStreams[stream.id] = true;
    
    video.controls = "controls"
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
        video.play();
    })

    const videoContainer = document.createElement("div")
    videoContainer.setAttribute("class", "video-container")
    videoContainer.setAttribute("id", stream.id)
    userGrid.append(videoContainer)

    const header = document.createElement("p")
    header.innerText = part || "--"
    header.setAttribute("class", "video-part")
    header.setAttribute("id", `header-${stream.id}`)

    videoContainer.append(header)
    videoContainer.append(video)

    // userGrid.append(video)

}

/* 
:::::::::::::::::::::::::
:: CONNECT TO NEW USER ::
:::::::::::::::::::::::::
*/
const connectToNewUser = async (userID, stream, part) => {
    console.log("CONNECT TO NEW USER", part)
    
    setTimeout(() => {
        const call = peer.call(userID, stream)
        peers[userID] = call; // keep track of peers for disconnecting

    call.on("open", () => {console.log("CALL IS OPEN")})

        // debugger

        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream, part)
        })
        call.on("close", () => {
            console.log("REMOVING")
            video.parentElement.remove()
            // video.remove()
        })

    }, 2000)


}