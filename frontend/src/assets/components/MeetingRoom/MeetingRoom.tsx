
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./MeetingRoom.css";

type Participant = {
  id: number;
  name: string;
  role: string;
  color: string;
  speaking: boolean;
};

type ChatMessage = {
  id: number;
  name: string;
  message: string;
  time: string;
  self?: boolean;
};

const demoParticipants: Participant[] = [
  { id: 1, name: "Alex Morgan", role: "Host", color: "#6658d3", speaking: true },
  { id: 2, name: "Sarah Wilson", role: "Designer", color: "#e47b9a", speaking: false },
  { id: 3, name: "David Miller", role: "Developer", color: "#398bba", speaking: false },
];

const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [title, setTitle] = useState("IntelliMeet Demo Meeting");

  const [participants] = useState<Participant[]>([
    ...demoParticipants,
    {
      id: 4,
      name: "You",
      role: "Participant",
      color: "#16a085",
      speaking: false,
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      name: "Alex Morgan",
      message: "Welcome everyone! Let's get started.",
      time: "10:30 AM",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      message: "Hello everyone!",
      time: "10:31 AM",
    },
  ]);

  const startCamera = useCallback(async () => {
    try {
      setError("");
      setStarting(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access requires HTTPS or localhost.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => {});
      }

      setCameraOn(true);
      setMicOn(true);
      setStarting(false);
    } catch (err) {
      console.error(err);
      setStarting(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to access camera or microphone."
      );
    }
  }, []);

  useEffect(() => {
    const savedMeetings = JSON.parse(
      localStorage.getItem("intellmeet_meetings") || "[]"
    );

    const meeting = savedMeetings.find(
      (item: { id: string; title?: string }) => item.id === meetingId
    );

    if (meeting?.title) setTitle(meeting.title);

    startCamera();

    return () => {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [meetingId, startCamera]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleCamera = () => {
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
  };

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  };

  const toggleScreenShare = async () => {
    if (screenOn) {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setScreenOn(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen sharing is not supported in this browser.");
      }

      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = screen;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screen;
        await localVideoRef.current.play().catch(() => {});
      }

      screen.getVideoTracks()[0].onended = () => {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        screenStreamRef.current = null;
        setScreenOn(false);
      };

      setScreenOn(true);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        name: "You",
        message: chatInput.trim(),
        time: now,
        self: true,
      },
    ]);

    setChatInput("");
  };

  const leaveMeeting = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    navigate("/meetings");
  };

  return (
    <div className="im-room">
      <header className="im-header">
        <div className="im-brand">
          <div className="im-brand-icon">I</div>
          <div>
            <h2>IntelliMeet</h2>
            <p>{title}</p>
          </div>
        </div>

        <div className="im-header-right">
          <span className="im-live"><i /> DEMO ROOM</span>
          <span className="im-room-id">ID: {meetingId}</span>
          <button
            className="im-icon-button"
            onClick={() => setParticipantsOpen(!participantsOpen)}
            title="Participants"
          >
            👥 {participants.length}
          </button>
          <button
            className="im-icon-button"
            onClick={() => setChatOpen(!chatOpen)}
            title="Chat"
          >
            💬
          </button>
        </div>
      </header>

      <div className="im-content">
        <main className="im-main">
          <div className="im-meeting-info">
            <div>
              <h3>{title}</h3>
              <p>Demo meeting · {participants.length} participants</p>
            </div>
            <span className="im-demo-label">DEMO MODE</span>
          </div>

          <div className="im-grid">
            {participants.map((person) => (
              <div className="im-participant-card" key={person.id}>
                {person.id === 4 ? (
                  <div className="im-local-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={cameraOn || screenOn ? "" : "im-hidden"}
                    />
                    {!cameraOn && !screenOn && (
                      <div className="im-avatar" style={{ background: person.color }}>
                        Y
                      </div>
                    )}
                    {starting && (
                      <div className="im-video-status">Starting camera...</div>
                    )}
                    {error && (
                      <div className="im-video-status">
                        <p>{error}</p>
                        <button onClick={startCamera}>Try Again</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="im-demo-avatar-area">
                    <div
                      className="im-avatar"
                      style={{ background: person.color }}
                    >
                      {person.name.charAt(0)}
                    </div>
                    <span className="im-demo-profile">Demo profile</span>
                  </div>
                )}

                <div className="im-person-name">
                  <span>{person.name} {person.id === 1 && "👑"}</span>
                  <span className="im-person-role">{person.role}</span>
                </div>

                <div className="im-person-status">
                  {person.id === 4 ? (micOn ? "🎤" : "🔇") : "🎤"}
                </div>
              </div>
            ))}
          </div>

          <div className="im-demo-notice">
            <span>ⓘ</span>
            Demo mode: Other participant tiles are sample profiles, not live users.
          </div>

          <div className="im-controls">
            <button
              className={`im-control ${!micOn ? "im-control-off" : ""}`}
              onClick={toggleMic}
              disabled={starting || !!error}
            >
              <span>{micOn ? "🎤" : "🔇"}</span>
              <small>{micOn ? "Mute" : "Unmute"}</small>
            </button>

            <button
              className={`im-control ${!cameraOn ? "im-control-off" : ""}`}
              onClick={toggleCamera}
              disabled={starting || !!error}
            >
              <span>{cameraOn ? "📹" : "🚫"}</span>
              <small>{cameraOn ? "Camera Off" : "Camera On"}</small>
            </button>

            <button
              className={`im-control ${screenOn ? "im-control-active" : ""}`}
              onClick={toggleScreenShare}
            >
              <span>🖥️</span>
              <small>{screenOn ? "Stop Share" : "Share Screen"}</small>
            </button>

            <button
              className={`im-control ${chatOpen ? "im-control-active" : ""}`}
              onClick={() => setChatOpen(!chatOpen)}
            >
              <span>💬</span>
              <small>Chat</small>
            </button>

            <button
              className={`im-control ${participantsOpen ? "im-control-active" : ""}`}
              onClick={() => setParticipantsOpen(!participantsOpen)}
            >
              <span>👥</span>
              <small>People</small>
            </button>

            <button className="im-leave-button" onClick={leaveMeeting}>
              ☎ Leave
            </button>
          </div>
        </main>

        {(chatOpen || participantsOpen) && (
          <aside className="im-sidebar">
            <div className="im-sidebar-header">
              <h3>{chatOpen ? "Meeting Chat" : "Participants"}</h3>
              <button
                onClick={() => {
                  setChatOpen(false);
                  setParticipantsOpen(false);
                }}
              >
                ✕
              </button>
            </div>

            {chatOpen ? (
              <>
                <div className="im-chat-messages">
                  {messages.map((message) => (
                    <div
                      className={`im-chat-message ${message.self ? "im-own-message" : ""}`}
                      key={message.id}
                    >
                      <strong>{message.name}</strong>
                      <p>{message.message}</p>
                      <small>{message.time}</small>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="im-chat-input">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") sendMessage();
                    }}
                    placeholder="Type a message..."
                  />
                  <button onClick={sendMessage}>➤</button>
                </div>
              </>
            ) : (
              <div className="im-participant-list">
                {participants.map((person) => (
                  <div className="im-list-person" key={person.id}>
                    <div
                      className="im-small-avatar"
                      style={{ background: person.color }}
                    >
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <strong>{person.name}</strong>
                      <small>{person.role}</small>
                    </div>
                    <span>{person.id === 4 ? (micOn ? "🎤" : "🔇") : "🎤"}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      <footer className="im-footer">
        <span>IntelliMeet © 2026</span>
        <span>Demo meeting environment</span>
      </footer>
    </div>
  );
};

export default MeetingRoom;
