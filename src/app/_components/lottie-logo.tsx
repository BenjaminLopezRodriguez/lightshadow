"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

interface LottieLogoProps {
  width?: number;
  height?: number;
  className?: string;
  playOnHover?: boolean;
}

export function LottieLogo({ 
  width = 42, 
  height = 42, 
  className = "",
  playOnHover = true 
}: LottieLogoProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    // Load animation data
    fetch("/logoanimated.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);

  useEffect(() => {
    // Set initial frame to first frame (not playing)
    if (lottieRef.current && animationData) {
      lottieRef.current.setSpeed(1);
      lottieRef.current.goToAndStop(0, true);
      isCompletedRef.current = false;
    }
  }, [animationData]);

  const stopAtLastFrame = useCallback(() => {
    if (lottieRef.current && animationData && !isCompletedRef.current) {
      const totalFrames = animationData.op || 36;
      const lastFrame = totalFrames - 1;
      
      // Stop animation and set to last frame
      if (lottieRef.current) {
        lottieRef.current.goToAndStop(lastFrame, true);
        isCompletedRef.current = true;
      }
    }
  }, [animationData]);

  const handleEnterFrame = useCallback(() => {
    // Check if we've reached the last frame
    if (lottieRef.current && animationData && !isCompletedRef.current) {
      const totalFrames = animationData.op || 36;
      // Access currentFrame property (type assertion needed as types may be incomplete)
      const currentFrame = (lottieRef.current as any).currentFrame ?? 0;
      
      // If we've reached or passed the last frame, stop and stay on last frame
      if (currentFrame >= totalFrames - 1) {
        stopAtLastFrame();
      }
    }
  }, [animationData, stopAtLastFrame]);

  const handleComplete = useCallback(() => {
    // When animation completes, stop at last frame
    stopAtLastFrame();
  }, [stopAtLastFrame]);

  const handleLoopComplete = useCallback(() => {
    // Backup callback in case onComplete doesn't fire
    stopAtLastFrame();
  }, [stopAtLastFrame]);

  const handleMouseEnter = () => {
    if (playOnHover && lottieRef.current) {
      isCompletedRef.current = false;
      // Start playing from frame 0
      lottieRef.current.goToAndPlay(0, true);
    }
  };

  const handleMouseLeave = () => {
    if (playOnHover && lottieRef.current) {
      isCompletedRef.current = false;
      // Reset to first frame when mouse leaves
      lottieRef.current.stop();
      lottieRef.current.goToAndStop(0, true);
    }
  };


  if (!animationData) {
    return (
      <div
        className={className}
        style={{ width, height }}
      />
    );
  }

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width, height }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={true}
        onEnterFrame={handleEnterFrame}
        onComplete={handleComplete}
        onLoopComplete={handleLoopComplete}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

