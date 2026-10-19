import { useEffect, useState } from 'react';

// Đếm ngược tới mốc thời gian `targetTs` (ms). Trả về số giây còn lại (>= 0).
export default function useCountdown(targetTs) {
  const calc = () => (targetTs ? Math.max(0, Math.ceil((targetTs - Date.now()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!targetTs) return undefined;
    const t = setInterval(() => {
      const v = calc();
      setLeft(v);
      if (v <= 0) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTs]);

  return left;
}

export const formatMMSS = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
