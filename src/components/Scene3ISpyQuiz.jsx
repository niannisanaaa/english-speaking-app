import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, RotateCcw, Award } from 'lucide-react';
import { playSuccessChime, playTapChime } from '../utils/soundEffects';
import './Scene3ISpyQuiz.css';

export default function Scene3ISpyQuiz({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [quizState, setQuizState] = useState('intro'); // 'intro' | 'prompt' | 'milo_tap' | 'waiting_loop' | 'feedback_correct' | 'feedback_wrong' | 'outro'
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [shakeCardId, setShakeCardId] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [cardsFloating, setCardsFloating] = useState(false);

  const [activePlayer, setActivePlayer] = useState(0); // 0 = Player A, 1 = Player B
  const videoRef0 = useRef(null);
  const videoRef1 = useRef(null);

  const quizQuestions = [
    {
      id: 'panda',
      targetAnimal: 'panda',
      displayName: 'Panda',
      promptVideo: 'scene_03_ispy_02_prompt_panda.mp4',
      hintText: 'Find the PANDA eating bamboo! 🐼'
    },
    {
      id: 'lion',
      targetAnimal: 'lion',
      displayName: 'Lion',
      promptVideo: 'scene_03_ispy_03_prompt_lion.mp4',
      hintText: 'Find the loud LION with a big mane! 🦁'
    },
    {
      id: 'elephant',
      targetAnimal: 'elephant',
      displayName: 'Elephant',
      promptVideo: 'scene_03_ispy_03_prompt_lion.mp4', // Fallback until elephant video is uploaded
      hintText: 'Find the big ELEPHANT with a long trunk! 🐘'
    }
  ];

  const currentQuestion = quizQuestions[questionIdx] || quizQuestions[0];

  // Card Options (Matches reference layout screenshot: Lion, Elephant, Panda)
  const quizCards = [
    { id: 'lion', name: 'Lion', image: '/images/Lion.png', emoji: '🦁' },
    { id: 'elephant', name: 'Elephant', image: '/images/Elephant.png', emoji: '🐘' },
    { id: 'panda', name: 'Panda', image: '/images/Panda.png', emoji: '🐼' }
  ];

  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  // Resolve active video source
  const getVideoSrc = () => {
    let rawPath = '/Videos/scene_03_ispy_loop_waiting_click.mp4';
    switch (quizState) {
      case 'intro':
        rawPath = '/Videos/scene_03_ispy_01_intro_dialogue.mp4';
        break;
      case 'prompt':
        rawPath = `/Videos/${currentQuestion.promptVideo}`;
        break;
      case 'milo_tap':
        rawPath = '/Videos/scene_03_ispy_milo_tap_prompt.mp4';
        break;
      case 'waiting_loop':
        rawPath = '/Videos/scene_03_ispy_loop_waiting_click.mp4';
        break;
      case 'feedback_correct':
        rawPath = '/Videos/scene_03_ispy_feedback_correct.mp4';
        break;
      case 'feedback_wrong':
        rawPath = '/Videos/scene_03_ispy_feedback_wrong.mp4';
        break;
      case 'outro':
        rawPath = '/Videos/scene_03_ispy_feedback_correct.mp4';
        break;
      default:
        rawPath = '/Videos/scene_03_ispy_loop_waiting_click.mp4';
        break;
    }
    return resolveMediaUrl(rawPath);
  };

  const videoSrc = getVideoSrc();
  const [src0, setSrc0] = useState(() => getVideoSrc());
  const [src1, setSrc1] = useState('');

  // Bulletproof video player trigger with browser gesture fallback strategy
  const safePlayVideo = (videoEl, isMutedGoal) => {
    if (!videoEl) return;
    videoEl.playbackRate = 0.8;
    videoEl.muted = isMutedGoal;
    videoEl.play().catch(err => {
      console.warn("Scene 3 unmuted autoplay restricted, fallback to muted autoplay:", err);
      videoEl.muted = true;
      videoEl.play().then(() => {
        setTimeout(() => {
          if (videoEl && !isMutedGoal) {
            videoEl.muted = false;
          }
        }, 200);
      }).catch(e => console.warn("Scene 3 muted play failed:", e));
    });
  };

  // Dual Video Switcher - Pre-buffers & switches with 0ms gap
  useEffect(() => {
    const isMutedGoal = (quizState === 'waiting_loop');
    if (activePlayer === 0) {
      if (src0 === videoSrc) {
        if (videoRef0.current) {
          if (videoRef0.current.readyState >= 1) {
            videoRef0.current.currentTime = 0;
          }
          safePlayVideo(videoRef0.current, isMutedGoal);
        }
      } else {
        setSrc1(videoSrc);
      }
    } else {
      if (src1 === videoSrc) {
        if (videoRef1.current) {
          if (videoRef1.current.readyState >= 1) {
            videoRef1.current.currentTime = 0;
          }
          safePlayVideo(videoRef1.current, isMutedGoal);
        }
      } else {
        setSrc0(videoSrc);
      }
    }
  }, [videoSrc]);

  // Ensure DOM video elements play immediately after React updates src
  useEffect(() => {
    const isMutedGoal = (quizState === 'waiting_loop');
    if (videoRef0.current && src0) {
      if (videoRef0.current.readyState >= 1) {
        videoRef0.current.currentTime = 0;
      }
      safePlayVideo(videoRef0.current, isMutedGoal);
    }
  }, [src0]);

  useEffect(() => {
    const isMutedGoal = (quizState === 'waiting_loop');
    if (videoRef1.current && src1) {
      if (videoRef1.current.readyState >= 1) {
        videoRef1.current.currentTime = 0;
      }
      safePlayVideo(videoRef1.current, isMutedGoal);
    }
  }, [src1]);

  useEffect(() => {
    const isMutedGoal = (quizState === 'waiting_loop');
    const activeEl = activePlayer === 0 ? videoRef0.current : videoRef1.current;
    if (activeEl && activeEl.paused) {
      safePlayVideo(activeEl, isMutedGoal);
    }
  }, [activePlayer]);

  const handleCanPlay = (playerIdx) => {
    if (playerIdx === activePlayer) {
      const videoEl = playerIdx === 0 ? videoRef0.current : videoRef1.current;
      if (videoEl && videoEl.paused) {
        const isMutedGoal = (quizState === 'waiting_loop');
        safePlayVideo(videoEl, isMutedGoal);
      }
    }
  };

  const handleVideoPlaying = (playerIndex) => {
    const activeSrc = playerIndex === 0 ? src0 : src1;
    if (activeSrc === videoSrc) {
      if (playerIndex !== activePlayer) {
        setActivePlayer(playerIndex);
        const inactiveRef = playerIndex === 0 ? videoRef1 : videoRef0;
        if (inactiveRef.current) inactiveRef.current.pause();
      }
    } else {
      const bgRef = playerIndex === 0 ? videoRef0 : videoRef1;
      if (bgRef.current) bgRef.current.pause();
    }
  };

  // Reset and handle card animation timeline
  useEffect(() => {
    if (quizState === 'milo_tap') {
      // Trigger bouncy slide-up entrance animation when Milo says "Tap your answer!"
      setCardsVisible(true);
      setCardsFloating(false);
    } else if (quizState === 'waiting_loop') {
      // Keep cards visible & switch to subtle floating animation
      setCardsVisible(true);
      setCardsFloating(true);
    } else if (quizState === 'intro' || quizState === 'outro') {
      setCardsVisible(false);
      setCardsFloating(false);
    }
  }, [quizState, questionIdx]);

  const handleVideoEnd = () => {
    switch (quizState) {
      case 'intro':
        setQuizState('prompt');
        break;
      case 'prompt':
        setQuizState('milo_tap');
        break;
      case 'milo_tap':
        setQuizState('waiting_loop');
        break;
      case 'waiting_loop':
        // Looping video, replay on active player
        const activeVid = activePlayer === 0 ? videoRef0.current : videoRef1.current;
        if (activeVid) {
          activeVid.currentTime = 0;
          activeVid.play().catch(() => {});
        }
        break;
      case 'feedback_correct':
        setSelectedCardId(null);
        if (questionIdx < 1) { // Currently 2 animals ready (Panda & Lion)
          setQuestionIdx(prev => prev + 1);
          setQuizState('prompt');
        } else {
          // All questions complete! Automatically advance directly to Scene 3B Matching Activity!
          if (onNextScene) onNextScene();
        }
        break;
      case 'feedback_wrong':
        setShakeCardId(null);
        setQuizState('milo_tap');
        break;
      case 'outro':
        if (onNextScene) onNextScene();
        break;
      default:
        break;
    }
  };

  const handleCardClick = (cardId) => {
    if (quizState !== 'waiting_loop' && quizState !== 'milo_tap') return;

    setSelectedCardId(cardId);

    if (cardId === currentQuestion.targetAnimal) {
      // CORRECT ANSWER!
      playTapChime();
      playSuccessChime();
      setQuizState('feedback_correct');
    } else {
      // WRONG ANSWER!
      playTapChime();
      setShakeCardId(cardId);
      setTimeout(() => {
        setQuizState('feedback_wrong');
      }, 400);
    }
  };

  const handleRestartQuiz = () => {
    setQuestionIdx(0);
    setSelectedCardId(null);
    setQuizState('prompt');
  };

  const handleRepeatQuestion = () => {
    playTapChime();
    setQuizState('prompt');
  };

  return (
    <div className="scene3-wrapper">
      {/* Header Navigation */}
      <header className="scene3-header glass-panel">
        <div className="header-info">
          <div className="badge-pill">
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Scene 3: I Spy Quiz</span>
          </div>
          <h1 className="scene-title">🔍 {currentQuestion.hintText}</h1>
        </div>

        <div className="top-nav-controls">
          <button className="nav-arrow-btn" onClick={onPrevScene} disabled={!hasPrevScene} title="Previous Scene">
            <ChevronLeft size={22} />
          </button>
          
          <div className="step-indicator">
            Question {questionIdx + 1} of 2
          </div>

          <button className="nav-arrow-btn highlight-arrow" onClick={onNextScene} disabled={!hasNextScene} title="Next Scene">
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      {/* Main Video & Interactive Card Canvas */}
      <div className="video-aspect-container glass-panel">
        <video
          ref={videoRef0}
          src={src0}
          className={`main-video-player ${activePlayer === 0 ? 'video-active' : 'video-hidden'}`}
          onEnded={handleVideoEnd}
          onPlaying={() => handleVideoPlaying(0)}
          onCanPlay={() => handleCanPlay(0)}
          onCanPlayThrough={() => handleCanPlay(0)}
          onLoadedData={() => handleCanPlay(0)}
          onLoadedMetadata={() => handleCanPlay(0)}
          loop={quizState === 'waiting_loop'}
          muted={quizState === 'waiting_loop'}
          preload="auto"
          playsInline
        />
        <video
          ref={videoRef1}
          src={src1}
          className={`main-video-player ${activePlayer === 1 ? 'video-active' : 'video-hidden'}`}
          onEnded={handleVideoEnd}
          onPlaying={() => handleVideoPlaying(1)}
          onCanPlay={() => handleCanPlay(1)}
          onCanPlayThrough={() => handleCanPlay(1)}
          onLoadedData={() => handleCanPlay(1)}
          onLoadedMetadata={() => handleCanPlay(1)}
          loop={quizState === 'waiting_loop'}
          muted={quizState === 'waiting_loop'}
          preload="auto"
          playsInline
        />

        {/* REPEAT QUESTION BADGE ICON NEAR MISS SOPHIE (Sesuai Referensi Gambar) */}
        {(quizState === 'waiting_loop' || quizState === 'milo_tap') && (
          <div 
            className="repeat-question-btn" 
            onClick={handleRepeatQuestion}
            title="Repeat Question Prompt"
          >
            <img src="/images/question.png" alt="Repeat Question" className="question-icon-img" />
          </div>
        )}

        {/* INTERACTIVE 3D CARDS OVERLAY (MATCHES REFERENCE SCREENSHOT LAYOUT) */}
        {cardsVisible && (
          <div className="quiz-cards-overlay">
            <div className="quiz-cards-container">
              {quizCards.map((card, index) => {
                const isSelected = selectedCardId === card.id;
                const isShaking = shakeCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className={`quiz-card-item ${cardsFloating ? 'floating-idle' : 'bouncy-entrance'} ${isSelected ? 'selected-correct' : ''} ${isShaking ? 'shaking-wrong' : ''}`}
                    style={{ animationDelay: `${index * 0.12}s` }}
                    onClick={() => handleCardClick(card.id)}
                    title={`Tap to select ${card.name}!`}
                  >
                    {/* 3D Character Image */}
                    <div className="card-image-wrapper">
                      <img src={card.image} alt={card.name} className="card-3d-img" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Control Overlay */}
        <div className="video-overlay-layer">
          <div className="step-progress-row">
            {quizQuestions.slice(0, 2).map((q, idx) => (
              <div 
                key={q.id} 
                className={`step-dot ${idx === questionIdx ? 'current' : idx < questionIdx ? 'done' : ''}`}
                onClick={() => { setQuestionIdx(idx); setQuizState('prompt'); }}
                title={q.displayName}
              />
            ))}
          </div>

          <div className="overlay-bottom-bar">
            <div className="video-title-tag">
              <span className="part-number">{currentQuestion.hintText}</span>
            </div>

            <div className="player-buttons">
              <button className="control-btn" onClick={handleRestartQuiz} title="Restart Quiz">
                <RotateCcw size={20} />
              </button>

              <button className="action-pill-btn finish-scene-btn" onClick={onNextScene}>
                Next Scene <Sparkles size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
