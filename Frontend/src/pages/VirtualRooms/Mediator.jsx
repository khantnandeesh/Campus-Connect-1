import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { mediatorAtom } from '../../atoms/peerAtom'
import { ReactPlayer } from 'react-player'
import { Button } from '@mui/material'
import { loginSuccess } from '../../redux/authslice'
const Mediator = () => {
    let [obja, setObj] = useRecoilState(mediatorAtom)
    let [tracks, setTracks] = useState([])
    let [socket, setSocket] = useState()
    const videoRefs = useRef([]);

    useEffect(() => {
        let ws = new WebSocket("ws://localhost:3001");
        setSocket(ws);

        ws.onopen = () => {
            console.log("Connected to Mediator");

            ws.send(
                JSON.stringify({
                    type: "receiver",
                })
            );

            ws.onmessage = async (msg) => {
                let { type, data } = JSON.parse(msg.data);
                console.log(type, data);
                if (type == "add-peer") {
                    let { index, roomId } = data;
                    console.log("add-peer", index, roomId);

                    let peer = new RTCPeerConnection({
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' }
                        ]
                    });

                    peer.ontrack = (event) => {
                        console.log("Received remote track:", event.streams[0]);
                        // Use the original stream to preserve both audio and video tracks
                        const remoteStream = event.streams[0];

                        setTracks((prev) => {
                            let arr = prev.filter((obj) => obj.index !== index || obj.roomId !== roomId);
                            return [...arr, { index, roomId, stream: remoteStream }];
                        });
                    };

                    peer.onicecandidate = (e) => {
                        if (e.candidate) {
                            ws.send(
                                JSON.stringify({
                                    type: "tickle",
                                    data: {
                                        roomId,
                                        candidate: e.candidate,
                                        index,
                                    },
                                })
                            );
                        }
                    };

                    peer.onnegotiationneeded = async () => {
                        console.log("here also nego needed");



                    }

                    // ✅ Correct way to update state using previous state
                    setObj((prevObj) => {
                        let updatedArray = prevObj[roomId] ? [...prevObj[roomId]] : [];
                        updatedArray[index] = peer;
                        return { ...prevObj, [roomId]: updatedArray };
                    });

                    console.log("Updated obja:", obja); // ❌ Still logs old value (state update is async)

                    ws.send(
                        JSON.stringify({
                            type: "add-peerA",
                            data: {
                                index,
                                roomId,
                            },
                        })
                    );
                }

                if (type === "offer") {
                    console.log("Offer received!");
                    let { roomId, offer, index } = data;

                    setObj((prevObj) => {
                        let peer = prevObj[roomId]?.[index];
                        if (!peer) return prevObj;

                        // Create async function to handle the offer
                        const handleOffer = async () => {
                            try {
                                // Check current signaling state
                                if (peer.signalingState !== "stable") {
                                    console.warn("Peer not in stable state, rolling back");
                                    await Promise.all([
                                        peer.setLocalDescription({ type: "rollback" }),
                                        peer.setRemoteDescription(new RTCSessionDescription(offer))
                                    ]);
                                } else {
                                    await peer.setRemoteDescription(new RTCSessionDescription(offer));
                                }

                                const answer = await peer.createAnswer();
                                await peer.setLocalDescription(answer);

                                ws.send(
                                    JSON.stringify({
                                        type: "answer",
                                        data: {
                                            roomId,
                                            index,
                                            answer,
                                        },
                                    })
                                );
                            } catch (err) {
                                console.error("Error in offer handling:", err);
                            }
                        };

                        handleOffer();
                        return prevObj;
                    });
                }

                if (type === "ice-candidate-main") {
                    let { roomId, index, candidate } = data;

                    setObj((prevObj) => {
                        let peer = prevObj[roomId]?.[index];
                        if (peer) {
                            peer.addIceCandidate(candidate);
                        }
                        return prevObj;
                    });
                }
            };
        };

        return () => {

        };
    }, []);

    useEffect(() => {
        let parent = document.getElementById('div')


    }, [tracks]);

    useEffect(() => {
        console.log("Updated obja:", obja); // ✅ Now it logs the latest value


    }, [obja]);

    function StartStream() {
        let parent = document.getElementById('div');
        parent.innerHTML = "";

        const sortedTracks = [...tracks];

        sortedTracks.forEach((track) => {
            const containerDiv = document.createElement('div');
            containerDiv.className = 'video-container';
            containerDiv.style.margin = '10px';
            containerDiv.style.display = 'inline-block';

            const infoDiv = document.createElement('div');
            infoDiv.textContent = `Room: ${track.roomId}, Index: ${track.index}`;

            // Create separate video and audio elements
            if (track.stream.getVideoTracks().length > 0) {
                const video = document.createElement('video');
                video.srcObject = track.stream;
                video.autoplay = true;
                video.playsInline = true;
                // Only mute video element, not the audio
                video.muted = true;
                video.style.height = '200px';
                video.style.width = '300px';

                video.onloadedmetadata = () => {
                    video.play().catch(err => console.error("Video play error:", err));
                };

                containerDiv.appendChild(video);
            }

            // Add separate audio element for sound
            if (track.stream.getAudioTracks().length > 0) {
                const audio = document.createElement('audio');
                audio.srcObject = track.stream;
                audio.autoplay = true;
                // Don't mute the audio element
                audio.muted = false;

                // Optional: Add volume control
                audio.controls = true;

                containerDiv.appendChild(audio);
            }

            containerDiv.appendChild(infoDiv);
            parent.appendChild(containerDiv);
        });
    }

    return (
        <>
            <Button onClick={StartStream}>Start Stream</Button>
            <Button onClick={async() => {
                

                for (const [key, value] of Object.entries(obja)) {
                    let peerArray = value;
                    for (let i = 0; i < peerArray.length; i++) {


                        let roomIdFilter = tracks.filter((obj) => { return obj.roomId == key })
                        let peerSEND = new RTCPeerConnection();
                        for (let j = 0; j < roomIdFilter.length; j++) {
                            let mediaStream = roomIdFilter[j].stream;



                            peerSEND.addTrack(mediaStream.getTracks()[0], mediaStream)
                            if (mediaStream.getTracks().length > 1) {
                                console.log("adding track 2")
                                peerSEND.addTrack(mediaStream.getTracks()[1], mediaStream)
                            }
                        }
                        let ws = new WebSocket("ws://localhost:3001");


                        peerSEND.createOffer().then((offer) => {
                            peerSEND.setLocalDescription(offer)
                            console.log("ok ok")

                            ws.onopen = () => {
                                console.log("entering for key " + key + " index " + i)
                                ws.send(JSON.stringify({
                                    type: "offerI",
                                    data: {
                                        roomId: key,
                                        index: i,
                                        offer
                                    }
                                }))
                            }
                        })

                        ws.onmessage = (msg) => {
                            let { type, data } = JSON.parse(msg.data)

                            if (type == 'answer-secondary') {
                                let { roomId, index, answer } = data;
                                if (roomId == key && index == i) {
                                    peerSEND.setRemoteDescription(new RTCSessionDescription(answer))

                                }
                            }
                            if (type == 'ice-candidate-forward') {
                                let { roomId, index, candidate } = data;
                                if (roomId == key && index == i) {
                                    peerSEND.addIceCandidate(candidate)
                                }
                            }
                        }

                        peerSEND.onicecandidate = (e) => {

                            if (e.candidate) {
                                if (ws.readyState == WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: "ice-candidate-medi",
                                        data: {
                                            roomId: key,
                                            index: i,
                                            candidate: e.candidate
                                        }
                                    }))
                                }

                            }
                        }
                        console.log(i +"waiting !")
                       
                        await new Promise(resolve => setTimeout(resolve, 15500));
                        ws=null
                    }
                }
            }}>EMIT STREAM AND AUTO</Button>
            <div id='div'>

            </div>
        </>

    )
}

export default Mediator