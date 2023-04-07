import React from "react";
import { useEffect, useState, useRef } from "react";
import "./playGround.css";
import { MdOutlineDeleteForever } from "react-icons/md";
import { ReactSketchCanvas } from "react-sketch-canvas";

const PlayGround = ({
  socket,
  roomsData,
  roomCode,
  players,
  playerTurn,
  whosTurn,
  style,
}) => {
  const sketchRef = useRef(null);
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
  const [currentPlayer, setCurrentPlayer] = useState({});
  const [canvasImageUrl, setCanavasImageUrl] = useState("");

  useEffect(() => {
    players.map((player) => {
      return player.id === socket.id ? setCurrentPlayer(player) : "";
    });
  }, []);

  useEffect(() => {
    socket.on("canvas picture", (imageURL) => {
      setCanavasImageUrl(imageURL);
    });
  }, []);

  const onColorSelect = (color) => {
    setSelectedColor(color);
  };

  const onFontSelect = (font) => {
    setSelectedFont(font);
  };

  const onClearCanvas = () => {
    sketchRef.current.resetCanvas();
  };
  const shareCanvasImage = async () => {
    try {
      const imageURL = await sketchRef.current.exportImage("png");
      socket.emit("share canvas", { imageURL, roomsData, roomCode });
    } catch (error) {
      console.log(error);
    }
  };
  const timeOut = () => {
    setTimeout(() => {
      shareCanvasImage();
    }, 1000);
  };
  return whosTurn !== null ? (
    whosTurn.id !== socket.id ? (
      <div className="pictureContainer">
        <img src={canvasImageUrl} path="drawing.." />
      </div>
    ) : (
      <>
        <ReactSketchCanvas
          ref={sketchRef}
          width={style.width}
          height={style.height}
          strokeWidth={selectedFont}
          strokeColor={selectedColor}
          onChange={() => {
            timeOut();
          }}
        />
        <div className="canvas-actionContainer">
          {colors.map((color, index) => {
            return (
              <div
                onClick={() => {
                  onColorSelect(color);
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
              onClearCanvas();
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
                    onFontSelect(font);
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
