// src/ChatBot.jsx
import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { RiLeafLine } from 'react-icons/ri'; 
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I am Leaf Bot 🌿. Ask me about air quality or who created me!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen) setShowWelcome(false);
  }, [isOpen]);

  // ✅ HELPER FUNCTION: Turns **text** into Bold Text
  const renderText = (text) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // ✅ UPDATED SYSTEM INSTRUCTIONS: Added Founder Info
      const promptContext = `
      SYSTEM INSTRUCTIONS:
      You are "Leaf Bot", a friendly AI assistant for the AirQI Dashboard.
      
      YOUR IDENTITY:
      - Name: Leaf Bot 🌿
      - Creator: You were created by "Aditya Roy and his AirQI Team". (Always mention this if asked who made you or who is your founder).
      - Purpose: To help users understand air quality, weather, and nature.
      - Tone: Friendly, organic, and helpful. 
      
      FORMATTING RULES:
      - Keep answers short and easy to read.
      - Use **bold** for important words.
      
      CONVERSATION HISTORY:
      ${messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')}
      User: ${userText}
      AI:`;

      const response = await axios.post('/.netlify/functions/chat', { 
        prompt: promptContext 
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "🌿 My leaves are rustling... I didn't quite catch that. Try again?" }]);
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "⚠️ Connection error. Please check your internet." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* POP-UP BUBBLE */}
      {!isOpen && showWelcome && (
        <div style={{
            position: 'fixed', bottom: '90px', right: '30px',
            background: 'white', padding: '12px 20px', borderRadius: '20px 20px 0 20px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 9998,
            fontFamily: 'Segoe UI, sans-serif', fontSize: '0.95rem', fontWeight: '600', color: '#2e7d32',
            animation: 'fadeInUp 0.5s ease-out forwards', border: '1px solid #e0e0e0',
            display: 'flex', alignItems: 'center', gap: '8px'
        }}>
           <span>Hiii..! I am Leaf Bot 🌿</span>
           <button onClick={(e) => {e.stopPropagation(); setShowWelcome(false)}} style={{border:'none', background:'transparent', cursor:'pointer', color:'#999'}}>
             <FiX size={14}/>
           </button>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
            position: 'fixed', bottom: '20px', right: '20px', 
            width: '65px', height: '65px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
            color: 'white', border: 'none', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
            cursor: 'pointer', zIndex: 9999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? <FiX size={30} color="#145a32"/> : (
            <div style={{animation: 'sway 3s ease-in-out infinite'}}>
                <RiLeafLine size={32} color="#145a32" />
            </div>
        )}
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div style={{
            position: 'fixed', bottom: '100px', right: '20px',
            width: '350px', height: '500px', 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)', borderRadius: '20px',
            border: '1px solid rgba(0,0,0,0.1)', 
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 9999, overflow: 'hidden',
            fontFamily: 'Segoe UI, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '15px', background: 'linear-gradient(90deg, #43e97b, #38f9d7)',
                borderBottom: '1px solid rgba(0,0,0,0.05)', 
                display: 'flex', alignItems: 'center', gap: '10px', color: '#145a32'
            }}>
                <div style={{background: 'rgba(255,255,255,0.4)', padding:'8px', borderRadius:'50%'}}>
                    <RiLeafLine size={20}/>
                </div>
                <div>
                    <div style={{fontWeight: 'bold', fontSize:'1rem'}}>Leaf Bot Assistant</div>
                    <div style={{fontSize:'0.75rem', opacity:0.8, display:'flex', alignItems:'center', gap:'5px'}}>
                        <span style={{width:'8px', height:'8px', background:'#145a32', borderRadius:'50%'}}></span> Online
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', background: '#f9fbf9'}}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%', display: 'flex', flexDirection: 'column'
                    }}>
                         <div style={{
                            background: msg.role === 'user' ? '#2e7d32' : 'white',
                            color: msg.role === 'user' ? 'white' : '#333',
                            padding: '12px 16px', 
                            borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                            fontSize: '0.9rem', lineHeight: '1.5',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: msg.role === 'user' ? 'none' : '1px solid #eee'
                        }}>
                            {/* ✅ CALLING THE HELPER FUNCTION HERE */}
                            {renderText(msg.text)}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div style={{alignSelf: 'flex-start', background: 'white', padding: '10px 15px', borderRadius: '15px 15px 15px 0', border:'1px solid #eee'}}>
                         <div style={{display:'flex', gap:'5px', alignItems:'center', color:'#2e7d32', fontSize:'0.8rem'}}>
                            <RiLeafLine className="spin-slow" />
                            <span>Thinking...</span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', background:'white'}}>
                <input 
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Leaf Bot..."
                    style={{
                        flex: 1, background: '#f5f5f5', border: '1px solid #e0e0e0', 
                        color: '#333', padding: '12px', borderRadius: '25px', outline: 'none', fontSize:'0.95rem'
                    }}
                />
                <button onClick={handleSend} style={{
                    background: '#2e7d32', border: 'none', width: '45px', height:'45px', 
                    borderRadius: '50%', cursor: 'pointer', color: 'white', display:'flex', alignItems:'center', justifyContent:'center',
                    transition: 'background 0.2s', boxShadow: '0 3px 10px rgba(46, 125, 50, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1b5e20'}
                onMouseOut={(e) => e.currentTarget.style.background = '#2e7d32'}
                >
                    <FiSend size={18} style={{marginLeft:'-2px'}}/>
                </button>
            </div>
            
            <style>{`
                @keyframes sway {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
      )}
    </>
  );
};

export default ChatBot;