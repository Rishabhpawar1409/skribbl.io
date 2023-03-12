import React, { useEffect, useState } from "react";
import "./gameOver.css";
import { useNavigate } from "react-router-dom";

const GameOver = ({ socket, players, scoreCard }) => {
  const navigate = useNavigate();
  // console.log("I got the data in game over:", players, scoreCard);

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="gameOver-window">
      <div className="gameOver-container">
        <div className="gameOverText-container">
          <span
            style={{
              color: "white",
              fontSize: "25px",
              textShadow: "3px 3px 0 #0000002b",
            }}
          >
            GAME OVER!
          </span>
        </div>

        <div className="scoreCard-container">
          {players &&
            players.map((player, index) => {
              return (
                <div className="individualSCore-container">
                  <span className="rank"># {index + 1}</span>
                  <span className="name">{player.userName}</span>
                  {scoreCard &&
                    scoreCard.map((playerScore) => {
                      return playerScore.playerId === player.id ? (
                        <span className="score">{playerScore.score}</span>
                      ) : (
                        ""
                      );
                    })}
                </div>
              );
            })}
          {/* <div className="individualScore-container">
            <span className="rank">#1</span>
            <span className="name">Rishabh</span>
            <span className="score">400</span>
          </div>
          <div className="individualScore-container">
            <span className="rank">#2</span>
            <span className="name">Shango</span>
            <span className="score">300</span>
          </div>
          <div className="individualScore-container">
            <span className="rank">#3</span>
            <span className="name">Sunny</span>
            <span className="score">100</span>
          </div> */}
        </div>

        <div className="homeText-container">
          <span
            className="home"
            onClick={() => {
              goToHome();
            }}
          >
            Home
          </span>
        </div>
      </div>
    </div>
  );
};
export default GameOver;
