import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageCircle, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  senderName: string;
  createdAt: any;
  uid: string;
}

export default function Chat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'chat'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      await addDoc(collection(db, 'chat'), {
        message: newMessage,
        senderName: auth.currentUser?.displayName || 'Oyente',
        createdAt: serverTimestamp(),
        uid: auth.currentUser?.uid || 'anon'
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[110] bg-[#050505]/95 backdrop-blur-xl flex flex-col p-4 md:p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-white tracking-widest uppercase">Chat en Vivo</h2>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white"><X /></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map(msg => (
          <div key={msg.id} className={clsx("flex flex-col", { "items-end": msg.uid === auth.currentUser?.uid })}>
            <span className="text-[10px] text-white/30 uppercase mb-1">{msg.senderName}</span>
            <div className={clsx("px-4 py-2 rounded-2xl max-w-[80%] text-sm", { "bg-blue-600/20 text-blue-100": msg.uid === auth.currentUser?.uid, "bg-white/5 text-white/80": msg.uid !== auth.currentUser?.uid })}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-white/20"
        />
        <button type="submit" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}

// Helper to make clsx work
import { clsx } from "clsx";
