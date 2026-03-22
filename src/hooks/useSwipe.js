import { useState, useRef, useEffect } from 'react';
import { hapticSuccess, hapticAction, haptic } from '../utils/haptics';

export const useSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 100 }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const thresholdReached = useRef(false);

  const handlePointerDown = (e) => {
    setIsSwiping(true);
    thresholdReached.current = false;
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
    
    // Haptic feedback tick when crossing thresholds dynamically
    if (!thresholdReached.current && Math.abs(dx) > threshold) {
      haptic(5); // light tick 
      thresholdReached.current = true;
    } else if (thresholdReached.current && Math.abs(dx) <= threshold) {
      haptic(5); // pulled back
      thresholdReached.current = false;
    }
    
    setOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    
    if (offset.x > threshold) {
      hapticSuccess();
      if (onSwipeRight) onSwipeRight();
    } else if (offset.x < -threshold) {
      hapticAction();
      if (onSwipeLeft) onSwipeLeft();
    }
    
    // Reset immediately, we will unmount the card visually anyway.
    setOffset({ x: 0, y: 0 });
    thresholdReached.current = false;
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
