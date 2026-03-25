import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { askGemini, generateQuiz, saveChatMessage, getChatHistory } from '../../services/gemini';
import { FiSend, FiX, FiMessageCircle, FiZap, FiBookOpen } from 'react-icons/fi';

export default function ChatBot({ classId, classContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEnd = useRef(null);

  useEffect(() => {
    if (isOpen && user?.uid && classId) {
      getChatHistory(user.uid, classId).then(setMessages).catch(console.error);
    }
  }, [isOpen, user, classId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      if (user?.uid && classId) await saveChatMessage(user.uid, classId, userMsg);
      const response = await askGemini(input, classContext || '');
      const aiMsg = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      if (user?.uid && classId) await saveChatMessage(user.uid, classId, aiMsg);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', timestamp: Date.now() }]);
    }
    setLoading(false);
  }

  async function handleQuickAction(action) {
    if (loading) return;
    let prompt = '';
    if (action === 'quiz') prompt = 'Generate a 5-question quiz about the current topic';
    else if (action === 'summary') prompt = 'Summarize the key concepts from this class';
    else if (action === 'explain') prompt = 'Explain the most important concept from the recent material in simple terms';
    setInput(prompt);
    const userMsg = { role: 'user', content: prompt, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const resp = await askGemini(prompt, classContext || '');
      setMessages(prev => [...prev, { role: 'assistant', content: resp, timestamp: Date.now() }]);
    } catch { }
    setLoading(false);
    setInput('');
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 900,
          width: 56, height: 56, borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-cta)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          transition: 'all var(--transition-base)',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
        }}
      >
        {isOpen ? <FiX size={24} color="white" /> : <FiMessageCircle size={24} color="white" />}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24, zIndex: 800,
          width: 400, maxWidth: 'calc(100vw - 48px)', height: 520,
          background: 'var(--surface-container)', borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            background: 'var(--surface-container-low)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-cta)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--body-md)' }}>Gurukul AI</div>
              <div style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                Your learning assistant
              </div>
            </div>
            {/* Quick Actions */}
            <button onClick={() => handleQuickAction('quiz')} className="btn btn-ghost btn-sm" title="Generate Quiz">
              <FiZap size={14} />
            </button>
            <button onClick={() => handleQuickAction('summary')} className="btn btn-ghost btn-sm" title="Summarize">
              <FiBookOpen size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 'var(--space-4)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center', padding: 'var(--space-10) var(--space-4)',
                color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🧠</div>
                <p>Ask me anything about your class!</p>
                <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--label-sm)' }}>
                  I can explain concepts, generate quizzes, and summarize materials.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                  : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                background: msg.role === 'user' ? 'var(--primary-container)' : 'var(--surface-container-high)',
                color: msg.role === 'user' ? 'var(--on-primary-container)' : 'var(--on-surface)',
                fontSize: 'var(--body-sm)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start', padding: 'var(--space-3) var(--space-4)',
                background: 'var(--surface-container-high)', borderRadius: 'var(--radius-lg)',
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--outline)', animation: 'pulse 1s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--outline)', animation: 'pulse 1s infinite 0.2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--outline)', animation: 'pulse 1s infinite 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex', gap: 'var(--space-2)',
            borderTop: '1px solid rgba(70, 69, 85, 0.15)',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gurukul AI..."
              className="input-field"
              style={{ flex: 1, fontSize: 'var(--body-sm)' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                background: input.trim() ? 'var(--primary-container)' : 'var(--surface-container-high)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition-fast)',
              }}
            >
              <FiSend size={16} color={input.trim() ? 'var(--on-primary-container)' : 'var(--outline)'} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
