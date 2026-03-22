/*
 * 💬 STL Platform - Chat Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { getSocket } from "@/lib/socket";

type Channel = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isReadonly: boolean;
  _count: { messages: number };
};

type Message = {
  id: string;
  type: "TEXT" | "STICKER";
  text: string | null;
  stickerId: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
  };
};

type Sticker = {
  id: string;
  title: string;
  src: string;
};

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = [
    // 😀 Smileys & Emotion
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇",
    "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
    "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
    "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
    "🥵", "🥶", "😶‍🌫️", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
    "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭",
    "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈",
    "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖",
    // 👋 Gestures & People
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
    "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
    "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶",
    "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋",
    // 🐶 Animals & Nature
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷",
    "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴",
    "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍",
    "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳",
    "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫",
    "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕",
    "🐩", "🦮", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨",
    "🦡", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔",
    // 🍏 Food & Drink
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭",
    "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄",
    "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞",
    "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙", "🧆",
    "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪",
    "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧",
    "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯",
    "🥛", "🍼", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸",
    "🍹", "🧉", "🍾", "🧊",
    // ⚽ Activity & Sports
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸",
    "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽",
    "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺",
    "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏊", "🚴", "🚵", "🧗", "🤹",
    // 🚗 Travel & Places
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛",
    "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘",
    "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆",
    "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶",
    "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "⛽", "🚧", "🚦", "🚥", "🚏", "🗺️",
    "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️",
    "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺", "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭",
    "🏢", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏩", "💒", "🏛️", "⛪",
    "🕌", "🕍", "🛕", "🕋",
    // ⌚ Objects
    "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💾", "💿",
    "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺",
    "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋",
    "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "💰",
    "💳", "💎", "⚖️", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩", "⚙️", "🧱", "⛓️",
    "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "⚱️", "🏺",
    "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊", "💉", "🩸",
    "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹", "🧺", "🧻", "🚽", "🚰", "🚿", "🛁", "🛀",
    "🧼", "🪒", "🧽", "🧴", "🛎️", "🔑", "🗝️", "🚪", "🪑", "🛋️", "🛏️", "🖼️", "🧳",
    // ❤️ Symbols
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞",
    "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯",
    "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
    "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸",
    "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️",
    "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢",
    "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️",
    "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹",
    "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🈳",
    "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🎦", "📶", "🈁",
    "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣",
    "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️",
    "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽",
    "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️",
    "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "♾️",
    "💲", "💱", "™️", "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔝", "🔜",
    "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺",
    "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️",
    "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊",
    "🔔", "🔕", "📣", "📢", "💬", "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴",
    "🀄", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛",
    "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧",
    // 🏳️ Flags (popular ones)
    "🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏴‍☠️", "🇦🇫", "🇦🇽", "🇦🇱", "🇩🇿", "🇦🇸", "🇦🇩",
    "🇦🇴", "🇦🇮", "🇦🇶", "🇦🇬", "🇦🇷", "🇦🇲", "🇦🇼", "🇦🇺", "🇦🇹", "🇦🇿", "🇧🇸", "🇧🇭",
    "🇧🇩", "🇧🇧", "🇧🇾", "🇧🇪", "🇧🇿", "🇧🇯", "🇧🇲", "🇧🇹", "🇧🇴", "🇧🇦", "🇧🇼", "🇧🇷",
    "🇮🇴", "🇻🇬", "🇧🇳", "🇧🇬", "🇧🇫", "🇧🇮", "🇰🇭", "🇨🇲", "🇨🇦", "🇮🇨", "🇨🇻", "🇧🇶",
    "🇰🇾", "🇨🇫", "🇹🇩", "🇨🇱", "🇨🇳", "🇨🇽", "🇨🇨", "🇨🇴", "🇰🇲", "🇨🇬", "🇨🇩", "🇨🇰",
    "🇨🇷", "🇨🇮", "🇭🇷", "🇨🇺", "🇨🇼", "🇨🇾", "🇨🇿", "🇩🇰", "🇩🇯", "🇩🇲", "🇩🇴", "🇪🇨",
    "🇪🇬", "🇸🇻", "🇬🇶", "🇪🇷", "🇪🇪", "🇪🇹", "🇪🇺", "🇫🇰", "🇫🇴", "🇫🇯", "🇫🇮", "🇫🇷",
    "🇬🇫", "🇵🇫", "🇹🇫", "🇬🇦", "🇬🇲", "🇬🇪", "🇩🇪", "🇬🇭", "🇬🇮", "🇬🇷", "🇬🇱", "🇬🇩",
    "🇬🇵", "🇬🇺", "🇬🇹", "🇬🇬", "🇬🇳", "🇬🇼", "🇬🇾", "🇭🇹", "🇭🇳", "🇭🇰", "🇭🇺", "🇮🇸",
    "🇮🇳", "🇮🇩", "🇮🇷", "🇮🇶", "🇮🇪", "🇮🇲", "🇮🇱", "🇮🇹", "🇯🇲", "🇯🇵", "🇯🇪", "🇯🇴",
    "🇰🇿", "🇰🇪", "🇰🇮", "🇽🇰", "🇰🇼", "🇰🇬", "🇱🇦", "🇱🇻", "🇱🇧", "🇱🇸", "🇱🇷", "🇱🇾",
    "🇱🇮", "🇱🇹", "🇱🇺", "🇲🇴", "🇲🇰", "🇲🇬", "🇲🇼", "🇲🇾", "🇲🇻", "🇲🇱", "🇲🇹", "🇲🇭",
    "🇲🇶", "🇲🇷", "🇲🇺", "🇾🇹", "🇲🇽", "🇫🇲", "🇲🇩", "🇲🇨", "🇲🇳", "🇲🇪", "🇲🇸", "🇲🇦",
    "🇲🇿", "🇲🇲", "🇳🇦", "🇳🇷", "🇳🇵", "🇳🇱", "🇳🇨", "🇳🇿", "🇳🇮", "🇳🇪", "🇳🇬", "🇳🇺",
    "🇳🇫", "🇰🇵", "🇲🇵", "🇳🇴", "🇴🇲", "🇵🇰", "🇵🇼", "🇵🇸", "🇵🇦", "🇵🇬", "🇵🇾", "🇵🇪",
    "🇵🇭", "🇵🇳", "🇵🇱", "🇵🇹", "🇵🇷", "🇶🇦", "🇷🇪", "🇷🇴", "🇷🇺", "🇷🇼", "🇼🇸", "🇸🇲",
    "🇸🇹", "🇸🇦", "🇸🇳", "🇷🇸", "🇸🇨", "🇸🇱", "🇸🇬", "🇸🇽", "🇸🇰", "🇸🇮", "🇬🇸", "🇸🇧",
    "🇸🇴", "🇿🇦", "🇰🇷", "🇸🇸", "🇪🇸", "🇱🇰", "🇧🇱", "🇸🇭", "🇰🇳", "🇱🇨", "🇵🇲", "🇻🇨",
    "🇸🇩", "🇸🇷", "🇸🇿", "🇸🇪", "🇨🇭", "🇸🇾", "🇹🇼", "🇹🇯", "🇹🇿", "🇹🇭", "🇹🇱", "🇹🇬",
    "🇹🇰", "🇹🇴", "🇹🇹", "🇹🇳", "🇹🇷", "🇹🇲", "🇹🇨", "🇹🇻", "🇻🇮", "🇺🇬", "🇺🇦", "🇦🇪",
    "🇬🇧", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "🇺🇸", "🇺🇾", "🇺🇿", "🇻🇺", "🇻🇦", "🇻🇪", "🇻🇳",
    "🇼🇫", "🇪🇭", "🇾🇪", "🇿🇲", "🇿🇼"
  ];

  useEffect(() => {
    loadChannels();
    loadStickers();
    loadUserRole();
  }, []);

  useEffect(() => {
    if (currentChannel) {
      loadMessages();

      // 🔌 Connect to WebSocket
      const socket = getSocket();

      // 🚪 Join channel room
      socket.emit('join-channel', currentChannel.slug);

      // 👂 Listen for new messages
      socket.on('new-message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      // 🗑️ Listen for deleted messages
      socket.on('message-deleted', (messageId: string) => {
        setMessages((prev) => prev.filter(m => m.id !== messageId));
      });

      return () => {
        socket.emit('leave-channel', currentChannel.slug);
        socket.off('new-message');
        socket.off('message-deleted');
      };
    }
  }, [currentChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadChannels() {
    const res = await fetch("/api/chat/channels");
    const data = await res.json();
    if (res.ok) {
      setChannels(data.channels);
      if (data.channels.length > 0 && !currentChannel) {
        setCurrentChannel(data.channels[0]);
      }
    }
  }

  async function loadStickers() {
    const res = await fetch("/api/chat/stickers");
    const data = await res.json();
    if (res.ok) {
      setStickers(data.stickers);
    }
  }

  async function loadUserRole() {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (res.ok && data.user) {
      setUserRole(data.user.role);
    }
  }

  async function loadMessages() {
    if (!currentChannel) return;
    const res = await fetch(`/api/chat/channels/${currentChannel.slug}/messages?limit=50`);
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages);
    }
  }

  async function sendMessage() {
    if (!messageText.trim() || !currentChannel || loading) return;

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/chat/channels/${currentChannel.slug}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "TEXT", text: messageText })
    });

    const data = await res.json();

    if (res.ok) {
      setMessageText("");
      // 📨 Message will be added via WebSocket event
    } else {
      setError(data.error || "Ошибка отправки");
    }

    setLoading(false);
  }

  async function sendSticker(stickerId: string) {
    if (!currentChannel || loading) return;

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/chat/channels/${currentChannel.slug}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "STICKER", stickerId })
    });

    const data = await res.json();

    if (res.ok) {
      setShowStickers(false);
      // 📨 Message will be added via WebSocket event
    } else {
      setError(data.error || "Ошибка отправки");
    }

    setLoading(false);
  }

  async function deleteMessage(messageId: string) {
    if (!confirm("Удалить сообщение?")) return;

    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      // 🗑️ Message will be removed via WebSocket event
    }
  }

  function insertEmoji(emoji: string) {
    setMessageText(messageText + emoji);
    setShowEmoji(false);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className={styles.page}>
      <ThemeSwitcher />
      <main className={styles.main}>
        <header className={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Link href="/" className={styles.backLink}>
                ← Главная
              </Link>
              <h1 className={styles.title}>Чат сообщества</h1>
              <p className={styles.subtitle}>Общайтесь с участниками в реальном времени</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              <Link href="/chat/rules" className={styles.rulesLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                  <rect x="3" y="2" width="18" height="20" rx="2"/>
                  <line x1="7" y1="7" x2="17" y2="7"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                  <line x1="7" y1="17" x2="13" y2="17"/>
                </svg>
                Правила чата
              </Link>
              {(userRole === "ADMIN" || userRole === "MODERATOR") && (
                <div style={{ display: "flex", gap: "12px" }}>
                  {userRole === "ADMIN" && (
                    <Link href="/chat/admin" className={styles.adminLink}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                      </svg>
                      Управление
                    </Link>
                  )}
                  <Link href="/chat/moderation" className={styles.adminLink}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Модерация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Каналы</h2>
            <div className={styles.channelList}>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  className={`${styles.channelButton} ${currentChannel?.id === channel.id ? styles.active : ""}`}
                  onClick={() => setCurrentChannel(channel)}
                >
                  <div className={styles.channelIcon}>
                    {channel.isReadonly ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.channelInfo}>
                    <div className={styles.channelName}>
                      {channel.title}
                      {channel.isReadonly && <span className={styles.readonlyBadge}>Только чтение</span>}
                    </div>
                    {channel.description && (
                      <div className={styles.channelDescription}>{channel.description}</div>
                    )}
                    <div className={styles.channelMeta}>
                      <span className={styles.messageCount}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {channel._count.messages}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.chatArea}>
            <div className={styles.chatHeader}>
              <div>
                <h3># {currentChannel?.title || "Выберите канал"}</h3>
                {currentChannel?.description && (
                  <p className={styles.channelDesc}>{currentChannel.description}</p>
                )}
              </div>
            </div>

            <div className={styles.messagesArea}>
              {messages.map((msg) => (
                <div key={msg.id} className={styles.message}>
                  <div className={styles.messageAvatar}>
                    {msg.user.avatarUrl ? (
                      <img src={msg.user.avatarUrl} alt={msg.user.username} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {(msg.user.displayName || msg.user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageAuthor}>
                        {msg.user.displayName || msg.user.username}
                      </span>
                      {msg.user.role !== "USER" && (
                        <span className={styles.roleBadge}>{msg.user.role}</span>
                      )}
                      <span className={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString("ru", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <div className={styles.messageBody}>
                      {msg.type === "TEXT" && <p>{msg.text}</p>}
                      {msg.type === "STICKER" && (
                        <span className={styles.stickerMessage}>
                          {stickers.find(s => s.id === msg.stickerId)?.src || msg.stickerId}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={() => deleteMessage(msg.id)}
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputArea}>
              <button
                className={styles.emojiButton}
                onClick={() => {
                  setShowEmoji(!showEmoji);
                  setShowStickers(false);
                }}
                title="Эмодзи"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"/>
                  <circle cx="9" cy="9" r="1" fill="currentColor"/>
                  <circle cx="15" cy="9" r="1" fill="currentColor"/>
                </svg>
              </button>
              <button
                className={styles.stickerButton}
                onClick={() => {
                  setShowStickers(!showStickers);
                  setShowEmoji(false);
                }}
                title="Стикеры"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 16.9C4 17.8 5.2 18 6.2 17.5C7.3 17 8.5 17.9 8.5 19.1V19.5C8.5 20.9 9.6 22 11 22C16.5 22 21 17.5 21 12C21 6.5 16.5 2 12 2Z"/>
                  <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                  <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                  <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
                  <circle cx="14" cy="18" r="1.5" fill="currentColor"/>
                  <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                  <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
                  <circle cx="8" cy="11" r="1.5" fill="currentColor"/>
                </svg>
              </button>
              <input
                type="text"
                placeholder="Написать сообщение..."
                className={styles.messageInput}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                className={styles.sendButton}
                onClick={sendMessage}
                disabled={loading || !messageText.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10 L18 2 L10 18 L8 11 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>

              {showEmoji && (
                <div className={styles.emojiPicker}>
                  {emojis.map((emoji, i) => (
                    <button
                      key={i}
                      className={styles.emojiItem}
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {showStickers && (
                <div className={styles.stickerPicker}>
                  {stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      className={styles.stickerItem}
                      onClick={() => sendSticker(sticker.id)}
                      title={sticker.title}
                    >
                      {sticker.src}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
