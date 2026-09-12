import { useEffect, useRef, useState, type FormEvent } from "react";
import { answer } from "./bot/answer";
import type { Listing } from "./types";

type Msg = { role: "user" | "bot"; text: string };

const CHIPS = [
  "What's the HOA fee?",
  "When was the roof redone?",
  "How far is Uptown?",
  "How long to the airport?",
];

type Props = {
  listing: Listing;
  onRoom?: (id: string) => void;
};

export default function BuyerBot({ listing, onRoom }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: `I can help with ${listing.name}. Ask HOA, roof, commute, rooms, or a showing. I stay on published listing facts.`,
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    const res = answer(q);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: res.text }]);
    setInput("");
    if (res.roomId && onRoom) onRoom(res.roomId);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className="bot">
      {open ? (
        <div className="bot-panel" role="dialog" aria-label="Buyer assistant">
          <header>
            <p>Buyer assistant</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              Close
            </button>
          </header>
          <div className="bot-log">
            {msgs.map((m, i) => (
              <p key={`${m.role}-${i}`} className={m.role}>
                {m.text}
              </p>
            ))}
            <div ref={endRef} />
          </div>
          <div className="bot-chips">
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => ask(c)}>
                {c}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this house"
              aria-label="Question"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      ) : (
        <button type="button" className="bot-fab" onClick={() => setOpen(true)}>
          Ask about this home
        </button>
      )}
    </div>
  );
}
