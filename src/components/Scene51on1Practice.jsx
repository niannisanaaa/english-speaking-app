import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Volume2 } from 'lucide-react';
import { playSuccessChime } from '../utils/soundEffects';
import './Scene51on1Practice.css';

export default function Scene51on1Practice({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [micSupported, setMicSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  const videoTalkRef = useRef(null);
  const videoIdleRef = useRef(null);

  const audioRef = useRef(null);
  const currentAudioUrlRef = useRef('');

  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSuccessRef = useRef(false);
  const stepIndexRef = useRef(0);

  const steps = sceneData.steps;
  const totalSteps = steps.length;

  // Clamp stepIndex strictly within valid bounds [0, totalSteps - 1]
  const safeStepIdx = Math.min(Math.max(0, stepIndex), totalSteps - 1);
  const currentStep = steps[safeStepIdx];

  // Keep stepIndexRef in sync with safeStepIdx at all times
  useEffect(() => {
    stepIndexRef.current = safeStepIdx;
  }, [safeStepIdx]);

  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  const talkVideoSrc = resolveMediaUrl(`/Videos/${sceneData.talkVideo}`);
  const idleVideoSrc = resolveMediaUrl(`/Videos/${sceneData.idleVideo}`);

  // Stop & destroy current audio safely
  const stopAudioTrack = () => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    currentAudioUrlRef.current = '';
  };

  // Mobile User Gesture Audio Unlocker
  const handleUserGestureUnlock = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsAudioBlocked(false);
      }).catch(err => {
        console.warn("Manual user gesture audio play failed:", err);
      });
    } else {
      setIsAudioBlocked(false);
    }
  };

  // Safe Video Player Trigger
  const safePlayVideo = (videoEl) => {
    if (!videoEl) return;
    videoEl.muted = true;
    videoEl.play().catch(err => console.warn("Scene 5 video play failed:", err));
  };

  // Synchronize Video & Audio Playback for current step
  useEffect(() => {
    speechSuccessRef.current = false;
    setSpokenText('');

    if (isCompleted) return;

    const currentStepIdx = safeStepIdx;
    const isTalk = currentStep.type === 'milo_talking';

    // Guaranteed Video Switch: Player 0 (Talk) vs Player 1 (Idle)
    if (isTalk) {
      if (videoIdleRef.current) videoIdleRef.current.pause();
      if (videoTalkRef.current) {
        if (videoTalkRef.current.readyState >= 1) videoTalkRef.current.currentTime = 0;
        safePlayVideo(videoTalkRef.current);
      }
    } else {
      if (videoTalkRef.current) videoTalkRef.current.pause();
      if (videoIdleRef.current) {
        if (videoIdleRef.current.readyState >= 1) videoIdleRef.current.currentTime = 0;
        safePlayVideo(videoIdleRef.current);
      }
    }

    // Audio Playback for Milo Talking Steps
    if (isTalk && currentStep.audio) {
      const targetAudioUrl = resolveMediaUrl(`/Audio/${currentStep.audio}`);

      if (currentAudioUrlRef.current !== targetAudioUrl) {
        stopAudioTrack();
        currentAudioUrlRef.current = targetAudioUrl;

        const audio = new Audio(targetAudioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          console.log(`Audio for step ${currentStepIdx} (${currentStep.audio}) finished 100%.`);
          stopAudioTrack();

          // Guard against stale stepIndex callbacks!
          if (stepIndexRef.current === currentStepIdx) {
            setStepIndex(prev => {
              if (prev < totalSteps - 1) {
                return prev + 1;
              } else {
                console.log("Scene 5 conversation completed!");
                setIsCompleted(true);
                if (onNextScene) onNextScene();
                return prev;
              }
            });
          }
        };

        audio.play().then(() => {
          setIsAudioBlocked(false);
        }).catch(err => {
          console.warn("Milo audio blocked by mobile browser autoplay policy:", err);
          setIsAudioBlocked(true);
        });
      }
    } else {
      stopAudioTrack();
    }

    // Speech Recognition & 5s Limit for User Speaking Steps
    let timeoutTimer;
    if (currentStep.type === 'user_speaking') {
      startSpeechRecognition(currentStepIdx);
      timeoutTimer = setTimeout(() => {
        if (stepIndexRef.current === currentStepIdx && !speechSuccessRef.current) {
          console.log("5s speaking widget limit reached. Advancing to Milo's response...");
          handleSpeechSuccess(currentStepIdx);
        }
      }, 5000);
    } else {
      stopSpeechRecognition();
    }

    return () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      stopAudioTrack();
      stopSpeechRecognition();
    };
  }, [safeStepIdx, isCompleted]);

  // Global Cleanup on Component Unmount
  useEffect(() => {
    return () => {
      stopAudioTrack();
      stopSpeechRecognition();
    };
  }, []);

  const handleSpeechSuccess = (stepIdxTarget) => {
    if (speechSuccessRef.current) return;
    if (typeof stepIdxTarget === 'number' && stepIndexRef.current !== stepIdxTarget) return;

    speechSuccessRef.current = true;
    playSuccessChime();
    stopSpeechRecognition();

    setStepIndex(prev => {
      if (prev < totalSteps - 1) {
        return prev + 1;
      } else {
        setIsCompleted(true);
        if (onNextScene) onNextScene();
        return prev;
      }
    });
  };

  // Web Audio API & Speech Recognition
  const startSpeechRecognition = (stepIdxTarget) => {
    stopSpeechRecognition();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
      }).then((stream) => {
        if (stepIndexRef.current !== stepIdxTarget) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        micStreamRef.current = stream;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let voiceFrames = 0;

        const analyze = () => {
          if (stepIndexRef.current !== stepIdxTarget || speechSuccessRef.current) return;

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioVolume(avg);

          // Voice Activity Detection (VAD)
          if (avg > 30) {
            voiceFrames++;
            if (voiceFrames >= 25 && !speechSuccessRef.current && stepIndexRef.current === stepIdxTarget) {
              handleSpeechSuccess(stepIdxTarget);
              return;
            }
          } else {
            voiceFrames = Math.max(0, voiceFrames - 1);
          }

          animFrameRef.current = requestAnimationFrame(analyze);
        };
        analyze();
      }).catch(() => {});
    }

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    setMicSupported(true);
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        if (stepIndexRef.current !== stepIdxTarget || speechSuccessRef.current) return;

        const rawTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ')
          .toLowerCase();

        setSpokenText(rawTranscript);
        if (rawTranscript.trim().length >= 2) {
          handleSpeechSuccess(stepIdxTarget);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Scene 5 speech recognition error:', err);
      };

      recognition.onend = () => {
        if (stepIndexRef.current === stepIdxTarget && !speechSuccessRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.warn('Scene 5 speech recognition start failed:', e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setIsListening(false);
    setAudioVolume(0);
  };

  const isTalk = currentStep.type === 'milo_talking';

  return (
    <div className="scene5-wrapper">
      {/* Top Glassmorphic Navigation Header */}
      <header className="scene5-header glass-panel">
        <div className="header-info">
          <div className="badge-pill">
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Scene 5: 1-on-1 Practice</span>
          </div>
        </div>

        <div className="top-nav-controls">
          <button className="nav-arrow-btn" onClick={onPrevScene} disabled={!hasPrevScene} title="Previous Scene">
            <ChevronLeft size={22} />
          </button>
          
          <div className="step-indicator">
            Step {safeStepIdx + 1} of {totalSteps}
          </div>

          <button className="nav-arrow-btn highlight-arrow" onClick={onNextScene} disabled={!hasNextScene} title="Next Scene">
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      {/* Main Video Canvas Area (Listens for Touch/Click to Unlock Mobile Audio) */}
      <div 
        className="video-aspect-container glass-panel"
        onClick={handleUserGestureUnlock}
        onTouchStart={handleUserGestureUnlock}
      >
        {/* Permanent Video Player 0: Milo Talk Video */}
        <video
          ref={videoTalkRef}
          src={talkVideoSrc}
          className={`main-video-player ${isTalk ? 'video-active' : 'video-hidden'}`}
          loop
          muted
          preload="auto"
          playsInline
        />

        {/* Permanent Video Player 1: Milo Idle Video */}
        <video
          ref={videoIdleRef}
          src={idleVideoSrc}
          className={`main-video-player ${!isTalk ? 'video-active' : 'video-hidden'}`}
          loop
          muted
          preload="auto"
          playsInline
        />

        {/* Mobile Browser Audio Unmute Floating Badge */}
        {isAudioBlocked && isTalk && (
          <div className="mobile-audio-unmute-badge glass-panel">
            <Volume2 size={20} className="unmute-icon" />
            <span>Tap screen to play Milo's voice 🔊</span>
          </div>
        )}

        {/* 3D MICROPHONE SPEAKING WIDGET OVERLAY (Only Appears during User Turn!) */}
        {currentStep.type === 'user_speaking' && (
          <div className="mic-3d-speech-overlay">
            <div className="mic-3d-widget">
              {/* Sonic Ripples on Voice Detection */}
              {audioVolume > 8 && (
                <div 
                  className="sonic-ripple-container active-voice"
                  style={{
                    transform: `translate(-50%, -50%) scale(${1 + Math.min(Math.max(audioVolume - 8, 0) / 25, 0.85)})`,
                    opacity: Math.min(0.6 + audioVolume / 50, 0.95)
                  }}
                >
                  <div className="ripple-wave wave-1"></div>
                  <div className="ripple-wave wave-2"></div>
                  <div className="ripple-wave wave-3"></div>
                </div>
              )}

              {/* Live Transcript Tag */}
              {spokenText && (
                <div className="mic-live-spoken-tag glass-panel">
                  Hearing: "{spokenText}"
                </div>
              )}

              {/* Interactive 3D Mic Image (Tap to trigger match) */}
              <div 
                className="mic-3d-img-wrapper"
                onClick={() => handleSpeechSuccess(safeStepIdx)}
                title="Tap mic to finish turn"
              >
                <img src="/images/mic_3d.png" alt="Microphone" className="mic-3d-img" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
