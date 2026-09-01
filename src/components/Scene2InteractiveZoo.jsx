import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Mic, MicOff, Sparkles, CheckCircle2, Volume2, RotateCcw } from 'lucide-react';
import { playSuccessChime, playTapChime } from '../utils/soundEffects';
import './Scene2InteractiveZoo.css';

export default function Scene2InteractiveZoo({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [currentAnimalId, setCurrentAnimalId] = useState('lion');
  const [visitedAnimals, setVisitedAnimals] = useState([]);
  const [mode, setMode] = useState('guided_flow'); // 'guided_flow' | 'choice_prompt' | 'free_choice'
  const [stepIndex, setStepIndex] = useState(0);
  const [showCoachmark, setShowCoachmark] = useState(false);
  
  // Speech Recognition States & Refs
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speechSuccess, setSpeechSuccess] = useState(false);
  const speechSuccessRef = useRef(false);
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef(null);
  const speakingTimerRef = useRef(null);

  const activeAnimal = sceneData.animals[currentAnimalId] || sceneData.animals.lion;
  const currentStep = activeAnimal.steps[stepIndex] || activeAnimal.steps[0];

  // Resolve media Blob URL or raw path
  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  // Dynamic Video Source Resolution
  const getVideoSrc = () => {
    let rawPath = `/Videos/${currentStep.name}`;
    if (mode === 'choice_prompt') {
      rawPath = '/Videos/scene_02_choice_next_animal.mp4';
    } else if (mode === 'free_choice') {
      rawPath = '/Videos/scene_02_lion_03_hotspot_loop.mp4';
    }
    return resolveMediaUrl(rawPath);
  };

  const videoSrc = getVideoSrc();

  const videoRef0 = useRef(null);
  const videoRef1 = useRef(null);
  const [activePlayer, setActivePlayer] = useState(0);
  const [src0, setSrc0] = useState(videoSrc);
  const [src1, setSrc1] = useState('');

  // Bulletproof video playback with unmuted-to-muted fallback strategy
  const safePlayVideo = (videoEl, isMutedGoal) => {
    if (!videoEl) return;
    videoEl.playbackRate = 0.8;
    videoEl.muted = isMutedGoal;
    videoEl.play().catch(err => {
      console.warn("Scene 2 unmuted autoplay restricted, fallback to muted:", err);
      videoEl.muted = true;
      videoEl.play().then(() => {
        setTimeout(() => {
          if (videoEl && !isMutedGoal) {
            videoEl.muted = false;
          }
        }, 200);
      }).catch(e => console.warn("Scene 2 muted play failed:", e));
    });
  };

  // Reset states when step, animal, or mode changes
  useEffect(() => {
    setShowCoachmark(false);
    setSpokenText('');
    setSpeechSuccess(false);
    speechSuccessRef.current = false;

    // Step 3 or Free Choice Hotspot Timer (5 Seconds)
    let coachmarkTimer;
    if (mode === 'free_choice' || (mode === 'guided_flow' && currentStep.isHotspotStep)) {
      coachmarkTimer = setTimeout(() => {
        setShowCoachmark(true);
      }, 5000);
    }

    // Speech Recognition Trigger (Activates during speech steps!)
    if (mode === 'guided_flow' && currentStep.isSpeechStep && currentStep.id !== 'speech_success') {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }

    return () => {
      if (coachmarkTimer) clearTimeout(coachmarkTimer);
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      stopSpeechRecognition();
    };
  }, [stepIndex, currentAnimalId, mode]);

  // Helpers for loop and mute state logic
  const isCurrentVideoLoop = (step, currentMode) => {
    if (currentMode === 'free_choice') return true;
    if (!step) return false;
    return !!(step.isLoop || step.id === 'speak_loop' || step.isHotspotStep);
  };

  const isCurrentVideoMuted = (step, currentMode) => {
    if (currentMode === 'choice_prompt') return false; // Teacher choice prompt video -> UNMUTED AUDIO!
    if (currentMode === 'free_choice') return true; // Zoo overview loop -> MUTED!
    if (!step) return false;
    // ONLY looping steps are MUTED
    return !!(step.isLoop || step.id === 'speak_loop' || step.isHotspotStep);
  };

  // Pre-buffer next video and switch seamlessly
  useEffect(() => {
    const isMuted = isCurrentVideoMuted(currentStep, mode);

    if (activePlayer === 0) {
      if (src0 === videoSrc) {
        if (videoRef0.current) {
          videoRef0.current.currentTime = 0;
          safePlayVideo(videoRef0.current, isMuted);
        }
      } else {
        setSrc1(videoSrc);
      }
    } else {
      if (src1 === videoSrc) {
        if (videoRef1.current) {
          videoRef1.current.currentTime = 0;
          safePlayVideo(videoRef1.current, isMuted);
        }
      } else {
        setSrc0(videoSrc);
      }
    }
  }, [videoSrc, stepIndex, mode]);

  // Ensure DOM video elements play immediately after React updates src
  useEffect(() => {
    const isMuted = isCurrentVideoMuted(currentStep, mode);
    if (videoRef0.current && src0) {
      videoRef0.current.currentTime = 0;
      safePlayVideo(videoRef0.current, isMuted);
    }
  }, [src0]);

  useEffect(() => {
    const isMuted = isCurrentVideoMuted(currentStep, mode);
    if (videoRef1.current && src1) {
      videoRef1.current.currentTime = 0;
      safePlayVideo(videoRef1.current, isMuted);
    }
  }, [src1]);

  const handleVideoPlaying = (playerIndex) => {
    if (playerIndex !== activePlayer) {
      setActivePlayer(playerIndex);
      const inactiveRef = playerIndex === 0 ? videoRef1 : videoRef0;
      if (inactiveRef.current) inactiveRef.current.pause();
    }
  };

  const [audioVolume, setAudioVolume] = useState(0);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);

  // Web Speech API & Real-time Audio Analyzer Initialization
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Start Web Audio API Analyzer for real-time reactive pulse & Voice Activity Detection (VAD)
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
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

          // Voice Activity Detection (VAD): Only trigger fallback if child speaks loudly into mic (> 35) for ~45 frames (~1 sec)
          if (avg > 35) {
            voiceFrames++;
            if (voiceFrames >= 45 && !speechSuccessRef.current) {
              console.log("Sustained loud voice input detected (>35 volume). Triggering speech success...");
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

        const cleanText = rawTranscript.replace(/[^a-z0-9\s]/g, '').trim();
        const words = cleanText.split(/\s+/);

        const targetWord = (currentStep.targetWord || activeAnimal.targetWord || activeAnimal.id || '').toLowerCase();
        const isGiraffeMode = currentAnimalId === 'giraffe' || targetWord === 'giraffe';
        const isElephantMode = currentAnimalId === 'elephant' || targetWord === 'elephant';
        const isPandaMode = currentAnimalId === 'panda' || targetWord === 'panda';
        const isFishMode = currentAnimalId === 'fish' || targetWord === 'fish';

        let isMatch = false;

        if (isFishMode) {
          isMatch = 
            cleanText.includes('fish') ||
            cleanText.includes('fis') ||
            cleanText.includes('pish') ||
            cleanText.includes('vish') ||
            cleanText.includes('ikan') ||
            cleanText.includes('ish') ||
            words.some(w => (w.startsWith('fi') || w.startsWith('fe') || w.startsWith('pi')) && w.length >= 2);
        } else if (isPandaMode) {
          isMatch = 
            cleanText.includes('panda') ||
            cleanText.includes('penda') ||
            cleanText.includes('panta') ||
            cleanText.includes('pander') ||
            words.some(w => (w.startsWith('pan') || w.startsWith('pen') || w.startsWith('pa')) && w.length >= 2);
        } else if (isElephantMode) {
          isMatch = 
            cleanText.includes('elephant') ||
            cleanText.includes('elefant') ||
            cleanText.includes('elafant') ||
            cleanText.includes('elepant') ||
            cleanText.includes('gajah') ||
            cleanText.includes('fant') ||
            words.some(w => (w.startsWith('el') || w.startsWith('al') || w.startsWith('il')) && w.length >= 2);
        } else if (isGiraffeMode) {
          isMatch = 
            cleanText.includes('elephant') ||
            cleanText.includes('elefant') ||
            cleanText.includes('elafant') ||
            cleanText.includes('elepant') ||
            cleanText.includes('gajah') ||
            cleanText.includes('fant') ||
            words.some(w => (w.startsWith('el') || w.startsWith('al') || w.startsWith('il')) && w.length >= 2);
        } else if (isGiraffeMode) {
          isMatch = 
            cleanText.includes('giraffe') ||
            cleanText.includes('giraf') ||
            cleanText.includes('geraf') ||
            cleanText.includes('jiraf') ||
            cleanText.includes('jerapah') ||
            cleanText.includes('zeraf') ||
            cleanText.includes('juraf') ||
            cleanText.includes('graf') ||
            cleanText.includes('draft') ||
            cleanText.includes('draf') ||
            cleanText.includes('craft') ||
            cleanText.includes('graph') ||
            cleanText.includes('half') ||
            cleanText.includes('raf') ||
            cleanText.includes('jerap') ||
            cleanText.includes('jrap') ||
            words.some(w => 
              (w.startsWith('g') && w.length >= 2) || 
              (w.startsWith('j') && w.length >= 2) || 
              (w.startsWith('r') && w.length >= 2) || 
              w.startsWith('gi') || 
              w.startsWith('ji') || 
              w.startsWith('je') || 
              w.startsWith('ge') ||
              w.startsWith('gr') ||
              w.startsWith('dr') ||
              w.startsWith('ch') ||
              w.includes('raf') ||
              w.includes('ffe') ||
              w.includes('rapah') ||
              w.includes('ir')
            );
        } else {
          isMatch = 
            cleanText.includes('lion') ||
            cleanText.includes('lyon') ||
            cleanText.includes('laion') ||
            cleanText.includes('line') ||
            cleanText.includes('ryan') ||
            cleanText.includes('iron') ||
            cleanText.includes('lying') ||
            cleanText.includes('liom') ||
            cleanText.includes('lian') ||
            words.some(w => (w.startsWith('li') || w.startsWith('ly') || w.startsWith('la')) && w.length >= 2);
        }

        // Only transition to success state when target word pronunciation match is confirmed!
        if (isMatch) {
          handleSpeechSuccess();
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
      };

      recognition.onend = () => {
        if (mode === 'guided_flow' && currentStep.isSpeechStep && !speechSuccessRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
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

  const handleSpeechSuccess = () => {
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    speechSuccessRef.current = true;
    playSuccessChime();
    setSpeechSuccess(true);
    stopSpeechRecognition();

    // Instant transition to Speech Success Video (Last step of current animal)
    const successStepIdx = activeAnimal.steps.findIndex(s => s.id === 'speech_success');
    if (successStepIdx !== -1) {
      const targetStep = activeAnimal.steps[successStepIdx];
      const targetSrc = resolveMediaUrl(`/Videos/${targetStep.name}`);
      
      const nextPlayer = 1 - activePlayer;
      if (nextPlayer === 0) {
        setSrc0(targetSrc);
        if (videoRef0.current) {
          videoRef0.current.currentTime = 0;
          safePlayVideo(videoRef0.current, false);
        }
      } else {
        setSrc1(targetSrc);
        if (videoRef1.current) {
          videoRef1.current.currentTime = 0;
          safePlayVideo(videoRef1.current, false);
        }
      }
      setActivePlayer(nextPlayer);
      setStepIndex(successStepIdx);
    }
  };

  const handleVideoEnd = () => {
    // 1. Teacher Choice Prompt Video Ended -> Switch to Free Choice Overview Loop
    if (mode === 'choice_prompt') {
      setMode('free_choice');
      return;
    }

    // 2. Free Choice Overview Video Loop -> Keep Looping
    if (mode === 'free_choice') {
      const activeVideo = activePlayer === 0 ? videoRef0.current : videoRef1.current;
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.muted = true;
        activeVideo.play().catch(() => {});
      }
      return;
    }

    // 3. Guided Flow Step Video Loop -> Keep Looping
    if (mode === 'guided_flow' && currentStep.isLoop) {
      const activeVideo = activePlayer === 0 ? videoRef0.current : videoRef1.current;
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.muted = true;
        activeVideo.play().catch(() => {});
      }
      return;
    }

    // 4. Guided Flow Speech Prompt Ended -> Handle speak_loop vs non-looping animals (e.g. Elephant & Panda)
    if (mode === 'guided_flow' && currentStep.id === 'speak_prompt') {
      const activeVideo = activePlayer === 0 ? videoRef0.current : videoRef1.current;
      if (activeVideo) activeVideo.pause();

      const hasSpeakLoop = activeAnimal.steps.some(s => s.id === 'speak_loop');
      if (hasSpeakLoop) {
        setStepIndex(prev => prev + 1);
      } else {
        console.log(`Speech prompt ended for ${currentAnimalId}. Pausing video and activating 3D mic widget for 10s...`);
        startSpeechRecognition();

        // 10 Seconds Maximum Timeout for speaking widget on paused prompt
        if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = setTimeout(() => {
          console.log("10s limit reached on paused speak prompt. Advancing to success state...");
          handleSpeechSuccess();
        }, 10000);
      }
      return;
    }

    // 4. Guided Flow Normal Video Ended -> Advance to Next Step or Complete Animal
    if (stepIndex < activeAnimal.steps.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      // Animal Sub-flow Completed!
      const newVisited = Array.from(new Set([...visitedAnimals, currentAnimalId]));
      setVisitedAnimals(newVisited);

      const allAvailableAnimals = Object.keys(sceneData.animals);
      const isAllDone = allAvailableAnimals.every(anKey => newVisited.includes(anKey));

      if (isAllDone) {
        // All available animals discovered -> Auto-advance to Scene 3!
        if (onNextScene) onNextScene();
      } else {
        // Return to Teacher Choice Prompt ("Which animal next?")
        setMode('choice_prompt');
      }
    }
  };

  const handleHotspotClick = (animalId) => {
    playTapChime();
    playSuccessChime();

    if (mode === 'free_choice') {
      setCurrentAnimalId(animalId);
      setStepIndex(0);
      setMode('guided_flow');
    } else if (mode === 'guided_flow' && currentStep.isHotspotStep) {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleRestartFlow = () => {
    setStepIndex(0);
    setMode('guided_flow');
  };

  const unvisitedAnimalKeys = Object.keys(sceneData.animals).filter(key => !visitedAnimals.includes(key));
  const recommendedAnimalKey = unvisitedAnimalKeys[0] || 'giraffe';

  return (
    <div className="scene2-wrapper">
      {/* Top Header Navigation */}
      <header className="scene2-header glass-panel">
        <div className="header-info">
          <div className="badge-pill">
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Scene 2: Find & Learn Animals</span>
          </div>
          <h1 className="scene-title">
            {mode === 'choice_prompt' && '❓ Milo & Teacher: Which animal next?'}
            {mode === 'free_choice' && '🌿 Zoo Overview: Tap any animal!'}
            {mode === 'guided_flow' && `${activeAnimal.displayName === 'Lion' ? '🦁' : '🦒'} Mission: ${activeAnimal.displayName} Discovery`}
          </h1>
        </div>

        <div className="top-nav-controls">
          <button className="nav-arrow-btn" onClick={onPrevScene} disabled={!hasPrevScene} title="Previous Scene">
            <ChevronLeft size={22} />
          </button>
          
          <div className="step-indicator">
            {mode === 'guided_flow' 
              ? `Step ${stepIndex + 1} of ${activeAnimal.steps.length}`
              : `Discovered: ${visitedAnimals.length} of ${Object.keys(sceneData.animals).length}`}
          </div>

          <button className="nav-arrow-btn highlight-arrow" onClick={onNextScene} disabled={!hasNextScene} title="Next Scene">
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      {/* Main Video Canvas Area */}
      <div className="video-aspect-container glass-panel">
        <video
          ref={videoRef0}
          src={src0}
          className={`main-video-player ${activePlayer === 0 ? 'video-active' : 'video-hidden'}`}
          onEnded={handleVideoEnd}
          onPlaying={() => handleVideoPlaying(0)}
          loop={isCurrentVideoLoop(currentStep, mode)}
          muted={isCurrentVideoMuted(currentStep, mode)}
          preload="auto"
          playsInline
        />
        <video
          ref={videoRef1}
          src={src1}
          className={`main-video-player ${activePlayer === 1 ? 'video-active' : 'video-hidden'}`}
          onEnded={handleVideoEnd}
          onPlaying={() => handleVideoPlaying(1)}
          loop={isCurrentVideoLoop(currentStep, mode)}
          muted={isCurrentVideoMuted(currentStep, mode)}
          preload="auto"
          playsInline
        />

        {/* FREE CHOICE OVERVIEW HOTSPOTS OVERLAY */}
        {mode === 'free_choice' && (
          <>
            {Object.keys(sceneData.animals).map(animalKey => {
              const animal = sceneData.animals[animalKey];
              const isVisited = visitedAnimals.includes(animalKey);
              const isRecommended = showCoachmark && animalKey === recommendedAnimalKey;

              // Do NOT render any rings or badges for already visited animals!
              if (isVisited) return null;

              return (
                <div
                  key={animalKey}
                  className={`animal-hotspot-zone ${isRecommended ? 'coachmark-active' : ''}`}
                  style={{
                    top: animal.hotspot.top,
                    left: animal.hotspot.left,
                    width: animal.hotspot.width,
                    height: animal.hotspot.height
                  }}
                  onClick={() => handleHotspotClick(animalKey)}
                  title={`Tap to discover ${animal.displayName}!`}
                >
                  {/* Yellow Coachmark Ring ONLY renders when recommended after 5s idle */}
                  {isRecommended && (
                    <div className="pulsating-ring-container">
                      <svg className="pulsating-ring-svg" viewBox="0 0 100 100">
                        <circle className="ring-pulse-outer" cx="50" cy="50" r="42" />
                        <circle className="ring-pulse-inner" cx="50" cy="50" r="42" />
                      </svg>
                      <div className="coachmark-label-badge">
                        <span>Tap {animal.displayName}! {animalKey === 'giraffe' ? '🦒' : '🦁'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* GUIDED FLOW STEP 3 HOTSPOT OVERLAY */}
        {mode === 'guided_flow' && currentStep.isHotspotStep && (
          <div 
            className={`lion-hotspot-zone ${showCoachmark ? 'coachmark-active' : ''}`}
            style={{
              top: activeAnimal.hotspot.top,
              left: activeAnimal.hotspot.left,
              width: activeAnimal.hotspot.width,
              height: activeAnimal.hotspot.height
            }}
            onClick={() => handleHotspotClick(currentAnimalId)}
            title={`Tap on ${activeAnimal.displayName}!`}
          >
            {/* Pulsating Yellow Ring SVG Overlay */}
            <div className="pulsating-ring-container">
              <svg className="pulsating-ring-svg" viewBox="0 0 100 100">
                <circle className="ring-pulse-outer" cx="50" cy="50" r="42" />
                <circle className="ring-pulse-inner" cx="50" cy="50" r="42" />
              </svg>
              {showCoachmark && (
                <div className="coachmark-label-badge">
                  <span>Tap {activeAnimal.displayName}! {currentAnimalId === 'giraffe' ? '🦒' : '🦁'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: DYNAMIC VOLUME-REACTIVE 3D MICROPHONE OVERLAY */}
        {mode === 'guided_flow' && currentStep.isSpeechStep && currentStep.id !== 'speech_success' && (
          <div className="mic-3d-speech-overlay">
            <div className="mic-3d-widget">
              {/* Sonic Water-Ripples (ONLY RUN WHEN VOICE IS DETECTED) */}
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

              {/* Sporadic Stars Encircling the Microphone (ONLY APPEAR WHEN VOICE IS DETECTED) */}
              {audioVolume > 8 && (
                <div className="starburst-burst-container">
                  <Sparkles className="starburst-star star-1" size={20} color="#fbbf24" />
                  <Sparkles className="starburst-star star-2" size={24} color="#38bdf8" />

                  {audioVolume > 18 && (
                    <>
                      <Sparkles className="starburst-star star-3" size={22} color="#f472b6" />
                      <Sparkles className="starburst-star star-4" size={26} color="#fbbf24" />
                    </>
                  )}

                  {audioVolume > 28 && (
                    <>
                      <Sparkles className="starburst-star star-5" size={28} color="#a855f7" />
                      <Sparkles className="starburst-star star-6" size={24} color="#34d399" />
                      <Sparkles className="starburst-star star-7" size={30} color="#fbbf24" />
                      <Sparkles className="starburst-star star-8" size={22} color="#38bdf8" />
                    </>
                  )}
                </div>
              )}

              {/* Live Spoken Transcript Feedback */}
              {spokenText && (
                <div className="mic-live-spoken-tag glass-panel">
                  Hearing: "{spokenText}"
                </div>
              )}

              {/* Clean 3D Purple Microphone Asset */}
              <div 
                className="mic-3d-img-wrapper" 
                onClick={handleSpeechSuccess}
                title={`Tap mic to test match (${activeAnimal.targetWord})`}
              >
                <img src="/images/mic_3d.png" alt="Microphone" className="mic-3d-img" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Status Control Overlay */}
        <div className="video-overlay-layer">
          <div className="step-progress-row">
            {activeAnimal.steps.map((st, idx) => (
              <div 
                key={st.id} 
                className={`step-dot ${idx === stepIndex ? 'current' : idx < stepIndex ? 'done' : ''}`}
                onClick={() => { setMode('guided_flow'); setStepIndex(idx); }}
                title={st.title}
              />
            ))}
          </div>

          <div className="overlay-bottom-bar">
            <div className="video-title-tag">
              <span className="part-number">{mode === 'guided_flow' ? currentStep.title : 'Free Zoo Exploration'}</span>
            </div>

            <div className="player-buttons">
              <button className="control-btn" onClick={handleRestartFlow} title="Restart Scene">
                <RotateCcw size={20} />
              </button>

              {mode === 'guided_flow' && stepIndex < activeAnimal.steps.length - 1 ? (
                <button className="action-pill-btn" onClick={() => setStepIndex(prev => prev + 1)}>
                  Skip Step <ChevronRight size={18} />
                </button>
              ) : (
                <button className="action-pill-btn finish-scene-btn" onClick={onNextScene}>
                  Next Scene <Sparkles size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
