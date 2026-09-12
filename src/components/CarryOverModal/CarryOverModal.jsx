import { ChefHat } from 'lucide-react';

export default function CarryOverModal({ onKeep, onEdit, onClear }) {
  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={iconWrapStyle}>
          <ChefHat size={22} />
        </div>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, margin: '14px 0 6px', color: '#2B2320' }}>
          Yesterday's menu is still up
        </h3>
        <p style={{ fontSize: 14, color: '#6B5F58', margin: '0 0 22px', lineHeight: 1.5 }}>
          You didn't close out yesterday. Want to keep it running, tweak it, or start fresh for today?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={primaryBtn} onClick={onKeep}>
            Keep yesterday's menu
          </button>
          <button style={secondaryBtn} onClick={onEdit}>
            Keep it, but let me edit
          </button>
          <button style={dangerBtn} onClick={onClear}>
            Clear it and start fresh
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(43, 35, 32, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 1000,
};

const cardStyle = {
  background: '#fff',
  borderRadius: 20,
  padding: '28px 26px',
  maxWidth: 360,
  width: '100%',
  textAlign: 'center',
};

const iconWrapStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: 14,
  background: 'linear-gradient(135deg, #FFE3D1, #FFD0B0)',
  color: '#C1440E',
};

const primaryBtn = {
  padding: '13px 18px',
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(135deg, #FF6B35, #C1440E)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14.5,
  cursor: 'pointer',
};

const secondaryBtn = {
  padding: '13px 18px',
  border: '1.5px solid rgba(43,35,32,0.14)',
  borderRadius: 12,
  background: '#fff',
  color: '#2B2320',
  fontWeight: 700,
  fontSize: 14.5,
  cursor: 'pointer',
};

const dangerBtn = {
  padding: '13px 18px',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  color: '#B3261E',
  fontWeight: 700,
  fontSize: 14.5,
  cursor: 'pointer',
};