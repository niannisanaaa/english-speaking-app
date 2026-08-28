import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { playSuccessChime, playTapChime } from '../utils/soundEffects';
import './Scene35DragDropFeeding.css';

export default function Scene35DragDropFeeding({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'correct_feedback' | 'wrong_feedback' | 'success'
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [completedMatches, setCompletedMatches] = useState([]); // ['lion', 'panda', 'elephant']
  const [draggedFood, setDraggedFood] = useState(null);
  const [animatingFood, setAnimatingFood] = useState(null); // { foodId, targetAnimalId }
  const [firstAttemptErrors, setFirstAttemptErrors] = useState(0);
  const [attemptedAnimals, setAttemptedAnimals] = useState([]);
  const [starCount, setStarCount] = useState(3);

  const videoIntroRef = useRef(null);
  const videoLoopRef = useRef(null);
  const videoCorrectRef = useRef(null);
  const videoWrongRef = useRef(null);
  const videoSuccessRef = useRef(null);
  const audioTrackRef = useRef(null);

  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  const introVideoSrc = resolveMediaUrl(`/Videos/${sceneData.introVideo || 'scene_035_dragdrop_01_intro.mp4'}`);
  const loopVideoSrc = resolveMediaUrl(`/Videos/${sceneData.loopVideo || 'scene_035_dragdrop_02_loop_waiting.mp4'}`);
  const correctVideoSrc = resolveMediaUrl(`/Videos/${sceneData.correctVideo || 'scene_035_dragdrop_03_feedback_correct.mp4'}`);
  const wrongVideoSrc = resolveMediaUrl(`/Videos/${sceneData.wrongVideo || 'scene_035_dragdrop_04_feedback_wrong.mp4'}`);
  const successVideoSrc = resolveMediaUrl(`/Videos/${sceneData.successVideo || 'scene_035_dragdrop_05_success.mp4'}`);

  const animals = [
    { 
      id: 'lion', 
      name: 'Lion', 
      targetFood: 'meat', 
      hotspot: { top: '18%', left: '2%', width: '28vw', height: '28vw' },
      basketPos: { top: '52%', left: '26%' }
    },
    { 
      id: 'panda', 
      name: 'Panda', 
      targetFood: 'bamboo', 
      hotspot: { top: '8%', left: '30%', width: '30vw', height: '30vw' },
      basketPos: { top: '33%', left: '46.5%' }
    },
    { 
      id: 'elephant', 
      name: 'Elephant', 
      targetFood: 'fruits', 
      hotspot: { top: '16%', left: '60%', width: '28vw', height: '28vw' },
      basketPos: { top: '46%', left: '71.5%' }
    }
  ];

  const foods = [
    { id: 'fruits', name: 'Fruits', image: '/images/Fruits.png', targetAnimal: 'elephant' },
    { id: 'meat', name: 'Meat', image: '/images/Meat.png', targetAnimal: 'lion' },
    { id: 'bamboo', name: 'Bamboo', image: '/images/Bamboo.png', targetAnimal: 'panda' }
  ];

  // Play TTS female voice pronunciation
  const speakCardName = (name, id) => {
    playTapChime();
    const audioUrl = resolveMediaUrl(`/Audio/${id}.mp3`);
    try {
      if (audioTrackRef.current) audioTrackRef.current.pause();
      const audio = new Audio(audioUrl);
      audioTrackRef.current = audio;
      audio.play().catch(() => speakBrowserTTS(name));
    } catch (e) {
      speakBrowserTTS(name);
    }
  };

  const speakBrowserTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const safePlayVideo = (videoEl, isMuted = false) => {
    if (!videoEl) return;
    videoEl.muted = isMuted;
    videoEl.play().catch(err => {
      console.warn("Scene 3.5 video play failed:", err);
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    });
  };

  // Video State Controller
  useEffect(() => {
    if (phase === 'intro') {
      if (videoIntroRef.current) {
        videoIntroRef.current.currentTime = 0;
        safePlayVideo(videoIntroRef.current, false);
      }
    } else if (phase === 'playing') {
      if (videoLoopRef.current) {
        safePlayVideo(videoLoopRef.current, true);
      }
    } else if (phase === 'correct_feedback') {
      if (videoLoopRef.current) videoLoopRef.current.pause();
      if (videoCorrectRef.current) {
        videoCorrectRef.current.currentTime = 0;
        safePlayVideo(videoCorrectRef.current, false);
      }
    } else if (phase === 'wrong_feedback') {
      if (videoLoopRef.current) videoLoopRef.current.pause();
      if (videoWrongRef.current) {
        videoWrongRef.current.currentTime = 0;
        safePlayVideo(videoWrongRef.current, false);
      }
    } else if (phase === 'success') {
      if (videoLoopRef.current) videoLoopRef.current.pause();
      if (videoSuccessRef.current) {
        videoSuccessRef.current.currentTime = 0;
        safePlayVideo(videoSuccessRef.current, false);
      }
      // Calculate 3D Star Coins
      if (firstAttemptErrors >= 3) setStarCount(1);
      else if (firstAttemptErrors >= 1) setStarCount(2);
      else setStarCount(3);
    }
  }, [phase]);

  // Execute Match Evaluation Logic
  const processMatch = (animalId, foodId) => {
    if (completedMatches.includes(animalId) || phase === 'wrong_feedback' || phase === 'correct_feedback') return;

    const animalObj = animals.find(a => a.id === animalId);
    const isMatch = animalObj.targetFood === foodId;

    if (!attemptedAnimals.includes(animalId)) {
      setAttemptedAnimals(prev => [...prev, animalId]);
      if (!isMatch) setFirstAttemptErrors(prev => prev + 1);
    }

    if (isMatch) {
      // CORRECT MATCH!
      playSuccessChime();
      setAnimatingFood({ foodId, targetAnimalId: animalId });

      setTimeout(() => {
        setCompletedMatches(prev => {
          const updated = [...prev, animalId];
          if (updated.length === 3) {
            setPhase('success');
          } else {
            setPhase('correct_feedback');
          }
          return updated;
        });
        setSelectedAnimal(null);
        setSelectedFood(null);
        setAnimatingFood(null);
      }, 500);

    } else {
      // WRONG MATCH! Play wrong feedback video immediately
      setPhase('wrong_feedback');
      setSelectedAnimal(null);
      setSelectedFood(null);
    }
  };

  // TAP & MATCH TRIGGER
  useEffect(() => {
    if (!selectedAnimal || !selectedFood) return;
    processMatch(selectedAnimal, selectedFood);
  }, [selectedAnimal, selectedFood]);

  const lastSpokenAnimalRef = useRef(null);

  // DRAG & DROP HANDLERS
  const handleDragStart = (e, foodId) => {
    e.dataTransfer.setData('text/plain', foodId);
    setDraggedFood(foodId);
    lastSpokenAnimalRef.current = null;
    const foodObj = foods.find(f => f.id === foodId);
    if (foodObj) speakCardName(foodObj.name, foodId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (animalId) => {
    if (completedMatches.includes(animalId)) return;
    if (lastSpokenAnimalRef.current !== animalId) {
      lastSpokenAnimalRef.current = animalId;
      const animalObj = animals.find(a => a.id === animalId);
      if (animalObj) speakCardName(animalObj.name, animalId);
    }
  };

  const handleDrop = (e, animalId) => {
    e.preventDefault();
    const foodId = e.dataTransfer.getData('text/plain') || draggedFood;
    setDraggedFood(null);
    lastSpokenAnimalRef.current = null;
    if (foodId) {
      processMatch(animalId, foodId);
    }
  };

  const handleAnimalTap = (animalId) => {
    if (completedMatches.includes(animalId)) return;
    const animalObj = animals.find(a => a.id === animalId);
    speakCardName(animalObj.name, animalId);
    setSelectedAnimal(animalId);
  };

  const handleFoodTap = (foodId) => {
    const isFoodMatched = completedMatches.some(aId => {
      const a = animals.find(an => an.id === aId);
      return a && a.targetFood === foodId;
    });

    if (isFoodMatched) return;
    const foodObj = foods.find(f => f.id === foodId);
    speakCardName(foodObj.name, foodId);
    setSelectedFood(foodId);
  };

  return (
    <div className="scene35-wrapper">
      {/* Header */}
      <header className="scene35-header glass-panel">
        <div className="header-info">
          <div className="badge-pill">
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Scene 3.5: Drag & Drop Zoo Feeding</span>
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

      {/* Main Video & Canvas Container */}
      <div 
        className="video-aspect-container glass-panel"
        onClick={() => {
          if (phase === 'intro') {
            setPhase('playing');
          } else if (phase === 'success' && hasNextScene) {
            onNextScene();
          }
        }}
      >
        {/* Intro Video */}
        <video
          ref={videoIntroRef}
          src={introVideoSrc}
          className={`main-video-player ${phase === 'intro' ? 'video-active' : 'video-hidden'}`}
          preload="auto"
          playsInline
          onEnded={() => setPhase('playing')}
          onError={() => setPhase('playing')}
        />

        {/* Looping Waiting Video */}
        <video
          ref={videoLoopRef}
          src={loopVideoSrc}
          className={`main-video-player ${(phase === 'playing' || phase === 'correct_feedback' || phase === 'wrong_feedback') ? 'video-active' : 'video-hidden'}`}
          loop
          muted
          preload="auto"
          playsInline
        />

        {/* Correct Feedback Video */}
        <video
          ref={videoCorrectRef}
          src={correctVideoSrc}
          className={`main-video-player ${phase === 'correct_feedback' ? 'video-active' : 'video-hidden'}`}
          preload="auto"
          playsInline
          onEnded={() => setPhase('playing')}
        />

        {/* Wrong Feedback Video */}
        <video
          ref={videoWrongRef}
          src={wrongVideoSrc}
          className={`main-video-player ${phase === 'wrong_feedback' ? 'video-active' : 'video-hidden'}`}
          preload="auto"
          playsInline
          onEnded={() => setPhase('playing')}
        />

        {/* Success Video (Plays ONCE) */}
        <video
          ref={videoSuccessRef}
          src={successVideoSrc}
          className={`main-video-player ${phase === 'success' ? 'video-active' : 'video-hidden'}`}
          loop={false}
          preload="auto"
          playsInline
          onEnded={() => {
            if (hasNextScene) {
              setTimeout(() => onNextScene(), 3500);
            }
          }}
        />

        {/* PLAYING PHASE: HOTSPOTS & DRAG/DROP OVERLAY */}
        {(phase === 'playing' || phase === 'correct_feedback' || phase === 'wrong_feedback') && (
          <div className="dragdrop-interactive-overlay">
            {/* ANIMAL DROP HOTSPOT TARGETS (100% INVISIBLE CIRCLES, NO TEXT) */}
            {animals.map(animal => {
              const isMatched = completedMatches.includes(animal.id);
              const isSelected = selectedAnimal === animal.id;

              return (
                <div
                  key={animal.id}
                  className={`animal-drop-zone ${isMatched ? 'zone-matched' : ''} ${isSelected ? 'zone-selected' : ''}`}
                  style={{
                    top: animal.hotspot.top,
                    left: animal.hotspot.left,
                    width: animal.hotspot.width,
                    height: animal.hotspot.height
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={() => handleDragEnter(animal.id)}
                  onDrop={(e) => handleDrop(e, animal.id)}
                  onClick={() => handleAnimalTap(animal.id)}
                />
              );
            })}

            {/* MATCHED FOOD ITEMS STAY INSIDE ANIMAL FEEDING BASKETS */}
            {animals.map(animal => {
              const isMatched = completedMatches.includes(animal.id);
              if (!isMatched) return null;

              const matchedFoodObj = foods.find(f => f.targetAnimal === animal.id);
              if (!matchedFoodObj) return null;

              return (
                <div 
                  key={`basket-${animal.id}`}
                  className="matched-basket-food-item"
                  style={{
                    top: animal.basketPos.top,
                    left: animal.basketPos.left
                  }}
                >
                  <img src={matchedFoodObj.image} alt={matchedFoodObj.name} className="basket-food-img" />
                </div>
              );
            })}

            {/* BOTTOM ROAD: WHITE RADIAL GLOW FOOD ITEMS (ENLARGED RATIO MATCHING MOCKUP) */}
            <div className="bottom-food-road-row">
              {foods.map(food => {
                const isMatched = completedMatches.some(aId => {
                  const a = animals.find(an => an.id === aId);
                  return a && a.targetFood === food.id;
                });
                const isSelected = selectedFood === food.id;
                const isFlying = animatingFood?.foodId === food.id;

                if (isMatched) return null;

                return (
                  <div
                    key={food.id}
                    className={`white-glow-food-item ${isSelected ? 'food-selected' : ''} ${isFlying ? 'food-flying' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, food.id)}
                    onClick={() => handleFoodTap(food.id)}
                  >
                    <img src={food.image} alt={food.name} className="food-glow-img" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUCCESS REWARD PAGE: 3D GOLDEN COIN.PNG STARS (NO BUTTONS, NO TEXT, NO EXTRA CARDS!) */}
        {phase === 'success' && (
          <div className="star-coins-celebration-overlay">
            {/* 3D STAR COINS ROW (MOVED DOWN, NO BACKGROUND DIM!) */}
            <div className="star-coins-row">
              {[1, 2, 3].map((starIndex) => {
                const isEarned = starIndex <= starCount;
                return (
                  <div
                    key={starIndex}
                    className={`star-coin-item ${isEarned ? 'earned-star' : 'unearned-star'}`}
                    style={{ animationDelay: `${starIndex * 0.25}s` }}
                  >
                    <img 
                      src="/images/Coin.png" 
                      alt="Star Coin" 
                      className="coin-png-img" 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
