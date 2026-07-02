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

  useEffect(() => {
    if (words.length === 0) return;

    let timeout: NodeJS.Timeout;

    const handleType = () => {
      const currentWordIndex = loopNum % words.length;
      const currentWord = words[currentWordIndex];

      if (isDeleting) {
        setText(currentWord.substring(0, text.length - 1));
        setShowCursor(text.length <= 1);
      } else {
        setText(currentWord.substring(0, text.length + 1));
        setShowCursor(text.length >= currentWord.length - 1);
      }

      let speed = isDeleting ? deleteSpeed : typeSpeed;

      if (!isDeleting && text === currentWord) {
        speed = delayBetweenWords;
        setIsDeleting(true);
        setShowCursor(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        speed = 500;
        setShowCursor(false);

        if (!loop && loopNum >= words.length - 1) {
          return;
        }
      }

      timeout = setTimeout(handleType, speed);
    };

    timeout = setTimeout(handleType, typeSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, loopNum, words, loop, typeSpeed, deleteSpeed, delayBetweenWords]);

  return { text, showCursor };
}
