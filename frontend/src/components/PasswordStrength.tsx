import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pwd: string): { level: number; label: string; color: string } {
  if (!pwd) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 1, label: '弱', color: '#C75450' };
  if (score <= 3) return { level: 2, label: '中', color: '#D4A853' };
  return { level: 3, label: '强', color: '#5B8C5A' };
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { level, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i <= level ? color : 'var(--color-border)',
            transition: 'all 0.3s',
          }}
        />
      ))}
      <span style={{ fontSize: 12, color, fontWeight: 500, minWidth: 20 }}>{label}</span>
    </div>
  );
};

export default PasswordStrength;
