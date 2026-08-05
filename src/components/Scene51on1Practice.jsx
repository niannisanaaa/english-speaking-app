import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { playSuccessChime } from '../utils/soundEffects';
import './Scene51on1Practice.css';

export default function Scene51on1Practice({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [micSupported, setMicSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const videoTalkRef = useRef(null);
  const videoIdleRef = useRef(null);

  const audioRef = useRef(null);
  const currentAudioUrlRef = useRef('');

  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSuccessRef = useRef(false);

  const steps = sceneData.steps;
  const totalSteps = steps.length;

  // Clamp stepIndex strictly within valid bounds [0, totalSteps - 1]
  const safeStepIdx = Math.min(Math.max(0, stepIndex), totalSteps - 1);
  const currentStep = steps[safeStepIdx];

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

    const isTalk = currentStep.type === 'milo_talking';

    // Direct, guaranteed Video Switch: Player 0 (Talk) vs Player 1 (Idle)
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

      // ONLY instantiate and play if this audio track isn't already playing!
      if (currentAudioUrlRef.current !== targetAudioUrl) {
        stopAudioTrack();
        currentAudioUrlRef.current = targetAudioUrl;

        const audio = new Audio(targetAudioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          console.log(`Audio for step ${safeStepIdx} (${currentStep.audio}) finished 100%.`);
          stopAudioTrack();

          if (safeStepIdx < totalSteps - 1) {
            setStepIndex(safeStepIdx + 1);
          } else {
            console.log("Scene 5 conversation completed!");
            setIsCompleted(true);
            if (onNextScene) onNextScene();
          }
        };

        audio.play().catch(err => console.warn("Milo audio play failed:", err));
      }
    } else {
      stopAudioTrack();
    }

    // Speech Recognition & 5s Limit for User Speaking Steps
    let timeoutTimer;
    if (currentStep.type === 'user_speaking') {
      startSpeechRecognition();
      timeoutTimer = setTimeout(() => {
        console.log("5s speaking widget limit reached. Advancing to Milo's response...");
        handleSpeechSuccess();
      }, 5000);
    } else {
      stopSpeechRecognition();
    }

    return () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [safeStepIdx, isCompleted]);

  // Global Cleanup on Component Unmount
  useEffect(() => {
    return () => {
      stopAudioTrack();
      stopSpeechRecognition();
    };
  }, []);

  const handleSpeechSuccess = () => {
    if (currentStep.type !== 'user_speaking') return;
    if (speechSuccessRef.current) return;
    speechSuccessRef.current = true;
    playSuccessChime();
    stopSpeechRecognition();

    if (safeStepIdx < totalSteps - 1) {
      setStepIndex(safeStepIdx + 1);
    } else if (onNextScene) {
      onNextScene();
    }
  };

  // Web Audio API & Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
      }).then((stream) => {
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
            if (voiceFrames >= 25 && !speechSuccessRef.current && currentStep.type === 'user_speaking') {
              handleSpeechSuccess();
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
        const rawTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ')
          .toLowerCase();

        setSpokenText(rawTranscript);
        if (rawTranscript.trim().length >= 2) {
          handleSpeechSuccess();
        }
      };

      recognition.onerror = (err) => {
        console.warn('Scene 5 speech recognition error:', err);
      };

      recognition.onend = () => {
        if (currentStep.type === 'user_speaking' && !speechSuccessRef.current) {
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

      {/* Main Video Canvas Area */}
      <div className="video-aspect-container glass-panel">
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
                onClick={handleSpeechSuccess}
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
