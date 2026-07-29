import React, { useState, useEffect } from 'react';
import { SCENE_CONFIG } from './scenesConfig';
import ResponsiveVideoCanvas from './components/ResponsiveVideoCanvas';
import Scene2InteractiveZoo from './components/Scene2InteractiveZoo';
import { Sparkles, MapPin, Maximize2, Minimize2, X } from 'lucide-react';
import './App.css';

export default function App() {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeScene = SCENE_CONFIG[currentSceneIdx];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  const handleNextScene = () => {
    if (currentSceneIdx < SCENE_CONFIG.length - 1) {
      setCurrentSceneIdx(prev => prev + 1);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIdx > 0) {
      setCurrentSceneIdx(prev => prev - 1);
    }
  };

  return (
    <div className={`app-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Main Navigation Header (Hidden in Fullscreen Mode) */}
      {!isFullscreen && (
        <nav className="main-navbar glass-panel">
          <div className="nav-brand">
            <div className="logo-icon">
              <Sparkles size={24} color="#0f172a" />
            </div>
            <span className="brand-text">English Zoo Adventure</span>
          </div>

          <div className="nav-right-actions">
            {/* Scene Navigation Pills */}
            <div className="scene-pills">
              {SCENE_CONFIG.map((scene, idx) => (
                <button
                  key={scene.id}
                  className={`pill-btn ${idx === currentSceneIdx ? 'active' : ''}`}
                  onClick={() => setCurrentSceneIdx(idx)}
                >
                  <MapPin size={14} />
                  <span>Scene {idx + 1}</span>
                </button>
              ))}
            </div>

            {/* Top Right Fullscreen Button */}
            <button 
              className="fullscreen-toggle-btn"
              onClick={toggleFullscreen}
              title="Enter Fullscreen Mode"
            >
              <Maximize2 size={18} />
              <span>Fullscreen</span>
            </button>
          </div>
        </nav>
      )}

      {/* Floating Exit Fullscreen Button (Only visible in Fullscreen Mode) */}
      {isFullscreen && (
        <button 
          className="exit-fullscreen-floating-btn glass-panel"
          onClick={toggleFullscreen}
          title="Exit Fullscreen Mode"
        >
          <Minimize2 size={18} />
          <span>Exit Fullscreen</span>
          <X size={16} className="exit-icon" />
        </button>
      )}

      {/* Dynamic Scene Content View */}
      <main className="main-content">
        {activeScene.type === 'sequential_videos' ? (
          <ResponsiveVideoCanvas
            sceneData={activeScene}
            onNextScene={handleNextScene}
            onPrevScene={handlePrevScene}
            hasPrevScene={currentSceneIdx > 0}
            hasNextScene={currentSceneIdx < SCENE_CONFIG.length - 1}
          />
        ) : activeScene.type === 'interactive_zoo' ? (
          <Scene2InteractiveZoo
            sceneData={activeScene}
            onNextScene={handleNextScene}
            onPrevScene={handlePrevScene}
            hasPrevScene={currentSceneIdx > 0}
            hasNextScene={currentSceneIdx < SCENE_CONFIG.length - 1}
          />
        ) : (
          /* Placeholder Card for upcoming Scenes 3, 4 */
          <div className="upcoming-scene-card glass-panel">
            <div className="upcoming-badge">Coming Up Next</div>
            <h2>{activeScene.title}</h2>
            <p>{activeScene.titleText || "This interactive scene will open once previous scenes are complete!"}</p>

            <div className="navigation-actions">
              <button className="nav-arrow-btn" onClick={handlePrevScene}>
                ◄ Back to Scene 2
              </button>
              {currentSceneIdx < SCENE_CONFIG.length - 1 && (
                <button className="action-pill-btn" onClick={handleNextScene}>
                  Next Scene ►
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Info (Hidden in Fullscreen Mode) */}
      {!isFullscreen && (
        <footer className="app-footer glass-panel">
          <p>🦁 <strong>Scene 2 Active:</strong> Discovering Lion with Hotspot Ring & Speech Recognition</p>
        </footer>
      )}
    </div>
  );
}
