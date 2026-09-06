import React, { useState, useEffect, useRef } from 'react';
import { useCity } from '../../context/CityContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { chatService } from '../../services/chatService';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Trash2, 
  CornerDownLeft,
  AlertCircle
} from 'lucide-react';

export const ChatbotDrawer = ({ activePage }) => {
  const { selectedCityId, selectedCity } = useCity();
  const { telemetry } = useTelemetry();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am the Living City Urban AI Assistant. I can explain real-time conditions, flood risk calculations, scikit-learn predictions, and what-if simulation results for ${selectedCity?.name || 'the city'}. How can I assist you today?`,
      classifications: ['Platform Overview'],
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Page-specific suggested prompts
  const pagePrompts = {
    dashboard: [
      "Summarize current city condition",
      "Why is the flood risk at this level?",
      "What is affecting City Health score?",
      "What happens if rainfall increases by 50%?"
    ],
    'digital-twin': [
      "Explain the road corridors shown on the map",
      "Which flood catchment area is most vulnerable?",
      "Explain the traffic flow congestion status"
    ],
    analytics: [
      "What is the most important historical trend?",
      "How does rainfall correlate with traffic delays?",
      "Summarize the recent City Health progression"
    ],
    prediction: [
      "Explain the ML flood risk horizon prediction",
      "Why is the confidence score at this level?",
      "What municipal precautions should be prioritized?"
    ],
    simulation: [
      "Explain the What-If simulation results",
      "What happens if rainfall increases by 100%?",
      "How does drainage efficiency impact this stress test?"
    ]
  };

  const currentPrompts = pagePrompts[activePage] || pagePrompts.dashboard;

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await chatService.sendMessage({
        message: text,
        cityId: selectedCityId,
        pageContext: activePage,
        history: historyPayload
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        classifications: res.data_classification || ['AI Explanation'],
        suggestedFollowups: res.suggested_followups || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setError('AI Assistant is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation reset. Inquiring on ${selectedCity?.name || 'the active city'} (${activePage.replace('-', ' ').toUpperCase()} view).`,
        classifications: ['System'],
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button 
        className="chatbot-trigger-btn"
        onClick={() => setIsOpen(true)}
        title="Open Living City AI Assistant"
      >
        <Bot size={24} />
      </button>

      {/* Side Drawer Panel */}
      <div className={`chatbot-drawer ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-title">
            <Sparkles size={16} color="#06B6D4" />
            <span>Living City AI Assistant</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="chatbot-context-tag">
              {selectedCity?.name || selectedCityId}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 6px' }}
              onClick={clearChat}
              title="Clear conversation"
            >
              <Trash2 size={13} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 6px' }}
              onClick={() => setIsOpen(false)}
              title="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="chatbot-body">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              <div>{msg.content}</div>

              {msg.classifications && msg.classifications.length > 0 && (
                <div className="chat-bubble-meta">
                  {msg.classifications.map((tag, tIdx) => (
                    <span key={tIdx} className="chat-chip">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Analyzing city telemetry & reasoning with Gemini...
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '12px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Contextual Quick Prompts */}
        <div className="quick-prompts-container">
          <span className="quick-prompts-label">Suggested Questions ({activePage}):</span>
          <div className="quick-prompt-chips">
            {currentPrompts.map((q, idx) => (
              <button
                key={idx}
                className="quick-prompt-btn"
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="chatbot-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about weather, flood risk, simulation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '8px 12px' }}
            onClick={() => handleSend()}
            disabled={loading || !inputValue.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
};
