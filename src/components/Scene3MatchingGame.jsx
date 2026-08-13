import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Star, RotateCcw, Volume2 } from 'lucide-react';
import { playSuccessChime, playTapChime } from '../utils/soundEffects';
import './Scene3MatchingGame.css';

export default function Scene3MatchingGame({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'appreciation'
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [completedMatches, setCompletedMatches] = useState([]); // ['lion', 'panda', 'elephant']
  const [wrongPair, setWrongPair] = useState(null); // { animalId, foodId } for shake animation
  const [animatingFood, setAnimatingFood] = useState(null); // { foodId, targetAnimalId }
  const [firstAttemptErrors, setFirstAttemptErrors] = useState(0);
  const [attemptedAnimals, setAttemptedAnimals] = useState([]);
  const [starCount, setStarCount] = useState(3);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  const videoIntroRef = useRef(null);
  const videoLoopRef = useRef(null);
  const videoApprecRef = useRef(null);
  const audioTrackRef = useRef(null);

  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  const introVideoSrc = resolveMediaUrl(`/Videos/${sceneData.introVideo || 'scene_03_matching_01_intro.mp4'}`);
  const loopVideoSrc = resolveMediaUrl(`/Videos/${sceneData.loopVideo || 'scene_03_matching_02_loop_waiting.mp4'}`);
  const apprecVideoSrc = resolveMediaUrl(`/Videos/${sceneData.apprecationVideo || sceneData.appreciationVideo || 'scene_03_matching_03_appreciation.mp4'}`);

  const animals = [
    { id: 'elephant', name: 'Elephant', image: '/images/Elephant.png', targetFood: 'fruits', emoji: '🐘' },
    { id: 'lion', name: 'Lion', image: '/images/Lion.png', targetFood: 'meat', emoji: '🦁' },
    { id: 'panda', name: 'Panda', image: '/images/Panda.png', targetFood: 'bamboo', emoji: '🐼' }
  ];

  const foods = [
    { id: 'meat', name: 'Meat', image: '/images/Meat.png', targetAnimal: 'lion', emoji: '🥩' },
    { id: 'bamboo', name: 'Bamboo', image: '/images/Bamboo.png', targetAnimal: 'panda', emoji: '🎍' },
    { id: 'fruits', name: 'Fruits', image: '/images/Fruits.png', targetAnimal: 'elephant', emoji: '🍉' }
  ];

  // Play TTS pronunciation for card name
  const speakCardName = (name, id) => {
    playTapChime();

    // 1. Play pre-recorded TTS female audio track
    const audioUrl = resolveMediaUrl(`/Audio/${id}.mp3`);
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioTrackRef.current = audio;
      audio.play().catch(() => {
        // Fallback to Web Speech API if audio play restricted
        speakBrowserTTS(name);
      });
    } catch (e) {
      speakBrowserTTS(name);
    }
  };

  const speakBrowserTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2; // Cheerful female pitch
      window.speechSynthesis.speak(utterance);
    }
  };

  // Safe Video Trigger
  const safePlayVideo = (videoEl, isMuted = false) => {
    if (!videoEl) return;
    videoEl.muted = isMuted;
    videoEl.play().catch(err => {
      console.warn("Scene 3 video play failed:", err);
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    });
  };

  // Manage Video States according to phase
  useEffect(() => {
    if (phase === 'intro') {
      if (videoIntroRef.current) {
        videoIntroRef.current.currentTime = 0;
        safePlayVideo(videoIntroRef.current, false);
      }
    } else if (phase === 'playing') {
      if (videoLoopRef.current) {
        videoLoopRef.current.currentTime = 0;
        safePlayVideo(videoLoopRef.current, true);
      }
    } else if (phase === 'appreciation') {
      if (videoLoopRef.current) videoLoopRef.current.pause();
      if (videoApprecRef.current) {
        videoApprecRef.current.currentTime = 0;
        safePlayVideo(videoApprecRef.current, false);
      }
      // Compute Star Count based on First Attempt Errors
      // 3 animals total:
      // 0 errors -> 3 Stars
      // 1-2 errors -> 2 Stars
      // 3+ errors (failed all 3 on first try) -> 1 Star
      if (firstAttemptErrors >= 3) {
        setStarCount(1);
      } else if (firstAttemptErrors >= 1) {
        setStarCount(2);
      } else {
        setStarCount(3);
      }
    }
  }, [phase]);

  // Handle Match Logic when both Animal & Food are selected
  useEffect(() => {
    if (!selectedAnimal || !selectedFood) return;

    const animalObj = animals.find(a => a.id === selectedAnimal);
    const foodObj = foods.find(f => f.id === selectedFood);

    const isMatch = animalObj.targetFood === selectedFood;

    // Track first attempt for this animal
    if (!attemptedAnimals.includes(selectedAnimal)) {
      setAttemptedAnimals(prev => [...prev, selectedAnimal]);
      if (!isMatch) {
        setFirstAttemptErrors(prev => prev + 1);
      }
    }

    if (isMatch) {
      // SUCCESS MATCH!
      playSuccessChime();

      // Trigger flying food animation
      setAnimatingFood({ foodId: selectedFood, targetAnimalId: selectedAnimal });

      setTimeout(() => {
        setCompletedMatches(prev => {
          const updated = [...prev, selectedAnimal];
          // Check if all 3 animals are matched!
          if (updated.length === 3) {
            setTimeout(() => {
              setPhase('appreciation');
            }, 800);
          }
          return updated;
        });

        setSelectedAnimal(null);
        setSelectedFood(null);
        setAnimatingFood(null);
      }, 600);

    } else {
      // WRONG MATCH!
      setWrongPair({ animalId: selectedAnimal, foodId: selectedFood });

      setTimeout(() => {
        setWrongPair(null);
        setSelectedAnimal(null);
        setSelectedFood(null);
      }, 650);
    }
  }, [selectedAnimal, selectedFood]);

  const handleAnimalClick = (animalId) => {
    if (completedMatches.includes(animalId) || phase !== 'playing') return;
    const animalObj = animals.find(a => a.id === animalId);
    speakCardName(animalObj.name, animalId);
    setSelectedAnimal(animalId);
  };

  const handleFoodClick = (foodId) => {
    const isFoodMatched = completedMatches.some(aId => {
      const a = animals.find(an => an.id === aId);
      return a && a.targetFood === foodId;
    });

    if (isFoodMatched || phase !== 'playing') return;
    const foodObj = foods.find(f => f.id === foodId);
    speakCardName(foodObj.name, foodId);
    setSelectedFood(foodId);
  };

  const handleRestart = () => {
    setCompletedMatches([]);
    setSelectedAnimal(null);
    setSelectedFood(null);
    setWrongPair(null);
    setAnimatingFood(null);
    setFirstAttemptErrors(0);
    setAttemptedAnimals([]);
    setPhase('playing');
  };

  return (
    <div className="scene3-wrapper">
      {/* Top Header Navigation */}
      <header className="scene3-header glass-panel">
        <div className="header-info">
          <div className="badge-pill">
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Scene 3: Animal Feeding Activity</span>
          </div>
        </div>

        <div className="top-nav-controls">
          <button className="nav-arrow-btn" onClick={onPrevScene} disabled={!hasPrevScene} title="Previous Scene">
            <ChevronLeft size={22} />
          </button>

          <div className="matches-counter-badge">
            Feed Animals: {completedMatches.length} / 3 🐾
          </div>

          <button className="nav-arrow-btn highlight-arrow" onClick={onNextScene} disabled={!hasNextScene} title="Next Scene">
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      {/* Main Video & Interactive Canvas */}
      <div 
        className="matching-aspect-container glass-panel"
        onClick={() => {
          if (phase === 'intro') {
            setPhase('playing');
          }
        }}
      >
        {/* Intro Video Player */}
        <video
          ref={videoIntroRef}
          src={introVideoSrc}
          className={`main-video-player ${phase === 'intro' ? 'video-active' : 'video-hidden'}`}
          preload="auto"
          playsInline
          onEnded={() => setPhase('playing')}
          onError={(e) => {
            console.warn("Intro video load error, advancing to playing mode:", e);
            setPhase('playing');
          }}
        />

        {/* Looping Waiting Video Player */}
        <video
          ref={videoLoopRef}
          src={loopVideoSrc}
          className={`main-video-player ${phase === 'playing' ? 'video-active' : 'video-hidden'}`}
          loop
          muted
          preload="auto"
          playsInline
        />

        {/* Appreciation Video Player */}
        <video
          ref={videoApprecRef}
          src={apprecVideoSrc}
          className={`main-video-player ${phase === 'appreciation' ? 'video-active' : 'video-hidden'}`}
          loop
          preload="auto"
          playsInline
        />

        {/* PLAYING PHASE: 6-CARD MATCHING GRID OVERLAY */}
        {phase === 'playing' && (
          <div className="matching-grid-overlay">
            {/* TOP ROW: ANIMAL TARGET CARDS */}
            <div className="cards-row animals-row">
              {animals.map(animal => {
                const isMatched = completedMatches.includes(animal.id);
                const isSelected = selectedAnimal === animal.id;
                const isWrong = wrongPair?.animalId === animal.id;

                return (
                  <div
                    key={animal.id}
                    className={`matching-card animal-card ${isMatched ? 'card-completed' : ''} ${isSelected ? 'card-selected' : ''} ${isWrong ? 'card-wrong' : ''}`}
                    onClick={() => handleAnimalClick(animal.id)}
                  >
                    <div className="card-inner glass-panel">
                      <img src={animal.image} alt={animal.name} className="card-img" />
                      <span className="card-label">{animal.name}</span>

                      {/* Display matched food icon if solved */}
                      {isMatched && (
                        <div className="matched-food-badge">
                          <img 
                            src={foods.find(f => f.targetAnimal === animal.id)?.image} 
                            alt="Food" 
                            className="matched-food-img" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM ROW: FOOD SOURCE CARDS */}
            <div className="cards-row foods-row">
              {foods.map(food => {
                const isMatched = completedMatches.some(aId => {
                  const a = animals.find(an => an.id === aId);
                  return a && a.targetFood === food.id;
                });
                const isSelected = selectedFood === food.id;
                const isWrong = wrongPair?.foodId === food.id;
                const isFlying = animatingFood?.foodId === food.id;

                return (
                  <div
                    key={food.id}
                    className={`matching-card food-card ${isMatched ? 'card-completed' : ''} ${isSelected ? 'card-selected' : ''} ${isWrong ? 'card-wrong' : ''} ${isFlying ? 'card-flying' : ''}`}
                    onClick={() => handleFoodClick(food.id)}
                  >
                    <div className="card-inner glass-panel">
                      <img src={food.image} alt={food.name} className="card-img" />
                      <span className="card-label">{food.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* APPRECIATION PHASE: 3D GOLDEN STAR COINS CELEBRATION OVERLAY */}
        {phase === 'appreciation' && (
          <div className="star-coins-celebration-overlay">
            <div className="stars-title-badge glass-panel">
              <Sparkles size={24} color="#fbbf24" />
              <span>GREAT JOB FEEDING ALL ANIMALS!</span>
            </div>

            {/* 3D STAR COINS CONTAINER */}
            <div className="star-coins-row">
              {[1, 2, 3].map((starIndex) => {
                const isEarned = starIndex <= starCount;
                return (
                  <div
                    key={starIndex}
                    className={`star-coin-item ${isEarned ? 'earned-star' : 'unearned-star'}`}
                    style={{ animationDelay: `${starIndex * 0.25}s` }}
                  >
                    <div className="coin-3d-body">
                      <Star 
                        size={56} 
                        className={`star-icon ${isEarned ? 'star-gold' : 'star-gray'}`}
                        fill={isEarned ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="apprec-actions-row">
              <button className="apprec-btn replay-btn" onClick={handleRestart}>
                <RotateCcw size={18} />
                <span>Play Again</span>
              </button>

              {hasNextScene && (
                <button className="apprec-btn next-btn" onClick={onNextScene}>
                  <span>Next Adventure 🚀</span>
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
