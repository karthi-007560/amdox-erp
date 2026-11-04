
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageCircle,
  Users,
  PhoneOff,
  Send,
  Copy,
  MoreHorizontal,
  ShieldCheck,
  X,
} from "lucide-react";
import "./VideoMeetingPage.css";

type Meeting = {
  id: string | number;
  title?: string;
  date?: string;
  time?: string;
  duration?: number;
  participants?: string[];
  status?: string;
};

type ChatMessage = {
  id: string;
  name: string;
  text: string;
  time: string;
};

type Participant = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

const MEETINGS_KEY = "intellmeet_meetings";
const SETTINGS_KEY = "intellmeet_settings";

const CHAT_PREFIX = "intellmeet_meeting_chat_";

const colors = [
  "purple",
  "blue",
  "pink",
  "green",
  "orange",
  "indigo",
];

function readArray<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCurrentUser() {
  try {
    const value = localStorage.getItem(SETTINGS_KEY);
    const settings = value ? JSON.parse(value) : {};
    return {
      name: settings.name || "You",
      email: settings.email || "",
      cameraEnabled: settings.cameraEnabled !== false,
      microphoneEnabled: settings.microphoneEnabled !== false,
    };
  } catch {
    return {
      name: "You",
      email: "",
      cameraEnabled: true,
      microphoneEnabled: true,
    };
  }
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

function readChat(meetingId: string): ChatMessage[] {
  try {
    const value = localStorage.getItem(
      `${CHAT_PREFIX}${meetingId}`
    );
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function VideoMeetingPage() {
  const [currentUser] = useState(getCurrentUser);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [meetingId, setMeetingId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [chatOpen, setChatOpen] = useState(true);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const showNotice = useCallback((text: string) => {
    setNotice(text);

    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice("");
      noticeTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("meetingId") || params.get("id") || "";

    const allMeetings = readArray<Meeting>(MEETINGS_KEY);

    const selectedMeeting = requestedId
      ? allMeetings.find(
          (item) => String(item.id) === requestedId
        )
      : allMeetings.find(
          (item) =>
            !String(item.status || "")
              .toLowerCase()
              .includes("complete")
        );

    const selectedId = selectedMeeting
      ? String(selectedMeeting.id)
      : requestedId || `local-${Date.now()}`;

    setMeeting(selectedMeeting || null);
    setMeetingId(selectedId);

    const savedNames = Array.isArray(selectedMeeting?.participants)
      ? selectedMeeting.participants.filter(
          (name): name is string =>
            typeof name === "string" && name.trim().length > 0
        )
      : [];

    const uniqueNames = Array.from(
      new Set([currentUser.name, ...savedNames])
    );

    setParticipants(
      uniqueNames.map((name, index) => ({
        id: `${selectedId}-${index}`,
        name:
          name === currentUser.name
            ? `${name} (You)`
            : name,
        initials: initials(name),
        color: colors[index % colors.length],
      }))
    );

    setMessages(readChat(selectedId));
  }, [currentUser.name]);

  useEffect(() => {
    if (ended) return;

    const timer = window.setInterval(() => {
      setElapsed((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [ended]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      screenRef.current?.getTracks().forEach((track) => track.stop());

      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoStream = streamRef.current;

    if (videoStream?.getVideoTracks().some((track) => track.readyState === "live")) {
      videoRef.current.srcObject = videoStream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [cameraOn]);

  function saveChat(nextMessages: ChatMessage[]) {
    setMessages(nextMessages);

    try {
      localStorage.setItem(
        `${CHAT_PREFIX}${meetingId}`,
        JSON.stringify(nextMessages)
      );

      window.dispatchEvent(
        new CustomEvent("intellmeet_chat_updated", {
          detail: { meetingId },
        })
      );
    } catch {
      showNotice("Chat could not be saved in this browser.");
    }
  }

  async function toggleCamera() {
    if (cameraOn) {
      streamRef.current?.getVideoTracks().forEach((track) => {
        track.stop();
      });

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      const videoTrack = stream.getVideoTracks()[0];

      if (!videoTrack) {
        stream.getTracks().forEach((track) => track.stop());
        showNotice("No camera was found.");
        return;
      }

      if (streamRef.current) {
        stream.getVideoTracks().forEach((track) => {
          streamRef.current?.addTrack(track);
        });
      } else {
        streamRef.current = stream;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      setCameraOn(true);
    } catch {
      showNotice("Camera unavailable. Check browser permissions.");
    }
  }

  async function toggleMic() {
    if (micOn) {
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.stop();
      });

      setMicOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioTracks = stream.getAudioTracks();

      if (!audioTracks.length) {
        stream.getTracks().forEach((track) => track.stop());
        showNotice("No microphone was found.");
        return;
      }

      if (streamRef.current) {
        audioTracks.forEach((track) => {
          streamRef.current?.addTrack(track);
        });
      } else {
        streamRef.current = stream;
      }

      setMicOn(true);
    } catch {
      showNotice("Microphone unavailable. Check browser permissions.");
    }
  }

  async function toggleScreenShare() {
    if (sharing) {
      screenRef.current?.getTracks().forEach((track) => track.stop());
      screenRef.current = null;
      setSharing(false);
      showNotice("Screen sharing stopped.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenRef.current = stream;
      setSharing(true);

      stream.getVideoTracks()[0]?.addEventListener(
        "ended",
        () => {
          screenRef.current = null;
          setSharing(false);
        },
        { once: true }
      );

      showNotice(
        "Screen selected. Sending it to other participants requires WebRTC."
      );
    } catch {
      showNotice("Screen sharing cancelled or unavailable.");
    }
  }

  function sendMessage() {
    const text = message.trim();

    if (!text) return;

    const nextMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: currentUser.name,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    saveChat([...messages, nextMessage]);
    setMessage("");
  }

  async function copyMeetingLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotice("Meeting link copied!");
    } catch {
      showNotice("Copy the meeting URL from your browser address bar.");
    }
  }

  function leaveMeeting() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    screenRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
    screenRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
    setSharing(false);
    setEnded(true);
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const meetingTitle = meeting?.title || "Meeting room";
  const displayMeetingId = meeting?.id
    ? String(meeting.id)
    : meetingId;

  if (ended) {
    return (
      <main className="vm-ended">
        <div className="vm-ended-icon">
          <PhoneOff size={30} />
        </div>

        <h1>You left the meeting</h1>
        <p>Meeting duration: {formatTime(elapsed)}</p>

        <button
          onClick={() => {
            setElapsed(0);
            setEnded(false);
          }}
        >
          Return to meeting
        </button>
      </main>
    );
  }

  return (
    <main className="vm-page">
      <header className="vm-header">
        <div className="vm-brand">
          <div className="vm-brand-icon">
            <Video size={21} />
          </div>
          <div>
            <strong>IntellMeet</strong>
            <span>Meeting room</span>
          </div>
        </div>

        <div className="vm-meeting-info">
          <span className="vm-live-dot" />
          <strong>{meetingTitle}</strong>
          <span className="vm-duration">{formatTime(elapsed)}</span>
        </div>

        <button
          className="vm-icon-button"
          onClick={copyMeetingLink}
          title="Copy meeting link"
        >
          <Copy size={17} />
        </button>
      </header>

      {notice && (
        <div className="vm-notice" role="status">
          {notice}
        </div>
      )}

      <div
        className={`vm-body ${
          chatOpen || participantsOpen ? "with-panel" : ""
        }`}
      >
        <section className="vm-stage">
          <div className="vm-stage-top">
            <div>
              <span className="vm-secure">
                <ShieldCheck size={14} />
                Meeting room
              </span>
              <h1>{meetingTitle}</h1>
            </div>

            <button
              className="vm-icon-button"
              onClick={copyMeetingLink}
              aria-label="Copy meeting link"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="vm-participant-grid">
            {participants.length > 0 ? (
              participants.map((person, index) => {
                const isCurrentUser = index === 0;

                return (
                  <article
                    className={`vm-participant ${
                      isCurrentUser && micOn ? "speaking" : ""
                    }`}
                    key={person.id}
                  >
                    {isCurrentUser && cameraOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="vm-camera-video"
                      />
                    ) : (
                      <div className={`vm-avatar ${person.color}`}>
                        {person.initials}
                      </div>
                    )}

                    <div className="vm-participant-label">
                      <span>{person.name}</span>
                      {isCurrentUser && (
                        <span className="vm-you-tag">YOU</span>
                      )}
                    </div>

                    <div className="vm-participant-status">
                      {isCurrentUser && !micOn && <MicOff size={14} />}
                      {isCurrentUser && micOn && <Mic size={14} />}
                    </div>
                  </article>
                );
              })
            ) : (
              <p>No participants are listed for this meeting.</p>
            )}
          </div>

          <div className="vm-stage-footer">
            <div className="vm-participant-count">
              <Users size={16} />
              <span>{participants.length} participants listed</span>
            </div>

            <span>Meeting ID: {displayMeetingId}</span>
          </div>

          <div className="vm-controls">
            <button
              className={`vm-control ${micOn ? "active" : ""}`}
              onClick={toggleMic}
              title={micOn ? "Turn microphone off" : "Turn microphone on"}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              <span>{micOn ? "Mute" : "Unmute"}</span>
            </button>

            <button
              className={`vm-control ${cameraOn ? "active" : ""}`}
              onClick={toggleCamera}
              title={cameraOn ? "Turn camera off" : "Turn camera on"}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              <span>{cameraOn ? "Stop video" : "Start video"}</span>
            </button>

            <button
              className={`vm-control ${sharing ? "active" : ""}`}
              onClick={toggleScreenShare}
              title="Share screen"
            >
              <MonitorUp size={20} />
              <span>{sharing ? "Stop share" : "Share screen"}</span>
            </button>

            <button
              className={`vm-control ${chatOpen ? "active" : ""}`}
              onClick={() => {
                setChatOpen(!chatOpen);
                setParticipantsOpen(false);
              }}
              title="Toggle chat"
            >
              <MessageCircle size={20} />
              <span>Chat</span>
            </button>

            <button
              className={`vm-control ${participantsOpen ? "active" : ""}`}
              onClick={() => {
                setParticipantsOpen(!participantsOpen);
                setChatOpen(false);
              }}
              title="Toggle participants"
            >
              <Users size={20} />
              <span>People</span>
            </button>

            <button className="vm-leave-button" onClick={leaveMeeting}>
              <PhoneOff size={19} />
              <span>Leave</span>
            </button>
          </div>
        </section>

        {(chatOpen || participantsOpen) && (
          <aside className="vm-side-panel">
            <div className="vm-panel-header">
              <div>
                <h2>{chatOpen ? "Meeting chat" : "Participants"}</h2>
                <p>
                  {chatOpen
                    ? `${messages.length} messages`
                    : `${participants.length} participants listed`}
                </p>
              </div>

              <button
                className="vm-icon-button"
                onClick={() => {
                  setChatOpen(false);
                  setParticipantsOpen(false);
                }}
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {chatOpen ? (
              <>
                <div className="vm-chat-messages">
                  {messages.length ? (
                    messages.map((item) => (
                      <div className="vm-chat-message" key={item.id}>
                        <div className="vm-chat-message-top">
                          <strong>{item.name}</strong>
                          <span>{item.time}</span>
                        </div>
                        <p>{item.text}</p>
                      </div>
                    ))
                  ) : (
                    <p>No messages yet. Start the conversation!</p>
                  )}
                </div>

                <form
                  className="vm-chat-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type a message..."
                    aria-label="Chat message"
                  />

                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!message.trim()}
                  >
                    <Send size={17} />
                  </button>
                </form>
              </>
            ) : (
              <div className="vm-people-list">
                {participants.map((person, index) => (
                  <div className="vm-person-row" key={person.id}>
                    <div className={`vm-person-avatar ${person.color}`}>
                      {person.initials}
                    </div>

                    <div>
                      <strong>{person.name}</strong>
                      <span>
                        {index === 0 ? "You" : "Saved meeting participant"}
                      </span>
                    </div>

                    {index === 0 && (micOn ? <Mic size={15} /> : <MicOff size={15} />)}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      <footer className="vm-footer">
        <span>IntellMeet</span>
        <span>
          Camera and microphone use browser permissions. Live calls and
          shared chat require a real-time backend.
        </span>
      </footer>
    </main>
  );
}
