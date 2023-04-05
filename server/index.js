import { Server } from "socket.io";
import { createServer } from "http";
import youtubedl from "youtube-dl-exec";
import words from "./data.js";
import "dotenv/config";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "https://skribbl-rishabh.vercel.app/",
  },
});

const port = process.env.PORT || 3001;
const rooms = {};
const songs = {};
const songNameArray = [];
const YOUTUBE_SONGS_ITEMS_API = "https://www.googleapis.com/youtube/v3/search";

const YOUTUBE_API_KEY = process.env.API_KEY;

io.on("connection", (socket) => {
  socket.on("give me rooms", () => {
    socket.emit("rooms data", rooms);
  });

  socket.on("rooms", () => {
    socket.emit("rooms", rooms);
  });

  socket.on("joinRoom rooms", () => {
    socket.emit("rooms", rooms);
  });

  // user disconnected!
  socket.on("disconnect", () => {
    let player;

    for (let roomId of Object.values(rooms)) {
      roomId.players.map((checker) => {
        if (checker.id === socket.id) {
          return (player = checker);
        }
      });

      for (let i = 0; i < roomId.players.length; i++) {
        if (roomId.players[i].id === socket.id) {
          roomId.players = roomId.players.filter(function (player) {
            return player.id !== socket.id;
          });
          socket.emit("you left");
          roomId.scoreBoard = roomId.scoreBoard.filter((player) => {
            return player.playerId !== socket.id;
          });

          roomId.messages = roomId.messages.filter((msg) => {
            return msg.id !== socket.id;
          });

          // deleting the whole room!
          if (roomId.players.length === 0) {
            delete rooms[roomId.id];
          }
          const msg = {
            text: `${
              player && player.userName
            } got disconnected from the server!`,
            id: "",
            server: true,
            color: "red",
            serverSpecial: false,
            msgTimestamp: Date.now(),
          };
          roomId.messages.length >= 0 && roomId.messages.push(msg);

          // To randomly pick the host.
          if (roomId.players.length > 0) {
            if (player.host === true) {
              const randomPlayer =
                roomId.players[
                  Math.floor(Math.random() * roomId.players.length)
                ];
              const announcementMsg = {
                text: `${randomPlayer.userName} is the new host of the game!`,
                server: true,
                color: "blueViolet",
                serverSpecial: false,
                msgTimestamp: Date.now(),
              };
              roomId.players = roomId.players.map((checker) => {
                if (checker.id === randomPlayer.id) {
                  return { ...checker, host: true };
                } else {
                  return checker;
                }
              });
              roomId.messages && roomId.messages.push(announcementMsg);
            }
          }

          io.to(roomId.id).emit("player disconnected", {
            rooms,
            roomId: roomId.id,
          });
        }
      }
    }
  });

  socket.on("leave", ({ roomCode, mySelf }) => {
    socket.emit("you left");
    const msg = {
      text: `${mySelf.userName} left the room!`,
      id: "",
      server: true,
      color: "red",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].players = rooms[roomCode].players.filter((checker) => {
      return checker.id !== mySelf.id;
    });
    rooms[roomCode].scoreBoard = rooms[roomCode].scoreBoard.filter((player) => {
      return player.playerId !== socket.id;
    });
    rooms[roomCode].messages = rooms[roomCode].messages.filter((msg) => {
      return msg.id !== mySelf.id;
    });

    rooms[roomCode].messages.length >= 0 && rooms[roomCode].messages.push(msg);
    if (rooms[roomCode].players.length === 0) {
      delete rooms[roomCode];
    }
    io.to(roomCode).emit("player left", { roomCode, rooms });
  });

  socket.emit("welcome", "Welcome to the channel");

  // socket.on("msg", (data) => {
  //   // console.log("msg from the client", data);
  // });
  socket.on("music controls for all", (roomCode) => {
    rooms[roomCode].musicControlsForAll = true;
    io.to(roomCode).emit("musicForAll");
  });
  socket.on("music controls for host", (roomCode) => {
    rooms[roomCode].musicControlsForAll = false;
    io.to(roomCode).emit("musicForHost");
  });

  socket.on("valid custom words", ({ roomCode, validWords }) => {
    if (validWords.length < 10) {
      const msg = {
        text: "Minimum of 10 words required!",
        server: true,
        color: "tomato",
        serverSpecial: false,
        msgTimestamp: Date.now(),
      };
      rooms[roomCode].messages.length >= 0 &&
        rooms[roomCode].messages.push(msg);
      io.to(roomCode).emit("update messages", { rooms, roomCode });
    } else if (validWords.length > 80) {
      const msg = {
        text: "Maximum of 80 words,limit reached!",
        server: true,
        color: "tomato",
        serverSpecial: false,
        msgTimestamp: Date.now(),
      };
      rooms[roomCode].messages.length >= 0 &&
        rooms[roomCode].messages.push(msg);
      io.to(roomCode).emit("update messages", { rooms, roomCode });
    } else {
      rooms[roomCode].customWords = validWords;
    }
  });

  socket.on("use custom words only", ({ roomCode, boolean }) => {
    rooms[roomCode].useCustomWords = boolean;
    io.to(roomCode).emit("change settings", boolean);
  });

  socket.on(
    "create-room",
    ({ roomId, userAvatar, userId, host, userName, joinedTimestamp }) => {
      const playerScore = { playerId: userId, score: 0 };
      socket.join(roomId);
      rooms[roomId] = {
        id: roomId,
        players: [
          {
            id: userId,
            userAvatar,
            userName,
            host: true,
            joinedTimestamp,
            kicksToOut: 0,
            kicksGot: [],
            isGuessed: false,
          },
        ],
        messages: [],
        musicControlsForAll: true,
        useCustomWords: false,
        scoreBoard: [playerScore],
        whoGuessedIt: [],
        customWords: [],
        roomSettings: {
          players: "8",
          drawTime: "30",
          rounds: "3",
          wordCount: "2",
          hints: "0",
        },
      };

      const msg = {
        text: "You successfully created the room!",
        id: userId,
        server: true,
        color: "#53e237",
        serverSpecial: true,
        msgTimestamp: Date.now(),
      };
      rooms[roomId].messages.length >= 0 && rooms[roomId].messages.push(msg);
      io.to(roomId).emit("room data", {
        roomId,
        rooms,
      });
    }
  );

  socket.on("song data", ({ songData, roomId }) => {
    io.to(roomId).emit("set song data", songData);
  });

  socket.on(
    "join-room",
    ({ roomId, userAvatar, userId, host, userName, joinedTimestamp }) => {
      const playerScore = { playerId: userId, score: 0 };
      let hostInfo;
      rooms[roomId].players.length >= 0 &&
        rooms[roomId].players.map((player) => {
          return player.host === true ? (hostInfo = player) : "";
        });
      socket.join(roomId);

      const msg = {
        text: `${userName} joined the room (:`,
        id: userId,
        server: true,
        color: "#2c8de7",
        serverSpecial: false,
        msgTimestamp: Date.now(),
      };
      rooms[roomId].messages.length >= 0 && rooms[roomId].messages.push(msg);
      rooms[roomId].scoreBoard && rooms[roomId].scoreBoard.push(playerScore);

      const oneMoreMsg = {
        text: `${hostInfo.userName} is the host of the game!`,
        id: userId,
        server: true,
        color: "#53e237",
        serverSpecial: true,
        msgTimestamp: Date.now(),
      };

      rooms[roomId].messages.length >= 0 &&
        rooms[roomId].messages.push(oneMoreMsg);

      socket
        .to(roomId)
        .emit("user is joined", { rooms, roomId, joinedTimestamp });

      if (rooms[roomId]) {
        rooms[roomId].players.push({
          id: userId,
          userAvatar,
          userName,
          host: false,
          joinedTimestamp,
          kicksToOut: 0,
          kicksGot: [],
          isGuessed: false,
        });
      }
      io.to(roomId).emit("room data", {
        roomId,
        rooms,
      });
    }
  );

  socket.on("share canvas", ({ dataURL, roomCode }) => {
    socket.to(roomCode).emit("canvas picture", dataURL);
  });

  socket.on("start game condition", (roomCode) => {
    const msg = {
      text: "Room must have at least two players to start the game!",
      server: true,
      color: "brwon",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

    io.to(roomCode).emit("game condition", { rooms, roomCode });
  });

  socket.on("start game", ({ roomCode, currRound, hostId }) => {
    let player;
    rooms[roomCode].players.map((each) => {
      return each.id === hostId ? (player = each) : "";
    });
    const msg = {
      text: `${player.userName} started the game!, It's Round no. ${currRound}`,
      id: player.id,
      server: true,
      color: "pink",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

    socket.to(roomCode).emit("game started", {
      mssg: rooms[roomCode].messages,
      participants: rooms[roomCode].players,
    });
  });

  socket.on("send message", ({ msg, roomCode }) => {
    for (let i = 0; i < rooms[roomCode].players.length; i++) {
      if (rooms[roomCode].players[i].id === socket.id) {
        rooms[roomCode].messages && rooms[roomCode].messages.push(msg);
        const mssg = rooms[roomCode].messages;
        const participants = rooms[roomCode].players;
        io.to(roomCode).emit("msg array", { mssg, participants });
      }
    }
    // rooms[roomCode].messages && rooms[roomCode].messages.push(msg);
    // const mssg = rooms[roomCode].messages;
    // const participants = rooms[roomCode].players;
    // io.to(roomCode).emit("msg array", { mssg, participants });
  });

  // sockets to share game settings with other players of the room!

  socket.on("number of rounds", ({ setting, roomCode }) => {
    rooms[roomCode].roomSettings.rounds = setting;
    socket.to(roomCode).emit("round settings", setting);
  });

  socket.on("draw timer", ({ setting, roomCode }) => {
    rooms[roomCode].roomSettings.drawTime = setting;
    socket.to(roomCode).emit("draw timer settings", setting);
  });

  socket.on("number of players", ({ setting, roomCode }) => {
    rooms[roomCode].roomSettings.players = setting;
    socket.to(roomCode).emit("number of player settings", setting);
  });

  socket.on("number of hints", ({ setting, roomCode }) => {
    rooms[roomCode].roomSettings.hints = setting;
    socket.to(roomCode).emit("number of hints settings", setting);
  });

  socket.on("word count", ({ setting, roomCode }) => {
    rooms[roomCode].roomSettings.wordCount = setting;
    socket.to(roomCode).emit("word count settings", setting);
  });
  // ***** //

  // sockets for sharing onGoing game data.
  socket.on("next round started", ({ roomCode, currRound }) => {
    // console.log(`Round no. ${currRound} has started!`);
    socket
      .to(roomCode)
      .emit("onGoing game data after next round started", currRound);
  });

  socket.on(
    "play turn",
    ({ roomCode, players, currPlayerIndex, newTimeoutIdForPlayTimer }) => {
      let playerTurn = players[currPlayerIndex];

      const msg = {
        text: `It's ${playerTurn.userName}'s turn!`,
        id: playerTurn.id,
        server: true,
        color: "purple",
        serverSpecial: false,
        msgTimestamp: Date.now(),
      };
      rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

      io.to(roomCode).emit("play the turn", {
        playerTurn,
        mssg: rooms[roomCode].messages,
        participants: rooms[roomCode].players,
        newTimeoutIdForPlayTimer,
      });
    }
  );

  socket.on("turn over", (roomCode, currPlayerIndex) => {
    // rooms[roomCode].whoGuessedIt = [];

    rooms[roomCode].players &&
      rooms[roomCode].players.map((player) => {
        return (player.isGuessed = false);
      });

    io.to(roomCode).emit("turn got over", {
      rooms,
      roomCode,
      currPlayerIndex,
    });
  });

  socket.on("word selected", ({ roomCode, selectedWord, player }) => {
    const msg = {
      text: `${player.userName} started drawing! `,
      server: true,
      id: player.id,
      color: "brown",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages.length > 0 && rooms[roomCode].messages.push(msg);

    io.to(roomCode).emit("this is the word", {
      selectedWord,
      mssg: rooms[roomCode].messages,
      participants: rooms[roomCode].players,
    });
  });

  socket.on("choosing word true", ({ roomCode, wordScreen, player }) => {
    const msg = {
      text: `${player.userName} is choosing the word... `,
      server: true,
      id: player.id,
      color: "yellow",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

    io.to(roomCode).emit("player is choosing the word is true", {
      wordScreen,
      mssg: rooms[roomCode].messages,
      participants: rooms[roomCode].players,
    });
  });

  socket.on("choosing word false", ({ roomCode, wordScreen }) => {
    io.to(roomCode).emit("player is choosing the word is false", wordScreen);
  });

  socket.on("word guessed correctly", ({ roomCode, mySelf, playTimeoutId }) => {
    rooms[roomCode].scoreBoard.map((player) => {
      if (player.playerId === mySelf.id) {
        player.score = player.score + 10;
      }
    });

    rooms[roomCode].whoGuessedIt.push(mySelf.id);

    const msg = {
      text: `${mySelf.userName} guessed the word!`,
      server: true,
      color: "#53e237",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages.length > 0 && rooms[roomCode].messages.push(msg);

    rooms[roomCode].players.map((player) => {
      return player.id === mySelf.id ? (player.isGuessed = true) : "";
    });

    // if (
    //   rooms[roomCode].whoGuessedIt.length ===
    //   rooms[roomCode].players.length - 1
    // ) {
    //   console.log("call users to end the turn!");
    //   io.to(roomCode).emit("immediately end the turn", {
    //     roomCode,
    //     playTimeoutId,
    //     players: rooms[roomCode].players,
    //   });
    // }

    io.to(roomCode).emit("display the msg from the server on correct guess", {
      roomCode,
      rooms,
    });
  });

  socket.on("word guessed is close", ({ roomCode, mySelf }) => {
    const msg = {
      text: `${mySelf.userName} is so close!`,
      server: true,
      color: "orange",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);
    io.to(roomCode).emit("display the msg from the server", {
      roomCode,
      rooms,
    });
  });

  socket.on("game over", ({ roomCode }) => {
    const players = rooms[roomCode].players;
    const scoreCard = rooms[roomCode].scoreBoard;
    // console.log("checking the data:", players, scoreCard);
    io.to(roomCode).emit("end the game", { players, scoreCard });
  });

  socket.on("hint time", ({ roomCode, hintObj, guessWord, renderedHints }) => {
    // console.log("renderedHints:", renderedHints, "roomCode:", roomCode);
    io.to(roomCode).emit("this is the hint", {
      hintObj,
      guessWord,
      renderedHints,
    });
  });

  socket.on("get unkick", ({ roomCode, player, mySelf }) => {
    rooms[roomCode].players = rooms[roomCode].players.map((checker) => {
      if (checker.id === player.id) {
        return {
          ...checker,
          kicksGot: checker.kicksGot.filter((voter) => {
            return voter !== mySelf.id;
          }),
        };
      } else {
        return { ...checker };
      }
    });

    const kickMsg = {
      text: `${mySelf.userName} unkicked ${player.userName}`,
      server: true,
      color: "lime",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(kickMsg);

    io.to(roomCode).emit("its kicks data", {
      playersData: rooms[roomCode].players,
      rooms,
      roomCode,
    });
  });

  socket.on("get kicks", ({ roomCode, player, mySelf }) => {
    const playersData = rooms[roomCode].players;
    for (let i = 0; i < playersData.length; i++) {
      if (playersData[i].id === mySelf.id) {
        rooms[roomCode].players &&
          rooms[roomCode].players.map((checker) => {
            return checker.id === player.id
              ? ((checker.kicksToOut = playersData.length - 1),
                checker.kicksGot.push(mySelf.id))
              : "";
          });

        const kickMsg = {
          text: `${mySelf.userName} voted to kick ${player.userName}...`,
          server: true,
          color: "black",
          serverSpecial: false,
          msgTimestamp: Date.now(),
        };
        rooms[roomCode].messages && rooms[roomCode].messages.push(kickMsg);

        let currentPlayer;
        rooms[roomCode].players.map((checker) => {
          return checker.id === player.id ? (currentPlayer = checker) : "";
        });

        if (currentPlayer.kicksGot.length == currentPlayer.kicksToOut) {
          io.to(roomCode).emit("you got kick", currentPlayer);

          rooms[roomCode].players = rooms[roomCode].players.filter(
            (checker) => {
              return checker.id !== currentPlayer.id;
            }
          );
          rooms[roomCode].messages = rooms[roomCode].messages.filter((msg) => {
            return msg.id !== currentPlayer.id;
          });

          rooms[roomCode].scoreBoard = rooms[roomCode].scoreBoard.filter(
            (player) => {
              return player.playerId !== socket.id;
            }
          );
          const msg = {
            text: `${currentPlayer.userName} got kicked from the room!`,
            server: true,
            color: "red",
            serverSpecial: false,
            msgTimestamp: Date.now(),
          };
          rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

          // To randomly pick the host.
          if (rooms[roomCode].players.length > 0) {
            if (currentPlayer.host === true) {
              const randomPlayer =
                rooms[roomCode].players[
                  Math.floor(Math.random() * rooms[roomCode].players.length)
                ];
              const announcementMsg = {
                text: `${randomPlayer.userName} is the new host of the game!`,
                server: true,
                color: "blueViolet",
                serverSpecial: false,
                msgTimestamp: Date.now(),
              };
              rooms[roomCode].players = rooms[roomCode].players.map(
                (checker) => {
                  if (checker.id === randomPlayer.id) {
                    return { ...checker, host: true };
                  } else {
                    return checker;
                  }
                }
              );
              rooms[roomCode].messages &&
                rooms[roomCode].messages.push(announcementMsg);
            }
          }

          io.to(roomCode).emit("player got kicked", {
            currentPlayer,
            rooms,
            roomCode,
          });
        }

        io.to(roomCode).emit("its kicks data", {
          playersData: rooms[roomCode].players,
          rooms,
          roomCode,
        });
      }
    }
  });
  // sockets for music.

  socket.on("search input for music", ({ roomCode, searchInput }) => {
    socket.to(roomCode).emit("set input for music", searchInput);
  });

  // socket.on("searched music", ({ roomCode, videoId, data }) => {
  //   socket.to(roomCode).emit("got music data", { videoId, data });
  // });

  socket.on("play music", (roomCode) => {
    socket.to(roomCode).emit("play action");
  });

  socket.on("pause music", (roomCode) => {
    const msg = {
      text: `paused the song, to resume it type ".resume"`,
      server: true,
      color: "green",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

    io.to(roomCode).emit("pause action", { rooms, roomCode });
  });

  socket.on("resume the music", (roomCode) => {
    const msg = {
      text: `song resumed!`,
      server: true,
      color: "teal",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

    io.to(roomCode).emit("song resumed", { rooms, roomCode });
  });
  socket.on("repeat", ({ roomCode, currSongObj }) => {
    const msg = {
      text: `DJ - playing ${currSongObj.songName} again!`,
      server: true,
      color: "blue",
      serverSpecial: false,
      msgTimestamp: Date.now(),
    };
    rooms[roomCode].messages && rooms[roomCode].messages.push(msg);

    io.to(roomCode).emit("repeat the song", { currSongObj, rooms, roomCode });
  });

  socket.on("testing input", async ({ roomCode, searchInput }) => {
    // trimming and lower casing the search input value.
    const trimmedSearchInput = searchInput.trim().toLowerCase();
    const makeRequest = async (trimmedSearchInput) => {
      console.log("Song did not found,request made!");

      try {
        const res = await fetch(
          `${YOUTUBE_SONGS_ITEMS_API}?part=snippet&maxResults=1&q=${trimmedSearchInput}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`
        );
        const data = await res.json();

        const videoId = data.items[0].id.videoId;

        youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: ["referer:youtube.com", "user-agent:googlebot"],
        }).then((output) => {
          const audioFormats = output.formats.filter(
            (f) => f.acodec !== "none"
          );
          const bestAudio = audioFormats.reduce((prev, curr) =>
            prev.abr > curr.abr ? prev : curr
          );
          const songObject = { songName: output.title, url: bestAudio.url };
          const msg = {
            text: `DJ playing : ${songObject.songName}`,
            server: true,
            color: "purple",
            serverSpecial: false,
            msgTimestamp: Date.now(),
          };
          rooms[roomCode].messages && rooms[roomCode].messages.push(msg);
          io.to(roomCode).emit("video data", { songObject, roomCode, rooms });

          // push trimmed and lower cased song title.
          songNameArray.push(output.title.trim().toLowerCase());
          songs[output.title.trim().toLowerCase()] = {
            songName: output.title,
            url: bestAudio.url,
          };
        });
      } catch (error) {
        console.log("Error occur:", error);
        if (res.status === 403 && res.statusText === "quotaExceeded") {
          const msg = {
            text: "limit reached!, play after some time",
            server: true,
            color: "#2E4F4F",
            serverSpecial: false,
            msgTimestamp: Date.now(),
          };
          rooms[roomCode].messages && rooms[roomCode].messages.push(msg);
          io.to(roomCode).emit("limit exceeded", { roomCode, rooms });
        }
      }
    };

    // checking if trimmedSearchInput is present over their or not , if yes -storing the index in const songIndex.
    const foundSong = songNameArray.find((songName) =>
      songName.includes(trimmedSearchInput)
    );

    if (foundSong) {
      // const songName = songNameArray[index];
      const songObject = songs[foundSong];
      console.log("Song found no need to make request!");
      const msg = {
        text: `DJ playing : ${songObject.songName}`,
        server: true,
        color: "purple",
        serverSpecial: false,
        msgTimestamp: Date.now(),
      };
      rooms[roomCode].messages && rooms[roomCode].messages.push(msg);
      io.to(roomCode).emit("video data", { songObject, roomCode, rooms });
    } else {
      makeRequest(trimmedSearchInput);
    }
  });

  // For words:
  socket.on(
    "bring words from backend",
    ({ roomCode, player, drawTime, hints }) => {
      if (
        rooms[roomCode].useCustomWords === true &&
        rooms[roomCode].customWords.length !== 0
      ) {
        const words = rooms[roomCode].customWords;
        let word1, word2, word3;
        do {
          word1 = {
            id: "1",
            text: words[Math.floor(Math.random() * words.length)],
          };
          word2 = {
            id: "2",
            text: words[Math.floor(Math.random() * words.length)],
          };
          word3 = {
            id: "3",
            text: words[Math.floor(Math.random() * words.length)],
          };
        } while (
          word1.text === word2.text ||
          word2.text === word3.text ||
          word3.text === word1.text
        );
        const gotWords = [word1, word2, word3];

        io.to(roomCode).emit("got words", {
          gotWords,
          player,
          roomCode,
          drawTime,
          hints,
        });
      } else {
        let word1, word2, word3;
        do {
          word1 = {
            id: "1",
            text: words[Math.floor(Math.random() * words.length)],
          };
          word2 = {
            id: "2",
            text: words[Math.floor(Math.random() * words.length)],
          };
          word3 = {
            id: "3",
            text: words[Math.floor(Math.random() * words.length)],
          };
        } while (
          word1.text === word2.text ||
          word2.text === word3.text ||
          word3.text === word1.text
        );
        const gotWords = [word1, word2, word3];

        io.to(roomCode).emit("got words", {
          gotWords,
          player,
          roomCode,
          drawTime,
          hints,
        });
      }
    }
  );
});

httpServer.listen(port, () => {
  console.log(`listening on ${port}`);
});
