import React, { useState, useEffect, useRef } from "react";
import { Peer } from "peerjs";

const VoiceChat = ({ socket }) => {
  const [peer, setPeer] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    const peer = new Peer();
    setPeer(peer);
    peer.on("open", (id) => {
      console.log("Peer is initialized and given you this funckinn Id,", id);
    });

    // getting the localstream(means taking permission for the audio of the currentUser).

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then((stream) => {
        setLocalStream(stream);
      });

    // Handeling incoming calls.

    peer.on("call", (call) => {
      console.log("is their any call,", call);
      // Answer the call
      call.answer(localStream);

      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.play();
      console.log("localStream", localStream);

      // Set the remote stream
      call.on("stream", (stream) => {
        console.log("stream", stream);
        setRemoteStream(stream);
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play();
      });
    });

    // Handelling peer conection ,so that the peer can use data.
    peer.on("connection", (conn) => {
      // Set the peer ID
      setPeerId(conn.peer);

      // Send the peer ID to the server
      socket.emit("peerId", conn.peer);

      // Handle requests to mute or unmute the microphone
      conn.on("data", (data) => {
        if (data === "mute") {
          localStream.getAudioTracks()[0].enabled = false;
        } else if (data === "unmute") {
          localStream.getAudioTracks()[0].enabled = true;
        }
      });
    });
  }, []);

  return (
    <div>
      <p>VoiceChat</p>
      <audio ref={localAudioRef} />
      <audio ref={remoteAudioRef} />
    </div>
  );
};
export default VoiceChat;
