import React, { useEffect, useState } from "react";
import "./App.css";
import Home from "./home/home";
import Lobby from "./lobby/lobby";
import GameOver from "./gameOver/gameOver";
import JoinRoom from "./joinRoom/joinRoom";
import InvalidRoom from "./invalidRoom/invalidRoom";
import About from "./about/about";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

function App() {
  const socket = io("http://localhost:3001");
  const roomId = "3243fa52-7c2d-423a-93bf-f1772fdac07a";
  const [message, setMessage] = useState("");
  const [playersData, setPlayersData] = useState([]);
  const [scoreBoard, setScoreBoard] = useState([]);

  useEffect(() => {
    socket.on("connect", () => {
      socket.on("welcome", (data) => {
        console.log("message from server", data);
      });

      socket.emit("msg", "Thanks for connecting");
    });

    socket.on("end the game", ({ players, scoreCard }) => {
      setPlayersData(players);
      setScoreBoard(scoreCard);
    });
  }, []);
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            exact
            path="/"
            element={<Home uuid={uuidv4} socket={socket} />}
          />
          <Route exact path="/about" element={<About />} />
          <Route
            exact
            path="/join/:roomId"
            element={<JoinRoom uuid={uuidv4} socket={socket} />}
          />
          <Route
            exact
            path="/:roomId"
            element={<Lobby message={message} socket={socket} />}
          />
          <Route
            exact
            path="/gameOver"
            element={<GameOver players={playersData} scoreCard={scoreBoard} />}
          />
          <Route exact path="/Invalid_room_Id" element={<InvalidRoom />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
