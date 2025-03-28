
import React, { useEffect, useState ,useRef} from 'react'

const Sender = ({userId,roomId}) => {
  let [peer,setPeer]=useState();
let [socket,useSocket]=useState();
let [tracks,setTracks]=useState([]);
  useEffect(()=>{

    let socket =new WebSocket("ws://localhost:3001")

    socket.onopen=async ()=>{
        let stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true})
        //receiving peer is peerw and sending peer is peer
        
        let peerw=new RTCPeerConnection()  
        peerw.onicecandidate=(e)=>{
            if(e.candidate){
              socket.send(JSON.stringify({
                type:"ice-candidate-forward",
                data:{
                  roomId,
                  userId,
                  candidate:e.candidate
                }
              }))
            }
          }
        peerw.ontrack=(e)=>{

          console.log(e.streams[0])
          setTracks((t)=>[...t,e.streams[0]])

        }
        
        let peer=new RTCPeerConnection()
        peer.addTrack(stream.getTracks()[0],stream)
        peer.addTrack(stream.getTracks()[1],stream)
        
        console.log("Connected to Sender")
        
          socket.send(JSON.stringify({
            type:"start",
            data:{
              userId,
              roomId
            }
          }))
        
        


        socket.onmessage=async(msg)=>{
          let {type,data}=JSON.parse(msg.data)
          
          if(type=='start'){
            
              
              let offer=await peer.createOffer()
              console.log("offer")
              socket.send(JSON.stringify({
                type:"offer",
                data:{
                  roomId,
                  userId,
                  offer
                }
              }))

          }

          if(type=='answerI'){
              let {answer}=data;
              await peer.setRemoteDescription(new RTCSessionDescription(answer))
          }



          if(type=='trickleR'){
            let {candidate}=data;
            await peer.addIceCandidate(candidate)
          }

          if(type=='offerI'){
    
                  console.log("close !")
                  let {offer}=data;
                  await peerw.setRemoteDescription(new RTCSessionDescription(offer))
                  let answer=await peerw.createAnswer()
                  await peerw.setLocalDescription(answer)
                  socket.send(JSON.stringify({
                    type:"answer-secondary",
                    data:{
                      roomId,
                      userId,
                      answer
                    }
                  }))
        
          }

          
          

          if(type=='ice-candidate-medi'){
                let {candidate}=data;
                if(peerw.remoteDescription){
                  await peerw.addIceCandidate(candidate)
                }
          }
          
      
        }

      peer.onicecandidate=(e)=>{
        if(e.candidate){
          socket.send(JSON.stringify({
            type:"ice-candidate",
            data:{
              roomId,
              userId,
              candidate:e.candidate
            }
          }))
        }
      }

      peer.onnegotiationneeded=async()=>{
        console.log("Negotiation needed")
        peer=new RTCPeerConnection()
        peer.addTrack(stream.getTracks()[0],stream)
        peer.addTrack(stream.getTracks()[1],stream)
        let offer=await peer.createOffer()
        await peer.setLocalDescription(offer)
        socket.send(JSON.stringify({
          type:"offer",
          data:{
            roomId,
            userId,
            offer
          }
        }))
      }


       
        // //after 2nd part
        // let ws=socket;
        // let peerw=new RTCPeerConnection()

        // console.log("Connected to Sender-closer")
        // peerw.onicecandidate=(e)=>{
        //   if(e.candidate){
        //     ws.send(JSON.stringify({
        //       type:"ice-candidate-forward",
        //       data:{
        //         roomId,
        //         userId,
        //         candidate:e.candidate
        //       }
        //     }))
        //   }
        // }
        // peerw.ontrack=(e)=>{
        //   console.log("Track received")
        // }
        // 
        //   }

        //   
        // }

  }



 
  
},[])

// function StartStream() {
//   console.log("hi")
//   console.log(tracks)
//   let parent = document.getElementById('div');
//   parent.innerHTML = "";

//   const sortedTracks = [...tracks];

//   sortedTracks.forEach((track) => {
//       const containerDiv = document.createElement('div');
//       containerDiv.className = 'video-container';
//       containerDiv.style.margin = '10px';
//       containerDiv.style.display = 'inline-block';

//       const infoDiv = document.createElement('div');
//       infoDiv.textContent = `Room: ${track.roomId}, Index: ${track.index}`;

//       // Create separate video and audio elements
//       if (track.getVideoTracks().length > 0) {
//           const video = document.createElement('video');
//           video.srcObject = track.stream;
//           video.autoplay = true;
//           video.playsInline = true;
//           // Only mute video element, not the audio
//           video.muted = true;
//           video.style.height = '200px';
//           video.style.width = '300px';

//           video.onloadedmetadata = () => {
//               video.play().catch(err => console.error("Video play error:", err));
//           };

//           containerDiv.appendChild(video);
//       }

//       // Add separate audio element for sound
//       if (track.getAudioTracks().length > 0) {
//           const audio = document.createElement('audio');
//           audio.srcObject = track.stream;
//           audio.autoplay = true;
//           // Don't mute the audio element
//           audio.muted = false;

//           // Optional: Add volume control
//           audio.controls = true;

//           containerDiv.appendChild(audio);
//       }

//       containerDiv.appendChild(infoDiv);
//       parent.appendChild(containerDiv);
//   });
// }


const StartStream = async () => {
  const container = document.getElementById("div");
  if (!container) return;

  container.innerHTML = ""; // Clear previous streams

  // Ensure all streams are ready
  for (const stream of tracks) {
    // Create media elements for both audio and video tracks
    for (const track of stream.getTracks()) {
      const mediaElement = document.createElement(track.kind === 'audio' ? 'audio' : 'video');

      // Wait for the stream to be fully ready before setting srcObject
      mediaElement.srcObject = stream;
      mediaElement.autoplay = true;
      mediaElement.controls = true;
      mediaElement.style.width = "100%"; // Adjust as needed

      // Wait for the element to load before appending it
      await new Promise((resolve) => {
        mediaElement.onloadedmetadata = resolve;
      });

      container.appendChild(mediaElement);
    }
  }
};


  return (
    
    
    <>
        <button onClick={StartStream}>START</button>
        <div id='div'>Sender {userId} {roomId}</div>
        
    </>



  )
}

export default Sender