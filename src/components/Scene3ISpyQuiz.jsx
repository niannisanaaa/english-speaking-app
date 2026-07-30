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

  const videoRef = useRef(null);

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
        rawPath = '/Videos/scene_03_ispy_01_intro_dialogue.mp4.mp4';
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

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
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
        // Looping video, replay
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
        break;
      case 'feedback_correct':
        setSelectedCardId(null);
        if (questionIdx < 1) { // Currently 2 animals ready (Panda & Lion)
          setQuestionIdx(prev => prev + 1);
          setQuizState('prompt');
        } else {
          setQuizState('outro');
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
          ref={videoRef}
          src={videoSrc}
          className="main-video-player"
          onEnded={handleVideoEnd}
          muted={quizState === 'waiting_loop'}
          preload="auto"
          playsInline
          autoPlay
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
