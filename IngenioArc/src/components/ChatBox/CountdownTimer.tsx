import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  initialSeconds?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialSeconds = 300 }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{
      background: '#f1f1f1',
      color: '#333',
      borderRadius: 12,
      padding: '4px 12px',
      fontWeight: 600,
      fontSize: 14,
      minWidth: 60,
      textAlign: 'center',
      marginLeft: 16,
    }}>
      {formatTime(seconds)}
    </div>
  );
};

export default CountdownTimer;
