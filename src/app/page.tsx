'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    sheetName: string;
    section: string;
    type: string;
    similarity: number;
    contentPreview: string;
  }>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          maxResults: 5,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>マーケティング知識チャットボット</h1>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
          全182シート（4,879チャンク）のデータで稼働中
        </p>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f5f5f5' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
            <p>マーケティングについて質問してください</p>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              <p>例: マーケティングとは何ですか？</p>
              <p>例: 継続顧客の重要性について教えてください</p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: msg.role === 'user' ? '#007AFF' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#000',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

              {msg.sources && msg.sources.length > 0 && (
                <details style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
                  <summary style={{ cursor: 'pointer' }}>参考ソース ({msg.sources.length}件)</summary>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem' }}>
                    {msg.sources.map((source, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>
                        {source.sheetName} - {source.section} (類似度: {(source.similarity * 100).toFixed(1)}%)
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>
            <div>回答を生成中...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1rem',
          borderTop: '1px solid #e0e0e0',
          background: '#fff',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を入力してください..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: loading || !input.trim() ? '#ccc' : '#007AFF',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          送信
        </button>
      </form>
    </div>
  );
}
