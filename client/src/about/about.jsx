import React from "react";
import "./about.css";
import { Link, useNavigate } from "react-router-dom";
import { BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="about-window">
      <div className="logo-container">
        <img
          onClick={() => {
            navigate("/");
          }}
          className="logo"
          src="assets/skribblLogo.gif"
          alt="skribbl.io"
        />
      </div>
      <div className="aboutMain-container">
        <div className="content-container">
          <b>Skribbl.io </b>
          <span>
            , is a ultimate multiplayer drawing and guessing game! With
            skribbl.io, you can connect with friends or other players from
            around the world and put your drawing and guessing skills to the
            test.
          </span>
          <br></br>
          <br></br>
          <span>
            A normal game consists of a few rounds, where every round a player
            has to draw their chosen word and others have to guess it to gain
            points!
          </span>
          <br></br>
          <br></br>
          <span>
            One of the standout features of skribbl.io is our built-in voice
            chat, which lets you communicate with your fellow players in
            real-time. You can also set the mood with our music player, which
            allows you to choose your own background music while you play.
          </span>
          <br></br>
          <br></br>
          <span>
            I've also added a kick and unkick feature, giving you the power to
            control who gets to play in your game. Whether you want to remove an
            unruly player or invite a friend to join, you're in control.
          </span>
          <br></br>
          <br></br>
          <span>
            I built this amazing game with the goal of creating a fun and
            interactive experience for players of all skill levels. And I'm not
            done yet! I'm constantly working on new and exciting features that
            I'll be adding to skribbl.io in the future.
          </span>
          <br></br>
          <br></br>
          <span>
            So come on in and join the fun - I can't wait to see you in the
            game!
          </span>
        </div>
      </div>
      <div className="icon-container">
        <a
          href="https://github.com/Rishabhpawar1409"
          target="/"
          className="link"
        >
          <BsGithub className="social-icon" />
        </a>
        <a
          href="https://www.instagram.com/pawar_1409/"
          target="/"
          className="link"
        >
          <BsInstagram className="social-icon" />
        </a>

        <a
          href="https://twitter.com/Rishabh83320951"
          target="/"
          className="link"
        >
          <BsTwitter className="social-icon" />
        </a>
      </div>
    </div>
  );
};
export default About;
