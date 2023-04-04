import { useState, useEffect, useRef } from "react";
import "./lobby.css";
import PlayGround from "../playGround/playGround";
import VoiceChat from "../voiceChat";
import { TbShoeOff, TbShoe } from "react-icons/tb";
import { useNavigate, useParams } from "react-router-dom";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";

const Lobby = ({ socket }) => {
  const { roomId } = useParams();
  const port = window.location.port ? `:${window.location.port}` : "";
  const joinLink = `${window.location.protocol}//${window.location.hostname}${port}/join/${roomId}`;

  const navigate = useNavigate();
  const [playFlagTurn, setPlayFlagTurn] = useState(false);
  const [input, setInput] = useState("");
  const [roomsData, setRoomsData] = useState();
  const [showLink, setShowLink] = useState(false);
  const [renderPlay, setRenderPlay] = useState(false);
  const [mute, setMute] = useState(true);
  const [displayMicText, setDisplayMicText] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  const [messages, setMessages] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [players, setPLayers] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(null);
  const [word, setWord] = useState("");
  const [whosTurn, setWhosTurn] = useState(null);

  const [choosingWord, setChoosingWord] = useState(false);
  const [isWordChosed, setIsWordChosed] = useState(false);
  const [onGoingRound, setOnGoingRound] = useState("1");
  const [thresholdValue, setThresholdValue] = useState(2);
  const [distance, setDistance] = useState(0);

  const [numbPlayers, setNumbPlayers] = useState("8");
  const [drawTime, setDrawTime] = useState("30");
  const [rounds, setRounds] = useState("3");
  const [wordCount, setWordCount] = useState("2");
  const [hints, setHints] = useState("0");

  const [mySelf, setMySelf] = useState(null);
  const [spaces, setSpaces] = useState([]);

  const [scoreCard, setScoreCard] = useState([]);
  const [renderRounds, setRenderRounds] = useState(false);

  const songRef = useRef("");
  let currSongName;

  // this timeout id is for choosing the word timer.
  const [timeoutId, setTimeoutId] = useState(null);
  const [currSongObj, setCurrSongObj] = useState("");

  // this timeout is for playing the turn timer.
  const [playTimeoutId, setPlayTimeoutId] = useState(null);

  const [words, setWords] = useState([]);
  const [controlsForAll, setControlsForAll] = useState(true);

  useEffect(() => {
    socket.on("change settings", (boolean) => {
      setUseCustom(boolean);
    });
    socket.on("update messages", ({ rooms, roomCode }) => {
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });
    // Music controls!
    socket.on("musicForAll", () => {
      setControlsForAll(true);
    });
    socket.on("musicForHost", () => {
      setControlsForAll(false);
    });
    // when a user left the game.
    socket.on("you left", () => {
      navigate("/");
    });

    socket.on("you got kick", (currentPlayer) => {
      if (currentPlayer.id === socket.id) {
        console.log("you got kicked from the room.");
        navigate("/Invalid_room_Id");
      }
    });

    socket.emit("rooms");
    socket.on("rooms", (rooms) => {
      if (!rooms[roomId]) {
        navigate("/Invalid_room_Id");
      }
    });
    // socket for words:
    socket.on(
      "got words",
      ({ gotWords, player, roomCode, drawTime, hints }) => {
        let wordScreen = true;
        setWords(gotWords);
        if (socket.id === player.id) {
          const newTimeoutId = setTimeout(() => {
            wordScreen = false;
            socket.emit("choosing word false", { roomCode, wordScreen });
            const selectedWord =
              gotWords[Math.floor(Math.random() * gotWords.length)];
            if (hints !== "0") {
              renderHints(selectedWord.text, drawTime, hints, roomCode);
            }

            setWord(selectedWord.text);
            socket.emit("word selected", { roomCode, selectedWord, player });
          }, 15000);
          setTimeoutId(newTimeoutId);
        }
      }
    );
    // socket for user get disconnected.
    socket.on("player disconnected", ({ rooms, roomId }) => {
      const localPlayers = rooms[roomId].players;
      localPlayers.map((checker) => {
        if (checker.id === socket.id) {
          return setMySelf(checker);
        }
      });
      const scores = rooms[roomId].scoreBoard;
      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomId].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });
      setPLayers(localPlayers);
      setMessages(filteredMessages);
      setScoreCard(scores);
    });

    socket.on("player left", ({ roomCode, rooms }) => {
      const localPlayers = rooms[roomCode].players;
      const scores = rooms[roomCode].scoreBoard;
      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });
      setPLayers(localPlayers);
      setMessages(filteredMessages);
      setScoreCard(scores);
    });
    // socket for music.
    socket.on("video data", ({ songObject, roomCode, rooms }) => {
      currSongName = songObject.songName;
      songRef.current.src = songObject.url;
      songRef.current.play();
      setCurrSongObj(songObject);

      // To update messages.
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });

    socket.on("repeat the song", ({ currSongObj, rooms, roomCode }) => {
      songRef.current.src = currSongObj.url;
      songRef.current.play();
      // To update messages.
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });

    socket.on("song resumed", ({ rooms, roomCode }) => {
      songRef.current.play();
      // To update messages.
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });

    socket.on("pause action", ({ rooms, roomCode }) => {
      songRef.current.pause();

      // To update messages.
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });
    socket.on("limit exceeded", ({ roomCode, rooms }) => {
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
      console.log("Wait for some time ,limit exceeded!");
    });

    socket.on("user is joined", ({ rooms, roomId }) => {
      const localPlayers = rooms[roomId].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomId].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });

    socket.on("set song data", (songData) => {
      setCurrSongObj(songData);
      songRef.current.src = songData.url;
      songRef.current.currentTime = songData.currTime;
      songRef.current.play();
    });

    socket.on("room data", ({ roomId, rooms }) => {
      const songData = {
        songName: currSongName,
        url: songRef.current.src,
        duration: songRef.current.duration,
        currTime: songRef.current.currentTime,
      };
      if (songData.url !== "") {
        socket.emit("song data", { songData, roomId });
      }

      const localPlayers = rooms[roomId].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomId].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });
      setMessages(filteredMessages);
      setScoreCard(rooms[roomId].scoreBoard);

      for (let i = 0; i < localPlayers.length; i++) {
        if (localPlayers[i].id === socket.id) {
          setMySelf(localPlayers[i]);
        }
      }

      setRounds(rooms[roomId].roomSettings.rounds);
      setNumbPlayers(rooms[roomId].roomSettings.players);
      setDrawTime(rooms[roomId].roomSettings.drawTime);
      setHints(rooms[roomId].roomSettings.hints);
      setWordCount(rooms[roomId].roomSettings.wordCount);
      setRoomCode(roomId);
      setRoomsData(rooms);
      setPLayers(rooms[roomId].players);
      setControlsForAll(rooms[roomId].musicControlsForAll);
      setUseCustom(rooms[roomId].useCustomWords);
    });

    socket.on("game condition", ({ rooms, roomCode }) => {
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });

    socket.on("game started", ({ mssg, participants }) => {
      setRenderRounds(true);
      setRenderPlay(true);
      const filteredMessages = [];
      participants.map((player) => {
        if (player.id === socket.id) {
          mssg.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });
      setMessages(filteredMessages);
    });

    socket.on("msg array", ({ mssg, participants }) => {
      const filteredMessages = [];
      participants.map((player) => {
        if (player.id === socket.id) {
          mssg.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });
      setMessages(filteredMessages);
    });

    // socket for game settings!
    socket.on("round settings", (data) => {
      setRounds(data);
    });

    socket.on("draw timer settings", (data) => {
      setDrawTime(data);
    });

    socket.on("number of player settings", (data) => {
      setNumbPlayers(data);
    });

    socket.on("number of hints settings", (data) => {
      setHints(data);
    });

    socket.on("word count settings", (data) => {
      setWordCount(data);
    });

    // sockets for sharing onGoing gamedata.
    socket.on(
      "play the turn",
      ({ playerTurn, mssg, participants, newTimeoutIdForPlayTimer }) => {
        setPlayTimeoutId(newTimeoutIdForPlayTimer);
        setRenderRounds(false);
        setWhosTurn(playerTurn);

        const filteredMessages = [];
        participants.map((player) => {
          if (player.id === socket.id) {
            mssg.map((msg) => {
              if (msg.msgTimestamp >= player.joinedTimestamp) {
                return filteredMessages.push(msg);
              }
            });
          }
        });
        setMessages(filteredMessages);
      }
    );

    socket.on("this is the word", ({ selectedWord, mssg, participants }) => {
      const underscores = Array(selectedWord.text.length).fill("_");
      setSpaces(underscores);
      setWord(selectedWord.text);

      const filteredMessages = [];
      participants.map((player) => {
        if (player.id === socket.id) {
          mssg.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });
      setMessages(filteredMessages);
    });

    socket.on("display the msg from the server", ({ roomCode, rooms }) => {
      const localPlayers = rooms[roomCode].players;

      const filteredMessages = [];
      localPlayers.map((player) => {
        if (player.id === socket.id) {
          rooms[roomCode].messages.map((msg) => {
            if (msg.msgTimestamp >= player.joinedTimestamp) {
              return filteredMessages.push(msg);
            }
          });
        }
      });

      setMessages(filteredMessages);
    });

    socket.on(
      "display the msg from the server on correct guess",
      ({ roomCode, rooms }) => {
        const localPlayers = rooms[roomCode].players;

        setScoreCard(rooms[roomCode].scoreBoard);

        setPLayers(localPlayers);

        const filteredMessages = [];
        localPlayers.map((player) => {
          if (player.id === socket.id) {
            rooms[roomCode].messages.map((msg) => {
              if (msg.msgTimestamp >= player.joinedTimestamp) {
                return filteredMessages.push(msg);
              }
            });
          }
        });

        setMessages(filteredMessages);
      }
    );

    socket.on(
      "player is choosing the word is true",
      ({ wordScreen, mssg, participants }) => {
        setChoosingWord(wordScreen);

        const filteredMessages = [];
        participants.map((player) => {
          if (player.id === socket.id) {
            mssg.map((msg) => {
              if (msg.msgTimestamp >= player.joinedTimestamp) {
                return filteredMessages.push(msg);
              }
            });
          }
        });
        setMessages(filteredMessages);
      }
    );

    socket.on("player is choosing the word is false", (wordScreen) => {
      setChoosingWord(wordScreen);
    });

    socket.on("turn got over", ({ rooms, roomCode, currPlayerIndex }) => {
      setPLayers(rooms[roomCode].players);
      setRoomCode(roomCode);
      setWord("");
    });

    socket.on("onGoing game data after next round started", (currRound) => {
      setRenderRounds(true);
      setOnGoingRound(currRound);
      // console.log(`Round no. ${currRound} started!`);
    });

    socket.on("this is the hint", ({ hintObj, guessWord, renderedHints }) => {
      const underscores = Array(guessWord.length).fill("_");

      for (let i = 0; i < renderedHints.length; i++) {
        const hintIndex = guessWord.indexOf(renderedHints[i].hint);
        if (hintIndex !== -1) {
          underscores[hintIndex] = renderedHints[i].hint;
        }
      }
      setSpaces(underscores);
    });

    socket.on("its kicks data", ({ playersData, rooms, roomCode }) => {
      playersData.map((player) => {
        if (player.id === socket.id) {
          return setMySelf(player);
        }
      });
      setPLayers(playersData);
      const filteredMessages = [];
      rooms[roomCode].players.length > 0 &&
        rooms[roomCode].players.map((player) => {
          if (player.id === socket.id) {
            return rooms[roomCode].messages.map((msg) => {
              if (msg.msgTimestamp >= player.joinedTimestamp) {
                return filteredMessages.push(msg);
              }
            });
          }
        });
      setMessages(filteredMessages);
    });

    socket.on("player got kicked", ({ currentPlayer, rooms, roomCode }) => {
      const filteredMessages = [];
      rooms[roomCode].players.length > 0 &&
        rooms[roomCode].players.map((player) => {
          if (player.id === socket.id) {
            return rooms[roomCode].messages.map((msg) => {
              if (msg.msgTimestamp >= player.joinedTimestamp) {
                return filteredMessages.push(msg);
              }
            });
          }
        });
      setMessages(filteredMessages);
    });

    socket.on(
      "immediately end the turn",
      ({ roomCode, playTimeoutId, players }) => {
        allPlayerGuessedIt(players, playTimeoutId, roomCode);
      }
    );

    socket.on("end the game", () => {
      navigate("/gameOver");
    });
  }, []);

  // function to submit the chat form
  const handleSubmit = (e) => {
    const myTimestamp = mySelf.joinedTimeStamp;
    e.preventDefault();

    if (whosTurn && whosTurn.id !== socket.id) {
      players.map((player) => {
        if (player.id === socket.id) {
          if (player.isGuessed === false) {
            if (word === input) {
              socket.emit("word guessed correctly", {
                roomCode,
                mySelf,
                playTimeoutId,
              });
            } else {
              levenshteinDistance(word, input);

              socket.emit("send message", {
                msg: {
                  text: input,
                  id: socket.id,
                  server: false,
                  serverSpecial: false,
                  msgTimestamp: Date.now(),
                },
                roomCode,
                myTimestamp,
              });
            }
          } else {
            if (word !== input) {
              socket.emit("send message", {
                msg: {
                  text: input,
                  id: socket.id,
                  server: false,
                  serverSpecial: false,
                  msgTimestamp: Date.now(),
                },
                roomCode,
                myTimestamp,
              });
            }
          }
        }
      });
    } else {
      if (word !== input) {
        socket.emit("send message", {
          msg: {
            text: input,
            id: socket.id,
            server: false,
            serverSpecial: false,
            msgTimestamp: Date.now(),
          },
          roomCode,
          myTimestamp,
        });
      }
    }

    // Music controls!

    if (controlsForAll === true) {
      // condition to send the socket to play the song!
      if (input.startsWith(".play ")) {
        const searchInput = input.substring(6);
        socket.emit("testing input", { roomCode, searchInput });
      }
      // consdition to pause the song!
      if (input === ".pause") {
        socket.emit("pause music", roomCode);
      }

      // condition to resume the song!
      if (input === ".resume") {
        socket.emit("resume the music", roomCode);
      }

      // condition to repeat the song!
      if (input === ".repeat") {
        socket.emit("repeat", { roomCode, currSongObj });
      }
    } else {
      if (mySelf.host === true) {
        // condition to send the socket to play the song!
        if (input.startsWith(".play ")) {
          const searchInput = input.substring(6);
          socket.emit("testing input", { roomCode, searchInput });
        }
        // consdition to pause the song!
        if (input === ".pause") {
          socket.emit("pause music", roomCode);
        }

        // condition to resume the song!
        if (input === ".resume") {
          socket.emit("resume the music", roomCode);
        }

        // condition to repeat the song!
        if (input === ".repeat") {
          socket.emit("repeat", { roomCode, currSongObj });
        }
      }
    }

    setInput("");
  };

  const levenshteinDistance = (s, t) => {
    // s is the guess word && t is the input of the player!
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
      arr[i] = [i];
      for (let j = 1; j <= s.length; j++) {
        arr[i][j] =
          i === 0
            ? j
            : Math.min(
                arr[i - 1][j] + 1,
                arr[i][j - 1] + 1,
                arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
              );
      }
    }
    setDistance(arr[t.length][s.length]);
  };

  useEffect(() => {
    if (distance !== 0) {
      if (distance <= thresholdValue) {
        socket.emit("word guessed is close", { roomCode, mySelf });
      }
    }
  }, [distance]);

  // function to render invite friend or link text

  const handleShowText = () => {
    setShowLink(!showLink);
  };

  const functionMic = () => {
    setMute(!mute);
    setDisplayMicText(true);
    setTimeout(() => {
      setDisplayMicText(false);
    }, 2000);
  };

  let currRound = 1;
  let currPlayerIndex = 0;
  let chooseTimeCounter = 15;

  const handleGameStart = () => {
    if (players.length === 1) {
      // console.log("Room must have two players to start the game!");
      socket.emit("start game condition", roomCode);
    } else {
      setRenderPlay(!renderPlay);
      setRenderRounds(true);

      socket.emit("start game", { roomCode, currRound, hostId: socket.id });
      // console.log(`Round no. ${currRound} has started!`);
      setTimeout(() => {
        playTurn();
      }, 10000);
    }
  };

  // function to start next round!.

  const startNextRound = () => {
    setRenderRounds(true);
    setOnGoingRound(+onGoingRound + 1);
    currRound++;
    currPlayerIndex = 0;
    socket.emit("next round started", { roomCode, currRound });
    // console.log(`Round no. ${currRound} has started!`);
    setTimeout(() => {
      playTurn();
    }, 10000);
  };

  const playTurn = () => {
    setTimeoutId(null);
    setRenderRounds(false);
    let player = players[currPlayerIndex];

    setWhosTurn(player);
    setPlayerTurn(player);
    setIsWordChosed(false);

    const newTimeoutIdForPlayTimer = setTimeout(() => {
      endTurn();
    }, (+drawTime + 15) * 1000);
    setPlayTimeoutId(newTimeoutIdForPlayTimer);
    socket.emit("play turn", {
      roomCode,
      players,
      currPlayerIndex,
      newTimeoutIdForPlayTimer,
    });
    bringWords(player, isWordChosed);
  };

  const allPlayerGuessedIt = (players, playTimeoutId, roomCode) => {
    const updatedPlayers = players.map((player) => {
      return { ...player, isGuessed: false };
    });
    clearTimeout(playTimeoutId);
    immediateEndTurn(updatedPlayers, roomCode);
  };

  const renderHints = (guessWord, drawTime, hints, code) => {
    let hintCount = 0;
    let hintsTimer = drawTime / hints;
    const renderedHints = [];

    const timeIntervalId = setInterval(() => {
      hintCount++;

      if (hintCount === +hints) {
        clearInterval(timeIntervalId);
      }

      const guessWordArray = Array.from(guessWord);
      let hint;
      let hintIndx;
      do {
        hint =
          guessWordArray[Math.floor(Math.random() * guessWordArray.length)];
        hintIndx = guessWordArray.indexOf(hint);
      } while (renderedHints.some((hintObj) => hintObj.hint === hint));

      const hintObj = { hint, hintIndx };
      renderedHints.push(hintObj);

      if (!code) {
        socket.emit("hint time", {
          roomCode,
          hintObj,
          guessWord,
          renderedHints,
        });
      } else {
        const roomCode = code;
        socket.emit("hint time", {
          roomCode,
          hintObj,
          guessWord,
          renderedHints,
        });
      }
    }, 1000 * hintsTimer);
  };

  const endTurn = () => {
    currPlayerIndex++;
    setWord("");
    setDistance(0);
    socket.emit("turn over", roomCode, currPlayerIndex);
    if (currPlayerIndex < players.length) {
      playTurn();
    } else {
      // If all players have finished their turn, start the next round
      if (currRound == rounds) endGame();
      else {
        startNextRound();
      }
    }
  };

  // Temp.
  const immediateEndTurn = (updatedPlayers, roomCode) => {
    currPlayerIndex++;
    setWord("");
    setDistance(0);
    socket.emit("turn over", roomCode, currPlayerIndex);

    setPLayers(updatedPlayers);
    setRoomCode(roomCode);
    setPlayFlagTurn(true);
    // if (currPlayerIndex < players.length) {
    //   playTurn();
    // } else {
    //   if (currRound == rounds) {
    //     endGame();
    //   } else {
    //     startNextRound();
    //   }
    // }
  };
  // /Temp.

  const endGame = () => {
    socket.emit("game over", { roomCode, players, scoreCard });

    setChoosingWord(false);
    setRenderPlay(!renderPlay);
    navigate("/gameOver", {
      state: {
        players: players,
        scoreCard: scoreCard,
      },
    });
  };

  const bringWords = () => {
    let wordScreen = true;
    let player = players[currPlayerIndex];
    socket.emit("bring words from backend", {
      roomCode,
      player,
      drawTime,
      hints,
    });
    setChoosingWord(true);
    socket.emit("choosing word true", { roomCode, wordScreen, player });
  };

  const selectWord = (selector) => {
    const selectedWord = selector;
    let wordScreen = false;
    let player = mySelf;

    clearTimeout(timeoutId);
    socket.emit("choosing word false", { roomCode, wordScreen });

    socket.emit("word selected", { roomCode, selectedWord, player });
    // creating new socket.

    if (hints !== "0") {
      renderHints(selector.text, drawTime, hints);
    }

    setIsWordChosed(true);
    setWord(selector.text);
    setChoosingWord(false);
  };

  // function to copy the link code.

  const selectRounds = (e) => {
    const setting = e.target.value;
    setRounds(setting);

    socket.emit("number of rounds", { setting, roomCode });
  };

  const selectNoOfPlayers = (e) => {
    const setting = e.target.value;
    setNumbPlayers(setting);

    socket.emit("number of players", { setting, roomCode });
  };

  const selectHints = (e) => {
    const setting = e.target.value;
    setHints(setting);

    socket.emit("number of hints", { setting, roomCode });
  };

  const selectDrawTime = (e) => {
    const setting = e.target.value;
    setDrawTime(setting);

    socket.emit("draw timer", { setting, roomCode });
  };

  const selectWordCount = (e) => {
    const setting = e.target.value;
    setWordCount(setting);

    socket.emit("word count", { setting, roomCode });
  };

  const getKicksData = (player) => {
    socket.emit("get kicks", { roomCode, player, mySelf });
  };

  const getUnkickData = (player) => {
    socket.emit("get unkick", { roomCode, player, mySelf });
  };

  const handleCopy = async () => {
    const text = `http://localhost:3000/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }

    socket.emit("send message", {
      msg: {
        text: "Link copied to clipboard!",
        id: socket.id,
        server: true,
        color: "gold",
        serverSpecial: true,
        msgTimestamp: Date.now(),
      },
      roomCode,
    });
  };

  const handleLeave = () => {
    socket.emit("leave", { roomCode, mySelf });
  };

  const handleMusicControlsForAll = () => {
    setControlsForAll(true);
    socket.emit("music controls for all", roomCode);
  };

  const handleMusicControlsForHost = () => {
    setControlsForAll(false);
    socket.emit("music controls for host", roomCode);
  };

  let customWordsInput = "";

  const handleCustomWords = (e) => {
    customWordsInput = e.target.value;
  };

  const saveWords = () => {
    const customwords = customWordsInput
      .split(",")
      .map((word) => word.trim().toLowerCase());
    const validWords = customwords.filter((word) =>
      /^[a-zA-Z]{3,}$/.test(word.trim())
    );
    const filteredWords = Array.from(new Set([...validWords]));
    socket.emit("valid custom words", { roomCode, validWords });
  };

  const triggerCustomWordsUse = () => {
    setUseCustom(!useCustom);
    socket.emit("use custom words only", { roomCode, boolean: true });
  };

  const triggerCustomWordsNotUse = () => {
    setUseCustom(!useCustom);
    socket.emit("use custom words only", { roomCode, boolean: false });
  };
  return (
    <div className="lobby-window">
      {socket.id ? (
        <>
          <div className="skribble-text-container">
            <span className="skribbleText">
              <img
                className="imageLogo"
                src="assets/skribblLogo.gif"
                alt="logo"
                loading="lazy"
              />
            </span>
            {players.length !== 0 && (
              <div className="mic-container">
                {/* <VoiceChat socket={socket} /> */}
                {mute === true ? (
                  <>
                    <BsFillMicMuteFill
                      className="mic"
                      onClick={() => {
                        functionMic();
                      }}
                    />
                    {displayMicText === true ? (
                      <p className="displayText">I'm working on it!</p>
                    ) : (
                      <div className="emptyText"></div>
                    )}
                  </>
                ) : (
                  <>
                    <BsFillMicFill
                      className="mic"
                      onClick={() => {
                        functionMic();
                      }}
                    />
                    {displayMicText === true ? (
                      <p className="displayText">I'm working on it!</p>
                    ) : (
                      <div className="emptyText"></div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* play music */}

            <audio ref={songRef} />
          </div>

          <div className="main-container">
            <div className="firstMain-container">
              <span className="rounds-container">
                <div className="clockWithTime">
                  <img
                    className="imageClock"
                    src="assets/clock.gif"
                    alt="clock"
                    loading="lazy"
                  />
                  {choosingWord === true ? (
                    <span
                      style={{
                        position: "absolute",
                        marginTop: "0.5rem",
                      }}
                    >
                      {chooseTimeCounter}
                    </span>
                  ) : (
                    <span
                      style={{
                        position: "absolute",
                        marginTop: "0.5rem",
                      }}
                    >
                      {drawTime}
                    </span>
                  )}
                </div>

                <p className="roundText">{`Round ${onGoingRound} of ${rounds}`}</p>
              </span>
              {word === "" ? (
                <span className="word-container">Waiting...</span>
              ) : whosTurn.id === socket.id ? (
                <span className="word-container">{word}</span>
              ) : spaces.length > 0 ? (
                <div className="spaces">
                  {spaces.map((space, index) => {
                    return (
                      <span className="space" key={index}>
                        {space}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="word-container">{word}</span>
              )}

              <span className="settings-container">
                <img
                  className="settingsImage"
                  src="assets/settings.gif"
                  alt="settings"
                  loading="lazy"
                />
              </span>
            </div>

            <div className="secondMain-container">
              <div className="players-container">
                {players.length > 0 &&
                  players.map((player, index) => {
                    return (
                      <div
                        className={
                          whosTurn !== null
                            ? player.id === whosTurn.id
                              ? "playerInfo-containerWithTurn"
                              : player.isGuessed === true
                              ? "playerInfo-greenContainer"
                              : "playerInfo-whiteSmokeContainer"
                            : "playerInfo-whiteSmokeContainer"
                        }
                        key={index}
                      >
                        <div
                          style={{ marginLeft: "1rem" }}
                          className="userImage-container"
                        >
                          <img
                            className="userImage"
                            src={player.userAvatar}
                            alt={player.userName}
                            loading="lazy"
                          />
                        </div>
                        <p
                          style={{
                            marginLeft: "1rem",
                            minWidth: "85px",
                            flex: 0.75,
                          }}
                          key={player.id}
                        >
                          {player.userName}
                        </p>

                        {player.id === socket.id ? (
                          <span
                            style={{
                              marginLeft: "1.25rem",
                              flex: 0.5,
                            }}
                          >
                            (You)
                          </span>
                        ) : (
                          ""
                        )}

                        {scoreCard.map((playerObj, index) => {
                          return playerObj.playerId === player.id ? (
                            <span
                              style={{
                                marginLeft: "1rem",
                                textAlign: "center",
                                flex: 1,
                              }}
                              key={index}
                            >
                              {playerObj.score}
                            </span>
                          ) : (
                            ""
                          );
                        })}

                        {player.id !== socket.id ? (
                          player.kicksGot.includes(socket.id) ? (
                            <TbShoeOff
                              className="shoeOff"
                              onClick={() => {
                                getUnkickData(player);
                              }}
                            />
                          ) : (
                            <TbShoe
                              className="shoeOn"
                              onClick={() => {
                                getKicksData(player);
                              }}
                              key={player.id + "1"}
                            />
                          )
                        ) : (
                          ""
                        )}
                      </div>
                    );
                  })}
              </div>

              {renderRounds === false ? (
                choosingWord === true ? (
                  <div className="actions-container">
                    {whosTurn.id === socket.id ? (
                      <div className="words-container">
                        {words.map((word) => {
                          return (
                            <span
                              className="word"
                              key={word.id}
                              onClick={() => {
                                selectWord(word);
                              }}
                            >
                              {word.text}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="words-container">
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <p style={{ fontSize: "20px", color: "white" }}>
                            {whosTurn.userName} is choosing the word!
                          </p>
                          <div className="userAvatar-container">
                            <img
                              className="userAvatar-image"
                              src={whosTurn.userAvatar}
                              alt="user Avatar"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="actions-conatiner">
                    {renderPlay === true ? (
                      <PlayGround
                        socket={socket}
                        roomsData={roomsData}
                        roomCode={roomCode}
                        players={players}
                        playerTurn={playerTurn}
                        whosTurn={whosTurn}
                      />
                    ) : (
                      <>
                        <div className="all-actions-container">
                          <div className="icons-container">
                            <span className="icon">
                              <img
                                src="assets/setting_1.gif"
                                alt="Player"
                                loading="lazy"
                              />
                            </span>
                            <span className="icon">
                              <img
                                src="assets/setting_2.gif"
                                alt="Drawtime"
                                loading="lazy"
                              />
                            </span>
                            <span className="icon">
                              <img
                                src="assets/setting_3.gif"
                                alt="Rounds"
                                loading="lazy"
                              />
                            </span>

                            <span className="icon">
                              <img
                                src="assets/setting_4.gif"
                                alt="Words"
                                loading="lazy"
                              />
                            </span>
                            <span className="icon">
                              <img
                                src="assets/setting_5.gif"
                                alt="Hints"
                                loading="lazy"
                              />
                            </span>
                            <span className="icon">
                              <img
                                src="assets/music.gif"
                                alt="music controls"
                                loading="lazy"
                              />
                            </span>
                          </div>

                          <div className="actionNames-container">
                            <span className="iconName">Players</span>
                            <span className="iconName">Drawtime</span>
                            <span className="iconName">Rounds</span>
                            <span className="iconName">Word Count</span>
                            <span className="iconName">Hints</span>
                            <span className="iconName">Music Controls</span>
                          </div>

                          <div className="actionInputs-container">
                            <select
                              name=""
                              id=""
                              className="input"
                              value={numbPlayers}
                              disabled={
                                (mySelf && mySelf.host === false
                                  ? true
                                  : false) || players.length === 0
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                selectNoOfPlayers(e);
                              }}
                            >
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                            </select>

                            <select
                              name=""
                              id=""
                              className="input"
                              value={drawTime}
                              disabled={
                                (mySelf && mySelf.host === false
                                  ? true
                                  : false) || players.length === 0
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                selectDrawTime(e);
                              }}
                            >
                              <option value="30">30</option>
                              <option value="40">40</option>
                              <option value="50">50</option>
                              <option value="60">60</option>
                              <option value="70">70</option>
                              <option value="80">80</option>
                              <option value="90">90</option>
                              <option value="100">100</option>
                              <option value="120">120</option>
                              <option value="150">150</option>
                              <option value="180">180</option>
                              <option value="210">210</option>
                              <option value="240">240</option>
                            </select>
                            <select
                              name=""
                              id=""
                              className="input"
                              value={rounds}
                              disabled={
                                (mySelf && mySelf.host === false
                                  ? true
                                  : false) || players.length === 0
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                selectRounds(e);
                              }}
                            >
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                              <option value="9">9</option>
                              <option value="10">10</option>
                            </select>
                            <select
                              name=""
                              id=""
                              className="input"
                              value={wordCount}
                              disabled={
                                (mySelf && mySelf.host === false
                                  ? true
                                  : false) || players.length === 0
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                selectWordCount(e);
                              }}
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>

                            <select
                              name=""
                              id=""
                              className="input"
                              value={hints}
                              disabled={
                                (mySelf && mySelf.host === false
                                  ? true
                                  : false) || players.length === 0
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                selectHints(e);
                              }}
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                            </select>

                            <div className="muscic-controls-container">
                              {mySelf && mySelf.host === true ? (
                                <>
                                  {/* For all players */}
                                  <div className="checkerContainer">
                                    <div
                                      className="checkerBox-forHost"
                                      onClick={() => {
                                        handleMusicControlsForAll();
                                      }}
                                    >
                                      {controlsForAll === true ? (
                                        <div className="smallBox-forHost"></div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                    <span style={{ color: "white" }}>All</span>
                                  </div>

                                  {/* For host only */}
                                  <div className="checkerContainer">
                                    <div
                                      className="checkerBox-forHost"
                                      onClick={() => {
                                        handleMusicControlsForHost();
                                      }}
                                    >
                                      {controlsForAll === false ? (
                                        <div className="smallBox-forHost"></div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                    <span style={{ color: "white" }}>
                                      Host only
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="checkerContainer">
                                    {/* For all players */}
                                    <div
                                      className="checkerBox-forPlayer"
                                      style={{ cursor: "not-allowed" }}
                                    >
                                      {controlsForAll === true ? (
                                        <div
                                          className="smallBox-forPlayer"
                                          style={{ cursor: "not-allowed" }}
                                        ></div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                    <span style={{ color: "white" }}>All</span>
                                  </div>

                                  {/* For host only */}
                                  <div className="checkerContainer">
                                    <div
                                      className="checkerBox-forPlayer"
                                      style={{ cursor: "not-allowed" }}
                                    >
                                      {controlsForAll === false ? (
                                        <div
                                          className="smallBox-forPlayer"
                                          style={{ cursor: "not-allowed" }}
                                        ></div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                    <span style={{ color: "white" }}>
                                      Host only
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="customText-container">
                          <span className="custom-text">Custom words</span>
                          <div className="custom-text">
                            <span>use custom words only</span>

                            {mySelf && mySelf.host ? (
                              useCustom ? (
                                <div
                                  className="checkBtn"
                                  onClick={() => {
                                    triggerCustomWordsNotUse();
                                  }}
                                >
                                  {useCustom && (
                                    <div className="smallBox-forHost"></div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className="checkBtn"
                                  onClick={() => {
                                    triggerCustomWordsUse();
                                  }}
                                >
                                  {useCustom && (
                                    <div className="smallBox-forHost"></div>
                                  )}
                                </div>
                              )
                            ) : useCustom ? (
                              <div
                                className="checkBtn"
                                style={{
                                  backgroundColor: "grey",
                                  cursor: "not-allowed",
                                }}
                              >
                                {useCustom && (
                                  <div
                                    className="smallBox-forPlayer"
                                    style={{ cursor: "not-allowed" }}
                                  ></div>
                                )}
                              </div>
                            ) : (
                              <div
                                className="checkBtn"
                                style={{
                                  cursor: "not-allowed",
                                  backgroundColor: "grey",
                                }}
                              >
                                {useCustom && (
                                  <div
                                    className="smallBox-forPlayer"
                                    style={{ cursor: "not-allowed" }}
                                  ></div>
                                )}
                              </div>
                            )}
                          </div>

                          {mySelf && mySelf.host ? (
                            <div
                              className="saveWords"
                              onClick={() => {
                                saveWords();
                              }}
                            >
                              Save words
                            </div>
                          ) : (
                            <div
                              className="saveWords"
                              style={{
                                cursor: "not-allowed",
                                backgroundColor: "grey",
                                color: "silver",
                              }}
                            >
                              Save words
                            </div>
                          )}
                        </div>
                        <div className="customWords-container">
                          <textarea
                            onChange={(e) => {
                              handleCustomWords(e);
                            }}
                            disabled={
                              mySelf && mySelf.host !== true ? true : false
                            }
                            type="text"
                            className={
                              mySelf && mySelf.host !== true
                                ? "customWordsInputForPlayer"
                                : "customWordsInput"
                            }
                            placeholder="Minimum of 10 words. 1-32 characters per word! 20000 characters maximum. Seperated by a , (comma), don't use symbols / duplicate words it will get removed!"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              ) : (
                <div className="actions-container">
                  <div className="for-rounds-container">
                    <span style={{ color: "white", fontSize: "22px" }}>
                      Round no. {onGoingRound} has started!
                    </span>
                  </div>
                </div>
              )}

              <div className="chat-container">
                <div className="message-container">
                  {messages.length > 0
                    ? messages.map((msg, index) => {
                        return msg.serverSpecial === false ? (
                          msg.server === false ? (
                            <div
                              key={index}
                              className="msgContainer"
                              style={{
                                backgroundColor:
                                  index % 2 === 0 ? "white" : "whitesmoke",
                              }}
                            >
                              {players.length > 0
                                ? players.map((player) => {
                                    return player.id === msg.id ? (
                                      <p className="playerName" key={player.id}>
                                        {player.userName} :
                                      </p>
                                    ) : (
                                      ""
                                    );
                                  })
                                : ""}
                              <p className="message" key={index}>
                                {msg.text}
                              </p>
                            </div>
                          ) : msg.id !== mySelf.id ? (
                            <div
                              className="msgContainer"
                              key={index}
                              style={{
                                backgroundColor:
                                  index % 2 === 0 ? "white" : "whitesmoke",
                              }}
                            >
                              <p
                                className="message-server"
                                key={index}
                                style={{
                                  color: msg.color,
                                  fontSize: 13,
                                  fontWeight: "bold",
                                }}
                              >
                                {msg.text}
                              </p>
                            </div>
                          ) : (
                            ""
                          )
                        ) : msg.server === true && msg.id === socket.id ? (
                          <div
                            className="msgContainer"
                            key={index}
                            style={{
                              backgroundColor:
                                index % 2 === 0 ? "white" : "whitesmoke",
                            }}
                          >
                            <p
                              className="message-server"
                              key={index}
                              style={{
                                color: msg.color,
                                fontSize: 13,
                                fontWeight: "bold",
                              }}
                            >
                              {msg.text}
                            </p>
                          </div>
                        ) : (
                          ""
                        );
                      })
                    : ""}
                </div>

                <div className="chat-input">
                  <form
                    onSubmit={(e) => {
                      handleSubmit(e);
                    }}
                  >
                    <input
                      className="form-input"
                      disabled={
                        whosTurn && whosTurn.id === mySelf.id ? true : false
                      }
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                      }}
                      type="text"
                      placeholder="Type here.."
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="link-container">
            <div className="inviteFrnd-container">
              <span
                className="invite-text"
                onMouseOver={() => {
                  handleShowText();
                }}
              >
                {showLink === false ? "Invite Your Friends" : joinLink}
              </span>

              <button
                className="copyBtn"
                disabled={players.length === 0}
                onClick={() => handleCopy()}
              >
                Copy
              </button>
            </div>

            <div className="startBtn-container">
              {mySelf && mySelf.host === true ? (
                <button
                  className="startBtn"
                  onClick={() => {
                    handleGameStart();
                  }}
                >
                  Start
                </button>
              ) : (
                <button
                  className="leaveBtn"
                  disabled={players.length === 0}
                  onClick={() => {
                    handleLeave();
                  }}
                >
                  Leave
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="container">
          <p className="text">Error:404</p>
          <p className="text">Page Not Found!</p>
          <p className="text">You Have Entered Invalid details...</p>
        </div>
      )}
    </div>
  );
};

export default Lobby;
