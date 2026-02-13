// src/ChatBot.jsx
import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am AirQI Bot. Ask me about air quality data!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // 1. BUILD THE CONTEXT STRING (Your preferred method)
      // This creates one long script for the AI to read.
      
      const promptContext = `
      SYSTEM INSTRUCTIONS:
      You are AirQI Bot, an expert on Air Quality.
      - Data Sources: Open-Meteo, NASA (AOD), CAMS (PM2.5).
      - AC Fact: 1.5 Ton AC = ~1.2kg CO2/hr. 
      - Keep answers short.
      
      CONVERSATION HISTORY:
      ${messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')}
      User: ${userText}
      AI:`;

      // 2. SEND TO BACKEND
      // We send 'prompt' instead of 'history' now
      const response = await axios.post('/.netlify/functions/chat', { 
        prompt: promptContext 
      });

      // 3. HANDLE RESPONSE
      if (response.data.candidates && response.data.candidates.length > 0) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      } else {
        console.error("API Response Issue:", response.data);
        throw new Error("No candidates in response");
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "⚠️ I'm having trouble connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
            position: 'fixed', bottom: '20px', right: '20px', 
            width: '60px', height: '60px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #00f260, #0575E6)', 
            color: 'white', border: 'none', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
            cursor: 'pointer', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {isOpen ? <FiX size={28}/> : <FiMessageSquare size={28}/>}
      </button>

      {isOpen && (
        <div style={{
            position: 'fixed', bottom: '90px', right: '20px',
            width: '350px', height: '500px', 
            background: 'rgba(20, 20, 30, 0.95)',
            backdropFilter: 'blur(12px)', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.15)', 
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden'
        }}>
            <div style={{padding: '15px', background: '#0575E6', color: 'white', fontWeight:'bold'}}>
                <FiCpu style={{marginRight:'10px'}}/> AirQI Assistant
            </div>

            <div style={{flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? '#0575E6' : 'rgba(255,255,255,0.1)',
                        padding: '10px', borderRadius: '10px', color: 'white', maxWidth: '80%'
                    }}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div style={{color:'white', marginLeft:'10px'}}>Typing...</div>}
                <div ref={messagesEndRef} />
            </div>

            <div style={{padding: '15px', display: 'flex', gap: '10px', background:'rgba(0,0,0,0.2)'}}>
                <input 
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask me..."
                    style={{flex: 1, padding: '10px', borderRadius: '20px', border:'none', outline:'none'}}
                />
                <button onClick={handleSend} style={{background: '#0575E6', color: 'white', border: 'none', borderRadius: '50%', width:'40px', height:'40px'}}><FiSend/></button>
            </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;