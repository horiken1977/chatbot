'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem', color: '#fff' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>マーケティング知識チャットボット</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>カテゴリを選択してください</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '900px', width: '100%' }}>
        {/* BtoC Card */}
        <Link href="/chat/btoc" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            padding: '2.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'pointer',
            height: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, marginBottom: '0.75rem', color: '#333' }}>BtoC マーケティング</h2>
            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>個人消費者向けマーケティング</p>
            <div style={{ fontSize: '0.875rem', color: '#999', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              全182シート（4,879チャンク）
            </div>
          </div>
        </Link>

        {/* BtoB Card */}
        <Link href="/chat/btob" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            padding: '2.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'pointer',
            height: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, marginBottom: '0.75rem', color: '#333' }}>BtoB マーケティング</h2>
            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>企業間マーケティング</p>
            <div style={{ fontSize: '0.875rem', color: '#999', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              全164シート（5,162チャンク）
            </div>
          </div>
        </Link>
      </div>

      <p style={{ marginTop: '3rem', fontSize: '0.875rem', color: '#fff', opacity: 0.7 }}>
        各カテゴリに特化したマーケティング知識でサポートします
      </p>
    </div>
  );
}
