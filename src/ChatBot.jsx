// src/ChatBot.jsx
import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am AirQI Bot. System Ready." }
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
      const promptContext = `
      You are AirQI Bot. Keep answers short.
      User: ${userText}
      AI:`;

      console.log("Sending request to /.netlify/functions/chat...");

      // CALL BACKEND
      const response = await axios.post('/.netlify/functions/chat', { 
        prompt: promptContext 
      });

      console.log("Response received:", response);

      if (response.data.candidates) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      } else if (response.data.error) {
        throw new Error("Backend Error: " + JSON.stringify(response.data.error));
      } else {
        throw new Error("Empty response from server.");
      }

    } catch (error) {
      console.error("FULL ERROR DETAILS:", error);
      
      // DETERMINE THE REAL ERROR
      let errorMessage = "Unknown Error";
      if (error.response) {
        // The server responded with a status code (404, 500, etc.)
        errorMessage = `Server Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // The request was made but no response received
        errorMessage = "No response from server (Network/Timeout).";
      } else {
        errorMessage = error.message;
      }

      setMessages(prev => [...prev, { role: 'model', text: `❌ DEBUG INFO: ${errorMessage}` }]);
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
            background: 'linear-gradient(135deg, #FF512F, #DD2476)', // Changed color to signal Debug Mode
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
            <div style={{padding: '15px', background: '#DD2476', color: 'white', fontWeight:'bold'}}>
                <FiCpu style={{marginRight:'10px'}}/> AirQI DEBUGGER
            </div>

            <div style={{flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? '#DD2476' : 'rgba(255,255,255,0.1)',
                        padding: '10px', borderRadius: '10px', color: 'white', maxWidth: '80%', wordWrap: 'break-word'
                    }}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div style={{color:'white', marginLeft:'10px'}}>Testing Connection...</div>}
                <div ref={messagesEndRef} />
            </div>

            <div style={{padding: '15px', display: 'flex', gap: '10px', background:'rgba(0,0,0,0.2)'}}>
                <input 
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type 'test'..."
                    style={{flex: 1, padding: '10px', borderRadius: '20px', border:'none', outline:'none'}}
                />
                <button onClick={handleSend} style={{background: '#DD2476', color: 'white', border: 'none', borderRadius: '50%', width:'40px', height:'40px'}}><FiSend/></button>
            </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;