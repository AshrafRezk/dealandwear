import { useState, useRef, useEffect } from 'react';

export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 100 }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    setIsSwiping(true);
    // Support mostly touch but also mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isSwiping) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    setOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    
    if (offset.x > threshold) {
      if (onSwipeRight) onSwipeRight();
    } else if (offset.x < -threshold) {
      if (onSwipeLeft) onSwipeLeft();
    }
    
    // Reset immediately, we will unmount the card visually anyway.
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isSwiping) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSwiping]);

  return {
    offset,
    isSwiping,
    bind: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      
      onTouchStart: handlePointerDown,
      onTouchMove: handlePointerMove,
      onTouchEnd: handlePointerUp,
    }
  };
};
