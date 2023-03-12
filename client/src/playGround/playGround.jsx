import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef, useState } from "react";
import "./playGround.css";
import { MdOutlineDeleteForever } from "react-icons/md";

const PlayGround = ({
  socket,
  roomsData,
  roomCode,
  players,
  playerTurn,
  whosTurn,
}) => {
  const colors = [
    "red",
    "green",
    "cyan",
    "blue",
    "pink",
    "black",
    "yellow",
    "brown",
    "orange",
    "gold",
    "purple",
    "lime",
    "silver",
  ];
  const fonts = ["2", "5", "8", "10"];
  const [selectedColor, setSelectedColor] = useState(colors[5]);
  const [selectedFont, setSelectedFont] = useState("2");
  const [lastPosition, setPosition] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);
  const [canvasImageUrl, setCanavasImageUrl] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState({});

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    players.map((player) => {
      return player.id === socket.id ? setCurrentPlayer(player) : "";
    });
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
      contextRef.current.canvas.width = window.innerWidth / 2;
      contextRef.current.canvas.height = window.innerHeight / 2;
    }

    socket.on("canvas picture", (imageURL) => {
      setCanavasImageUrl(imageURL);
    });
  }, []);

  const onMouseDown = (e) => {
    setPosition({
      x: e.pageX,
      y: e.pageY,
    });
    setMouseDown(true);
  };

  const onMouseUp = (e) => {
    setMouseDown(false);
  };

  const onMouseLeave = (e) => {
    setMouseDown(false);
  };

  const draw = useCallback(
    (x, y) => {
      if (mouseDown) {
        contextRef.current.beginPath();
        contextRef.current.strokeStyle = selectedColor;
        contextRef.current.lineWidth = selectedFont;
        contextRef.current.lineJoin = "round";
        contextRef.current.moveTo(lastPosition.x, lastPosition.y);
        contextRef.current.lineTo(x, y);
        contextRef.current.closePath();
        contextRef.current.stroke();
        timeOut();
        setPosition({
          x,
          y,
        });
      }
    },
    [lastPosition, mouseDown, selectedColor, setPosition, selectedFont]
  );

  // converting the canvas data into a image URL
  const timeOut = () => {
    setTimeout(() => {
      const dataURL = canvasRef.current && canvasRef.current.toDataURL();
      // console.log(dataURL);
      socket.emit("share canvas", { dataURL, roomsData, roomCode });
    }, 1000);
  };

  const onMouseMove = (e) => {
    draw(e.pageX, e.pageY);
  };

  const click = () => {
    contextRef.current.clearRect(
      0,
      0,
      contextRef.current.canvas.width,
      contextRef.current.canvas.height
    );
  };
  // if (whosTurn !== null) {
  //   if (whosTurn.id !== socket.id) {
  //     console.log("It's not my turn im just gonna see the picture!");
  //   } else {
  //     console.log("Yeah it's my turn i'm gonna draw the picture!");
  //   }
  // }

  return whosTurn !== null ? (
    whosTurn.id !== socket.id ? (
      <div className="pictureContainer">
        <img src={canvasImageUrl} path="drawing.." />
      </div>
    ) : (
      <>
        <canvas
          className="canvas-container"
          ref={canvasRef}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
        />
        <div className="canvas-actionContainer">
          {colors.map((color, index) => {
            return (
              <div
                onClick={() => {
                  setSelectedColor(colors[index]);
                }}
                key={index}
                className="ogColors"
                style={{ backgroundColor: color }}
              ></div>
            );
          })}
          <MdOutlineDeleteForever
            className="clearBtn"
            onClick={() => {
              click();
            }}
          />

          <div className="fontsContainer">
            {fonts.map((font, index) => {
              return (
                <span
                  key={index}
                  className={
                    selectedFont === font
                      ? "selectedFont-container"
                      : "font-container"
                  }
                  onClick={() => {
                    setSelectedFont(font);
                  }}
                >
                  {font}
                </span>
              );
            })}
          </div>
        </div>
      </>
    )
  ) : (
    ""
  );
};
export default PlayGround;
