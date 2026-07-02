'use client';

import { useEffect, useRef, useState } from 'react';

interface SkillProgressBarProps {
  skillName: string;
  percentage: number;
  delay?: number;
}

export default function SkillProgressBar({ skillName, percentage, delay = 0 }: SkillProgressBarProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [randomColor, setRandomColor] = useState({ start: '', end: '' });
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate random gradient colors
    const red = Math.floor(Math.random() * 257);
    const blue = Math.floor(Math.random() * 257);
    const green = Math.floor(Math.random() * 257);
    const red2 = Math.max(red - 30, 0);
    const blue2 = Math.max(blue - 30, 0);
    const green2 = Math.max(green - 30, 0);

    setRandomColor({
      start: `rgb(${red}, ${blue}, ${green})`,
      end: `rgb(${red2}, ${blue2}, ${green2})`
    });

    // Animate percentage after delay
    const timer = setTimeout(() => {
      let current = 0;
      const increment = percentage / 50; // 50 frames for smooth animation
      const interval = setInterval(() => {
        current += increment;
        if (current >= percentage) {
          setAnimatedPercentage(percentage);
          clearInterval(interval);
        } else {
          setAnimatedPercentage(Math.floor(current));
        }
      }, 25); // 25ms per frame = ~1.25s total animation

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="mb-6 phone:mb-4">
      <div className="flex items-center">
        {/* Skill Name */}
        <div className="w-1/4 text-left text-white font-medium phone:text-sm">
          {skillName}
        </div>

        {/* Progress Bar Container */}
        <div className="w-3/4 relative">
          <div className="relative h-9 phone:h-7 rounded-full bg-black/50 border border-white/25 shadow-inner overflow-hidden">
            {/* Animated Progress Bar */}
            <div
              ref={progressRef}
              className="absolute top-1/2 -translate-y-1/2 left-[2.5%] h-5 phone:h-4 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${animatedPercentage * 0.95}%`,
                background: `linear-gradient(to bottom, ${randomColor.start}, ${randomColor.end})`,
                boxShadow: `0 0 12px 0 ${randomColor.start}, inset 0 1px 0 0 rgba(255,255,255,0.45), inset 1px 0 0 0 rgba(255,255,255,0.25), inset -1px 0 0 0 rgba(255,255,255,0.25)`
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Percentage Label */}
            {animatedPercentage > 0 && (
              <div
                className="absolute top-[calc(100%+8px)] phone:top-[calc(100%+4px)] transition-all duration-300"
                style={{
                  left: `${Math.min(animatedPercentage * 0.95, 95)}%`
                }}
              >
                <div className="relative -translate-x-1/2">
                  {/* Arrow */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-2 overflow-hidden">
                    <div
                      className="absolute w-2 h-2 rotate-45 border border-black/20"
                      style={{
                        background: 'linear-gradient(135deg, rgb(86,86,86), rgb(76,76,76))',
                        top: '4px',
                        left: '2px'
                      }}
                    />
                  </div>

                  {/* Label */}
                  <div
                    className="px-3 py-1 phone:px-2 phone:py-0.5 rounded-md text-white text-xs phone:text-[10px] font-bold border border-black/20 shadow-lg"
                    style={{
                      background: 'linear-gradient(to bottom, rgb(76,76,76), rgb(38,38,38))',
                      textShadow: '0 -1px 0 #000, 0 1px 1px #000'
                    }}
                  >
                    {animatedPercentage}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
