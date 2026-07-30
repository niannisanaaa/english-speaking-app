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

  const videoRef0 = useRef(null);
  const videoRef1 = useRef(null);
  const [activePlayer, setActivePlayer] = useState(0); // 0 = Player A, 1 = Player B

  const currentVideo = sceneData.videos[currentPartIndex];
  const totalParts = sceneData.videos.length;

  const resolveMediaUrl = (path) => {
    return window.__zooBlobUrls?.[path] || path;
  };

  const [src0, setSrc0] = useState(resolveMediaUrl(`/Videos/${sceneData.videos[0]?.name}`));
  const [src1, setSrc1] = useState(
    sceneData.videos[1] ? resolveMediaUrl(`/Videos/${sceneData.videos[1]?.name}`) : ''
  );

  const hasAdvancedRef = useRef(false);

  // Bulletproof video player trigger with browser gesture fallback strategy
  const safePlayVideo = (videoEl) => {
    if (!videoEl) return;
    videoEl.muted = isMuted;
    videoEl.play().catch(err => {
      console.warn("Unmuted autoplay restricted by browser, fallback to muted autoplay:", err);
      videoEl.muted = true;
      videoEl.play().then(() => {
        // Automatically attempt unmuting after playback starts
        setTimeout(() => {
          if (videoEl && !isMuted) {
            videoEl.muted = false;
          }
        }, 200);
      }).catch(e => {
        console.warn("Muted autoplay also failed:", e);
      });
    });
  };

  // Pre-buffer next video and switch seamlessly
  useEffect(() => {
    hasAdvancedRef.current = false;
    const nextSrc = resolveMediaUrl(`/Videos/${currentVideo.name}`);

    if (activePlayer === 0) {
      if (src0 === nextSrc) {
        if (videoRef0.current) {
          if (videoRef0.current.readyState >= 1) {
            videoRef0.current.currentTime = 0;
          }
          safePlayVideo(videoRef0.current);
        }
      } else {
        setSrc1(nextSrc);
      }
    } else {
      if (src1 === nextSrc) {
        if (videoRef1.current) {
          if (videoRef1.current.readyState >= 1) {
            videoRef1.current.currentTime = 0;
          }
          safePlayVideo(videoRef1.current);
        }
      } else {
        setSrc0(nextSrc);
      }
    }

    setProgress(0);
    setSimulatedTime(0);
    setIsPlaying(true);
    setVideoError(false);
  }, [currentPartIndex]);

  // Initial mount & src change play triggers
  useEffect(() => {
    if (videoRef0.current && src0) {
      if (videoRef0.current.readyState >= 1) {
        videoRef0.current.currentTime = 0;
      }
      safePlayVideo(videoRef0.current);
    }
  }, [src0]);

  useEffect(() => {
    if (videoRef1.current && src1) {
      if (videoRef1.current.readyState >= 1) {
        videoRef1.current.currentTime = 0;
      }
      safePlayVideo(videoRef1.current);
    }
  }, [src1]);

  useEffect(() => {
    const activeEl = activePlayer === 0 ? videoRef0.current : videoRef1.current;
    if (activeEl && activeEl.paused) {
      safePlayVideo(activeEl);
    }
  }, [activePlayer]);

  const handleCanPlay = (playerIdx) => {
    if (playerIdx === activePlayer) {
      const videoEl = playerIdx === 0 ? videoRef0.current : videoRef1.current;
      if (videoEl && videoEl.paused) {
        safePlayVideo(videoEl);
      }
    }
  };

  const handleVideoPlaying = (playerIndex) => {
    if (playerIndex === activePlayer) {
      const inactiveRef = playerIndex === 0 ? videoRef1 : videoRef0;
      if (inactiveRef.current) inactiveRef.current.pause();
    }
  };

  const handleVideoEnd = () => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;

    if (currentPartIndex < totalParts - 1) {
      const nextIdx = currentPartIndex + 1;
      const nextVideo = sceneData.videos[nextIdx];
      const nextSrc = resolveMediaUrl(`/Videos/${nextVideo.name}`);
      const nextPlayer = 1 - activePlayer;

      if (nextPlayer === 0) {
        if (src0 !== nextSrc) setSrc0(nextSrc);
        if (videoRef0.current) {
          if (videoRef0.current.readyState >= 1) videoRef0.current.currentTime = 0;
          safePlayVideo(videoRef0.current);
        }
      } else {
        if (src1 !== nextSrc) setSrc1(nextSrc);
        if (videoRef1.current) {
          if (videoRef1.current.readyState >= 1) videoRef1.current.currentTime = 0;
          safePlayVideo(videoRef1.current);
        }
      }
      setActivePlayer(nextPlayer);
      setCurrentPartIndex(nextIdx);
    } else {
      setIsPlaying(false);
      if (onNextScene) onNextScene();
    }
  };

  const handleTimeUpdate = () => {
    const activeRef = activePlayer === 0 ? videoRef0 : videoRef1;
    if (activeRef.current && !hasAdvancedRef.current) {
      const current = activeRef.current.currentTime;
      const effectiveDuration = currentVideo.maxDuration || activeRef.current.duration || 1;

      if (currentVideo.maxDuration && current >= currentVideo.maxDuration) {
        handleVideoEnd();
        return;
      }
      setProgress((current / effectiveDuration) * 100);
    }
  };

  const togglePlay = () => {
    const activeRef = activePlayer === 0 ? videoRef0 : videoRef1;
    if (videoError) {
      setIsPlaying(!isPlaying);
    } else if (activeRef.current) {
      if (isPlaying) {
        activeRef.current.pause();
      } else {
        activeRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef0.current) videoRef0.current.muted = !isMuted;
    if (videoRef1.current) videoRef1.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestartPart = () => {
    const activeRef = activePlayer === 0 ? videoRef0 : videoRef1;
    if (activeRef.current) {
      activeRef.current.currentTime = 0;
      activeRef.current.play();
    }
    setProgress(0);
    setSimulatedTime(0);
    setIsPlaying(true);
  };

  const handleSelectPart = (idx) => {
    setCurrentPartIndex(idx);
  };

  const handleVideoError = () => {
    setVideoError(true);
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
        {/* Dual Video Player A & B for 0ms Seamless Switching */}
        {!videoError && (
          <>
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
              onTimeUpdate={handleTimeUpdate}
              onError={handleVideoError}
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
              onTimeUpdate={handleTimeUpdate}
              onError={handleVideoError}
              preload="auto"
              playsInline
            />
          </>
        )}

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
