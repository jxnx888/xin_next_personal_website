'use client';

import { useState, useEffect, useRef } from 'react';

interface TypewriterOptions {
  words: string[];
  loop?: boolean;
  typeSpeed?: number;
  deleteSpeed?: number;
  delayBetweenWords?: number;
}

export function useTypewriter({
  words,
  loop = true,
  typeSpeed = 150,
  deleteSpeed = 75,
  delayBetweenWords = 2000,
}: TypewriterOptions) {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  // Stores the delay to use for the NEXT effect-scheduled timeout.
  // Set inside the timeout callback before any setState, so the re-run reads
  // the intended delay rather than always defaulting to typeSpeed.
  const nextDelay = useRef(typeSpeed);
  const stopped = useRef(false);

  useEffect(() => {
    if (words.length === 0 || stopped.current) return;

    const currentWord = words[loopNum % words.length];

    const timeout = setTimeout(() => {
      if (isDeleting) {
        const newText = currentWord.substring(0, text.length - 1);
        setText(newText);

        if (text.length <= 1) {
          // Last character deleted — transition to next word
          if (!loop && loopNum >= words.length - 1) {
            stopped.current = true;
            return;
          }
          nextDelay.current = 500;
          setIsDeleting(false);
          setLoopNum(n => n + 1);
          setShowCursor(false);
        } else {
          nextDelay.current = deleteSpeed;
          setShowCursor(text.length <= 2);
        }
      } else {
        const newText = currentWord.substring(0, text.length + 1);
        setText(newText);

        if (newText.length >= currentWord.length) {
          // Word fully typed — pause before deleting
          nextDelay.current = delayBetweenWords;
          setIsDeleting(true);
          setShowCursor(true);
        } else {
          nextDelay.current = typeSpeed;
          setShowCursor(false);
        }
      }
    }, nextDelay.current);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, loopNum, words, loop, typeSpeed, deleteSpeed, delayBetweenWords]);

  return { text, showCursor };
}
