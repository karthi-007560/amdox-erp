
import { useState } from "react";
import "./ChatPanel.css";

interface Message {
  sender: string;
  text: string;
}

interface Props {
  messages: Message[];
  onSend: (message: string) => void;
}

export default function ChatPanel({ messages, onSend }: Props) {
  const [message, setMessage] = useState("");

  const send = () => {
    const value = message.trim();
    if (!value) return;
    onSend(value);
    setMessage("");
  };

  return (
    <div className="mr-chat">
      <h3>Meeting Chat</h3>

      <div className="mr-chat-messages">
        {messages.map((item, index) => (
          <div className="mr-chat-message" key={index}>
            <strong>{item.sender}</strong>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mr-chat-input">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
