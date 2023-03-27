import React, { useEffect, useState } from "react";
import "./gameOver.css";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

const GameOver = ({ players, scoreCard }) => {
  const [playersData, setPlayersData] = useState([]);
  useEffect(() => {
    const sortedPlayers = [];
    scoreCard.map((scorer) => {
      players.map((player) => {
        if (scorer.playerId === player.id) {
          const soloPlayer = { player, score: scorer.score };
          sortedPlayers.push(soloPlayer);
        }
      });
    });
    setPlayersData(sortedPlayers.sort((a, b) => b.score - a.score));
  }, []);

  const navigate = useNavigate();
  const goToHome = () => {
    navigate("/");

    setPlayersData([]);
  };

  return (
    <div className="gameOver-window">
      <div className="gameOver-container">
        <div className="gameOverText-container">
          <div className="homeText-container">
            <FaHome
              className="home"
              onClick={() => {
                goToHome();
              }}
            />
          </div>
          <span
            style={{
              color: "white",
              fontSize: "25px",
              textShadow: "3px 3px 0 #0000002b",
              flex: 2,
            }}
          >
            GAME OVER!
          </span>
        </div>

        <div className="scoreCard-container">
          {playersData.length !== 0 &&
            playersData.map((checker, index) => {
              return (
                <div className="individualScore-container" key={index}>
                  <span className="rank"># {index + 1}</span>
                  <div
                    style={{ margin: "1rem" }}
                    className="userImage-container"
                  >
                    <img
                      className="userImage"
                      src={checker.player.userAvatar}
                      alt={checker.player.userName}
                      loading="lazy"
                    />
                  </div>
                  <span className="name">{checker.player.userName}</span>
                  <span className="score">{checker.score}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
export default GameOver;
