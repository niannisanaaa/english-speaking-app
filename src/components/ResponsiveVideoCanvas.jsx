import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Volume2, VolumeX, Film, Sparkles } from 'lucide-react';
import './ResponsiveVideoCanvas.css';

export default function ResponsiveVideoCanvas({ sceneData, onNextScene, onPrevScene, hasPrevScene, hasNextScene }) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);

  const videoRef = useRef(null);
  const currentVideo = sceneData.videos[currentPartIndex];
  const totalParts = sceneData.videos.length;

  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  const [videoSrc, setVideoSrc] = useState(resolveMediaUrl(`/Videos/${currentVideo.name}`));

  const hasAdvancedRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset when video part changes
  useEffect(() => {
    hasAdvancedRef.current = false;
    setVideoSrc(resolveMediaUrl(`/Videos/${currentVideo.name}`));
    setProgress(0);
    setSimulatedTime(0);
    setIsPlaying(true);
    setVideoError(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentPartIndex]);

  // Simulation timer for fallback when video files are not yet uploaded
  useEffect(() => {
    let timer;
    if (videoError && isPlaying) {
      timer = setInterval(() => {
        setSimulatedTime((prev) => {
          if (prev >= 6) { // 6 second demo cutscene length
            handleVideoEnd();
            return 0;
          }
          setProgress((prev / 6) * 100);
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [videoError, isPlaying, currentPartIndex]);

  const handleVideoEnd = () => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;

    if (currentPartIndex < totalParts - 1) {
      // Instant seamless continuation without black screen delay
      setCurrentPartIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      if (onNextScene) onNextScene();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !hasAdvancedRef.current) {
      const current = videoRef.current.currentTime;
      const effectiveDuration = currentVideo.maxDuration || videoRef.current.duration || 1;

      if (currentVideo.maxDuration && current >= currentVideo.maxDuration) {
        handleVideoEnd();
        return;
      }
      setProgress((current / effectiveDuration) * 100);
    }
  };

  const togglePlay = () => {
    if (videoError) {
      setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleRestartPart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    setProgress(0);
    setSimulatedTime(0);
    setIsPlaying(true);
  };

  const handleSelectPart = (idx) => {
    setCurrentPartIndex(idx);
  };

  const handleVideoError = () => {
    if (videoSrc.startsWith('/Videos/')) {
      setVideoSrc(`/videos/${currentVideo.name}`);
    } else {
      setVideoError(true);
    }
  };

  return (
    <div className="canvas-wrapper">
      {/* Top Header & Navigation Bar */}
      <header className="canvas-header glass-panel">
        <div className="header-info">
          <div className="badge-pill">
            <Film size={16} color="var(--accent-cyan)" />
            <span>Scene 1 of 4</span>
          </div>
          <h1 className="scene-title">{sceneData.title}</h1>
        </div>

        {/* Top-Right Arrow Navigation */}
        <div className="top-nav-controls">
          <button 
            className="nav-arrow-btn" 
            onClick={onPrevScene} 
            disabled={!hasPrevScene}
            title="Previous Scene"
          >
            <ChevronLeft size={22} />
          </button>
          
          <div className="part-indicator">
            {currentPartIndex + 1} / {totalParts}
          </div>

          <button 
            className="nav-arrow-btn highlight-arrow" 
            onClick={onNextScene}
            disabled={!hasNextScene}
            title="Next Scene"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </header>

      {/* Main Responsive Video Canvas Container */}
      <div className="video-aspect-container glass-panel">
        {/* Real Video Player */}
        {!videoError ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="main-video-player"
            onEnded={handleVideoEnd}
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
            preload="auto"
            playsInline
            autoPlay
          />
        ) : null}

        {/* Fallback Animated Demo Canvas (Active before video files are uploaded) */}
        {videoError && (
          <div 
            className="fallback-canvas-demo"
            style={{ background: currentVideo.fallbackBg }}
          >
            <div className="demo-particles"></div>
            <div className="demo-content">
              <div className="part-badge">Part {currentPartIndex + 1} of 3</div>
              <h2>{currentVideo.fallbackTitle}</h2>
              <p className="demo-subtitle">{currentVideo.subtitle}</p>
              
              <div className="upload-hint">
                <span>Expected File: <code>/public/videos/{currentVideo.name}</code></span>
              </div>

              <div className="demo-animation-box">
                <Sparkles className="sparkle-anim" size={48} />
                <div className="playing-pulse">
                  {isPlaying ? 'Playing Cutscene Video...' : 'Paused'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Overlay Controls & Segment Progress */}
        <div className="video-overlay-layer">
          {/* Segmented Progress Indicators */}
          <div className="segmented-progress-bar">
            {sceneData.videos.map((part, idx) => (
              <div 
                key={part.id} 
                className={`segment-track ${idx === currentPartIndex ? 'active-part' : idx < currentPartIndex ? 'completed-part' : ''}`}
                onClick={() => handleSelectPart(idx)}
              >
                <div 
                  className="segment-fill" 
                  style={{ 
                    width: idx === currentPartIndex ? `${progress}%` : idx < currentPartIndex ? '100%' : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bottom Controls */}
          <div className="overlay-bottom-bar">
            <div className="video-title-tag">
              <span className="part-number">Part {currentPartIndex + 1}:</span> {currentVideo.title}
            </div>

            <div className="player-buttons">
              <button className="control-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button className="control-btn" onClick={handleRestartPart} title="Replay Part">
                <RotateCcw size={20} />
              </button>

              <button className="control-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {currentPartIndex < totalParts - 1 ? (
                <button 
                  className="action-pill-btn"
                  onClick={() => setCurrentPartIndex(prev => prev + 1)}
                >
                  Next Part <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  className="action-pill-btn finish-scene-btn"
                  onClick={onNextScene}
                >
                  Start Scene 2 <Sparkles size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
