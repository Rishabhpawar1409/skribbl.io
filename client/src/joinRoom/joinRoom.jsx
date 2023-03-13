import React, { useEffect, useState } from "react";
import "../home/home.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AiFillCamera } from "react-icons/ai";

const JoinRoom = ({ uuid, socket }) => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const data = [
    { id: 1, avatar: "/assets/avatar_1.jpg" },
    { id: 2, avatar: "/assets/avatar_2.jpg" },
    { id: 3, avatar: "/assets/avatar_3.jpg" },
    { id: 4, avatar: "/assets/avatar_4.jpg" },
    { id: 5, avatar: "/assets/avatar_5.jpg" },
    { id: 6, avatar: "/assets/avatar_6.jpg" },
    // { id: 7, avatar: "assets/background.png" },
  ];

  const howToPlay = [
    {
      id: 1,
      avatar: "/assets/step1.gif",
      text: "When it's your turn, choose a word you want to draw!",
    },
    {
      id: 2,
      avatar: "/assets/step2.gif",
      text: "Try to draw your choosen word! No spelling!",
    },
    {
      id: 3,
      avatar: "/assets/step3.gif",
      text: "Let other players try to guess your drawn word!",
    },
    {
      id: 4,
      avatar: "/assets/step4.gif",
      text: "When it's not your turn, try to guess what other players are drawing!",
    },
    {
      id: 5,
      avatar: "/assets/step5.gif",
      text: "Score the most points and be crowned the winner at the end!",
    },
  ];

  const [userName, setUserName] = useState("");
  const [input, setInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [userData, setUserData] = useState("");
  const [rooms, setRooms] = useState(null);
  const [selectedStep, setSelectedStep] = useState(howToPlay[0]);
  const [renderMusicGuide, setRenderMusicGuide] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  useEffect(() => {
    socket.emit("joinRoom rooms");
    socket.on("rooms", (rooms) => {
      setRooms(rooms);
    });
  }, []);

  // function for submitting the Username

  const handleSubmit = (e) => {
    e.preventDefault();
    setUserName(input);
    setInput("");
  };

  // function for selecting the avatar
  const handleSelect = (obj) => {
    setUserData(obj);
  };

  // function to join the room

  const handleJoin = (e) => {
    e.preventDefault();
  };

  // function to upload the image from the device

  const fileHandler = (e) => {
    const [file] = e.target.files;
    if (file) {
      const pattern = /^image\/(png|jpeg|jpg|gif)$/;
      if (pattern.test(file.type)) {
        const obj = { id: 7, avatar: URL.createObjectURL(file) };
        setUserData(obj);
        setIsUploaded(true);
      } else {
        console.log("invalid image");
      }
    }
  };

  // function to create the room,it will navigate the user specific room, it will also emit the socket to create the room in rooms object
  // in server and join method for room in socket.

  const createRoom = () => {
    const roomData = {
      roomId: uuid(),
      userId: socket.id,
      userAvatar: userData.avatar,
      host: true,
      userName,
      joinedTimestamp: Date.now(),
    };
    if (userName && userData !== "") {
      socket.emit("create-room", roomData);
      navigate(`/${roomData.roomId}`);
    }
  };

  // function to join the room,it will navigate the user to specific room , it will emit the socket to join the room
  const joinRoom = () => {
    const roomData = {
      roomId,
      userId: socket.id,
      userAvatar: userData.avatar,
      host: false,
      userName,
      joinedTimestamp: Date.now(),
    };
    if (userName && userData !== "") {
      if (rooms[roomId].players.length === 0) {
        navigate("/Invalid_room_Id");
      } else {
        socket.emit("join-room", roomData);
        navigate(`/${roomData.roomId}`);
      }
    }
  };

  const handleRandom = () => {
    const random = data[Math.floor(Math.random() * data.length)];
    setUserData(random);
  };

  const selectStep = (item) => {
    setRenderMusicGuide(false);
    setSelectedStep(item);
  };

  const musicGuide = () => {
    setSelectedStep("");
    setRenderMusicGuide(true);
  };
  return (
    <div className="avatar-window">
      <>
        <span className="textHeader">
          <img src="/assets/skribblLogo.gif" alt="Scribbl" loading="lazy" />
        </span>
      </>
      <div className="menu-container">
        <div className="input-random-container">
          <form
            className="input-container"
            onSubmit={(e) => {
              handleSubmit(e);
            }}
          >
            <input
              value={input}
              type="text"
              placeholder="Enter your name"
              className="userName-input"
              onChange={(e) => {
                setInput(e.target.value);
              }}
            />
          </form>

          <div className="randomIcon-container">
            <img
              onClick={() => {
                handleRandom();
              }}
              className="random-icon"
              src="/assets/randomize.gif"
              alt="random button"
              loading="lazy"
            />
          </div>
        </div>
        <div className="avatars-conatiner">
          {data.map((obj, index) => {
            return (
              <div
                key={index}
                className={
                  userData && userData.id === obj.id
                    ? "selected-avatarBox"
                    : "avatarBox"
                }
              >
                <div className="AvatarImage">
                  <img
                    className="image"
                    src={obj.avatar}
                    alt="avatr"
                    onClick={() => {
                      handleSelect(obj);
                    }}
                    loading="lazy"
                  />
                </div>
                <div className="userName-container">
                  {userData && userData.id === obj.id ? (
                    <p className="userName">{userName}</p>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            );
          })}
          {isUploaded ? (
            <div className="selected-avatarBox">
              <div className="AvatarImage">
                <img
                  className="image"
                  src={userData.avatar}
                  loading="lazy"
                  alt="Uploaded Avatar"
                />
              </div>
              <div className="userName-container">
                <p className="userName">{userName}</p>
              </div>
            </div>
          ) : (
            <div className="Upload-avatarBox">
              <div className="uploadImage-container">
                <input
                  type="file"
                  id="file-input"
                  className="file-input"
                  onChange={(e) => {
                    fileHandler(e);
                  }}
                />
                <label htmlFor="file-input">
                  <AiFillCamera className="camera-icon" />
                </label>
              </div>
            </div>
          )}
        </div>
        <div>
          <form
            className="join-conatiner"
            onSubmit={(e) => {
              handleJoin(e);
            }}
          >
            <input
              type="text"
              placeholder="Enter room id "
              className="join-input"
              value={roomId}
              onChange={(e) => {
                setLinkInput(e.target.value);
              }}
            />

            <button
              className="joinBtn"
              onClick={() => {
                joinRoom();
              }}
            >
              Join!
            </button>
          </form>
        </div>

        <div className="createRoom-conatiner">
          <button
            className="createBtn"
            onClick={() => {
              createRoom();
            }}
          >
            Create Private Room
          </button>
        </div>
        {/* </Link> */}
      </div>
      <div className="Game-container">
        <div className="child-container">
          <div className="child-first-container">
            <div className="questionMarkLogo-container">
              <img
                style={{ height: "35px" }}
                src="/assets/about.gif"
                alt="About gif"
                loading="lazy"
              />
            </div>
            <div className="TextAbout-container">
              <span className="aboutText">About</span>
            </div>
          </div>
          <div className="child-second-container">
            <div className="mainImage-container">
              <div className="OwnerImage-container">
                <img
                  className="ownerImage"
                  src="/assets/Rishabh.jpg"
                  alt="Rishabh Pawar"
                  loading="lazy"
                />
              </div>
            </div>
            <span style={{ marginTop: "1rem" }}>
              Welcome to skribbl.io, the ultimate multiplayer drawing and
              guessing game! My name is Rishabh Pawar, and I built this amazing
              game from the ground up as a full stack web developer with a
              passion for creating fun and interactive experiences.
            </span>
            <span
              className="readMoreText"
              onClick={() => {
                navigate("/about");
              }}
            >
              Read more...
            </span>
          </div>
        </div>

        <div className="child-container">
          <div className="child-1">
            <div className="howLogo-container">
              <img
                src="/assets/how.gif"
                alt="pencil"
                className="pencil-logo"
                loading="lazy"
              />
            </div>
            <div className="howToPlayText-container">
              <span className="howToPlay-text">How to play</span>
            </div>
          </div>
          <div className="child-2">
            <div className="steps">
              {!renderMusicGuide ? (
                <>
                  <div className="stepImage-container">
                    <img src={selectedStep.avatar} alt="step" loading="lazy" />
                  </div>
                  <div className="step-textContainer">
                    <span>{selectedStep.text}</span>
                  </div>
                </>
              ) : (
                <div className="musicGuides">
                  <span>Guide for music controls :</span>
                  <br></br>
                  <br></br>
                  <b style={{ fontSize: "16px" }}>To </b>
                  <span>
                    play music/song write ".play xyz(music name)" command in
                    chat input.
                  </span>
                  <br></br>
                  <br></br>
                  <b style={{ fontSize: "16px" }}>To </b>
                  <span>
                    pause the music/song write ".pause" command in chat input.
                  </span>
                  <br></br>
                  <br></br>
                  <b style={{ fontSize: "16px" }}>To </b>
                  <span>
                    resume the music/song write ".resume" command in chat input.
                  </span>
                  <br></br>
                  <br></br>
                  <b style={{ fontSize: "16px" }}>To </b>
                  <span>
                    repeat the music/song write ".repeat" command in chat input.
                  </span>
                </div>
              )}
            </div>
            <div className="dots">
              {howToPlay.map((item) => {
                return (
                  <div
                    onClick={() => {
                      selectStep(item);
                    }}
                    className={
                      selectedStep.id === item.id ? "selectedDot" : "dot"
                    }
                    key={item.id}
                  ></div>
                );
              })}
              <div
                onClick={() => {
                  musicGuide();
                }}
                className={renderMusicGuide ? "selectedDot" : "dot"}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default JoinRoom;
