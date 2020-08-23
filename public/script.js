// IMPORTS
const socket = io("/")
const userGrid = document.getElementById("user-grid");
// SETUP
const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "4000",
    // debug: 3
})

const peers = {}
const seenStreams = {}

console.log(SESSION_ID) // sessionID set in the session.ejs
let videoStream;

// AUDIO ELEMENT SETUP
const video = document.createElement("video")

video.muted = true;

// GET USER MEDIA
// See constraints properties:
// https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
navigator.mediaDevices.getUserMedia({
    video: false,
    audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
        sampleSize: 8,
    }
}).then(stream => {
    console.log("GOT USER MEDIA")
    videoStream = stream;
    addVideoStream(video, stream, PART) // for the user's own video stream

    const handlePageUnload = e => {
        socket.emit("user-leaving", {streamID: stream.id, part: PART})
    }

    // if the session the person who started the session leaves, these unload event handlers will inform other session members of their departure so they can clean up any stale user data.
    window.addEventListener("unload", handlePageUnload)
    window.addEventListener("beforeunload", handlePageUnload)

    peer.on("call", call => {

        const answer = call.answer(stream)
        console.log(answer)
        const video = document.createElement("video")
        // video.muted = true;


        call.on("stream", userVideoStream => {
            // userVideoStreams are from users who were already connected
            socket.emit("request-user-data", { streamID: userVideoStream.id }) // requests data from the user based on their stream id
            addVideoStream(video, userVideoStream)
        })

        call.on("close", () => {
            console.log("REMOVING")
            video.parentElement.remove()
            // video.remove()
        })
    })

    socket.on("user-connected", ({ userID, part }) => {
        connectToNewUser(userID, stream, part)
    })

    socket.on("data-requested", (data) => { // responds to data requests based on own stream id
        if (data.streamID === stream.id) {
            socket.emit("data-response", { streamID: stream.id, part: PART })
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

socket.on("remove-stale-user", data => {
    console.log("WILL REMOVE STALE USER")
    const staleStream = document.getElementById(data.streamID)
    staleStream.remove()
})


peer.on("open", id => {
    socket.emit("join-session", { sessionID: SESSION_ID, userID: id, part: PART })
})



/* 
::::::::::::::::::::::
:: ADD AUDIO STREAM ::
::::::::::::::::::::::
*/
const addVideoStream = (video, stream, part) => {
    // prevents function from getting called twice on same stream
    if (seenStreams[stream.id]) return

    seenStreams[stream.id] = true;

    video.controls = "controls"
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
        video.play();
    })

    // CONTROLS
    // const controlsContainer = document.createElement("div")
    // controlsContainer.setAttribute("class", "controls-container")

    // const muteButton = document.createElement("button");
    // muteButton.setAttribute("class", "mute-btn")
    // muteButton.innerText = video.muted ? "Unmute" : "Mute"
    // muteButton.addEventListener("click", function(e){
    //     video.muted = !video.muted
    //     e.target.innerText = video.muted ? "Unmute" : "Mute"
    // })
    // muteButton.style.display = "none"

    
    // VIDEO CONTAINER
    const videoContainer = document.createElement("div")
    videoContainer.setAttribute("class", "video-container")
    videoContainer.setAttribute("id", stream.id)
    // videoContainer.addEventListener("mouseenter", function(e){
    //     console.log(e.target.id)
    //     // controlsContainer.style.display = "inline-block"
    //     controlsContainer.style.opacity = 1.0
    // })
    // videoContainer.addEventListener("mouseleave", function(e){
    //     // controlsContainer.style.display = "none"
    //     controlsContainer.style.opacity = 0;

    // })
    
    userGrid.append(videoContainer)
    
    const header = document.createElement("p")
    header.innerText = part || "--"
    header.setAttribute("class", "video-part")
    header.setAttribute("id", `header-${stream.id}`)
    
    videoContainer.append(header)
    videoContainer.append(video)

    // videoContainer.append(controlsContainer)
    // controlsContainer.append(muteButton)
    
    // userGrid.append(video)

}

/* 
:::::::::::::::::::::::::
:: CONNECT TO NEW USER ::
:::::::::::::::::::::::::
*/
const connectToNewUser = async (userID, stream, part) => {

    // setTimeout(() => {
    const call = peer.call(userID, stream)
    peers[userID] = call; // keep track of peers for disconnecting
    console.log(call.open)
    console.log(call)
    // call.on("open", () => {console.log("CALL IS OPEN")})

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

    // }, 2000)


}