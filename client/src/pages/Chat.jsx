import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';

const mdComponents = {
  p:      ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'var(--color-text)' }}>{children}</strong>,
  ol:     ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0 8px' }}>{children}</ol>,
  ul:     ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0 8px' }}>{children}</ul>,
  li:     ({ children }) => <li style={{ marginBottom: 6, lineHeight: 1.5 }}>{children}</li>,
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1>Ask Reggie</h1>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 8,
      }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Ask about programs, sites, or availability. Try: "Show me open programs" or "What sites are configured?"
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
              border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
              fontSize: 15,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {msg.role === 'assistant'
                ? <Markdown components={mdComponents}>{msg.content}</Markdown>
                : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '18px 18px 18px 4px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              fontSize: 15,
            }}>
              ...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid var(--color-border)',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about programs..."
          rows={1}
          disabled={loading}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: 20,
            padding: '10px 16px',
            fontSize: 15,
            lineHeight: 1.5,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            opacity: !input.trim() || loading ? 0.5 : 1,
            alignSelf: 'flex-end',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
