import React, { useState, useEffect } from 'react';
import { SCENE_CONFIG } from './scenesConfig';
import ResponsiveVideoCanvas from './components/ResponsiveVideoCanvas';
import Scene2InteractiveZoo from './components/Scene2InteractiveZoo';
import Scene3ISpyQuiz from './components/Scene3ISpyQuiz';
import Scene3MatchingGame from './components/Scene3MatchingGame';
import Scene35DragDropFeeding from './components/Scene35DragDropFeeding';
import Scene51on1Practice from './components/Scene51on1Practice';
import { Sparkles, MapPin, Maximize2, Minimize2, X, Zap, HardDrive, Wifi } from 'lucide-react';
import './App.css';

export default function App() {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isReadyToStart, setIsReadyToStart] = useState(false);

  // Real-time Download Metrics State
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0 KB/s');

  const activeScene = SCENE_CONFIG[currentSceneIdx];

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Global Blob URL preloading engine with real-time speed & byte progress tracking
  useEffect(() => {
    window.__zooBlobUrls = window.__zooBlobUrls || {};

    const mediaList = [
      // UI Assets & Images
      '/images/mic_3d.png',
      '/images/Card.svg',
      '/images/Lion.png',
      '/images/Elephant.png',
      '/images/Panda.png',
      '/images/question.png',

      // Scene 1 Cutscene Videos
      '/Videos/scene_01_cutscene_part1.mp4',
      '/Videos/scene_01_cutscene_part2.mp4',
      '/Videos/scene_01_cutscene_part3.mp4',

      // Scene 2 Interactive Zoo Videos
      '/Videos/scene_02_choice_next_animal.mp4',
      '/Videos/scene_02_lion_01_dialogue_milo_choice.mp4',
      '/Videos/scene_02_lion_02_dialogue_user_prompt.mp4',
      '/Videos/scene_02_lion_03_hotspot_loop.mp4',
      '/Videos/scene_02_lion_04_appreciate_explain.mp4',
      '/Videos/scene_02_lion_05_detail_explain.mp4',
      '/Videos/scene_02_lion_06_speak_prompt.mp4',
      '/Videos/scene_02_lion_07_speak_loop.mp4',
      '/Videos/scene_02_lion_08_speech_success.mp4',
      '/Videos/scene_02_giraffe_04_appreciate_explain.mp4',
      '/Videos/scene_02_giraffe_05_detail_explain.mp4',
      '/Videos/scene_02_giraffe_06_speak_prompt.mp4',
      '/Videos/scene_02_giraffe_07_speak_loop.mp4',
      '/Videos/scene_02_giraffe_08_speech_success.mp4',
      '/Videos/scene_02_elephant_04_appreciate_explain.mp4',
      '/Videos/scene_02_elephant_05_detail_explain.mp4',
      '/Videos/scene_02_elephant_06_speak_prompt.mp4',
      '/Videos/scene_02_elephant_08_speech_success.mp4',
      '/Videos/scene_02_panda_04_appreciate_explain.mp4',
      '/Videos/scene_02_panda_05_detail_explain.mp4',
      '/Videos/scene_02_panda_06_speak_prompt.mp4',
      '/Videos/scene_02_panda_08_speech_success.mp4',
      '/Videos/scene_02_fish_04_appreciate_explain.mp4',
      '/Videos/scene_02_fish_05_detail_explain_01.mp4',
      '/Videos/scene_02_fish_05_detail_explain_02.mp4',
      '/Videos/scene_02_fish_06_speak_prompt.mp4',
      '/Videos/scene_02_fish_08_speech_success.mp4',

      // Scene 3 Matching Activity Videos & Audios
      '/Videos/scene_03_matching_01_intro.mp4',
      '/Videos/scene_03_matching_02_loop_waiting.mp4',
      '/Videos/scene_03_matching_03_appreciation.mp4',
      '/Audio/lion.mp3',
      '/Audio/panda.mp3',
      '/Audio/elephant.mp3',
      '/Audio/meat.mp3',
      '/Audio/bamboo.mp3',
      '/Audio/fruits.mp3',
      // Scene 2 Extra Detail Feed Videos
      '/Videos/scene_02_lion_05_detail_feed.mp4',
      '/Videos/scene_02_elephant_05_detail_feed.mp4',

      // Scene 3.5 Drag & Drop Zoo Feeding Activity Videos
      '/Videos/scene_035_dragdrop_01_intro.mp4',
      '/Videos/scene_035_dragdrop_02_loop_waiting.mp4',
      '/Videos/scene_035_dragdrop_03_feedback_correct.mp4',
      '/Videos/scene_035_dragdrop_04_feedback_wrong.mp4',
      '/Videos/scene_035_dragdrop_05_success.mp4',

      // Scene 5 1-on-1 Milo Practice Videos & Audios
      '/Videos/scene_05_milo intro.mp4',
      '/Videos/scene_05_milo idle.mp4',
      '/Videos/scene_05_milo talk.mp4',
      '/Audio/scene_05_milo intro.mp3',
      '/Audio/scene_05_milo answer 1.mp3',
      '/Audio/scene_05_milo answer 2.mp3',
      '/Audio/scene_05_milo answer 3.mp3',
      '/Audio/scene_05_milo answer 4.mp3',
      '/Audio/scene_05_milo answer 5.mp3',
      '/Audio/scene_05_milo answer 6.mp3'
    ];

    let totalDownloaded = 0;
    let knownTotalBytes = 0;
    let lastBytes = 0;
    let lastTime = performance.now();

    // Download Speed Calculation Ticker (Runs every 350ms)
    const speedTicker = setInterval(() => {
      const now = performance.now();
      const timeDelta = (now - lastTime) / 1000;
      if (timeDelta > 0) {
        const bytesDelta = totalDownloaded - lastBytes;
        const speedBps = bytesDelta / timeDelta;
        if (speedBps > 0) {
          setDownloadSpeed(
            speedBps >= 1024 * 1024
              ? `${(speedBps / (1024 * 1024)).toFixed(1)} MB/s`
              : `${Math.round(speedBps / 1024)} KB/s`
          );
        }
        lastBytes = totalDownloaded;
        lastTime = now;
      }
    }, 350);

    // Initial HEAD requests to calculate exact Total Download Size
    const fetchTotalSize = async () => {
      try {
        const sizes = await Promise.all(
          mediaList.map(async (url) => {
            try {
              const res = await fetch(url, { method: 'HEAD' });
              const len = res.headers.get('content-length');
              return len ? parseInt(len, 10) : 0;
            } catch {
              return 0;
            }
          })
        );
        const sum = sizes.reduce((a, b) => a + b, 0);
        if (sum > 0) {
          knownTotalBytes = sum;
          setTotalBytes(sum);
        }
      } catch (err) {
        console.warn('HEAD total size calculation error:', err);
      }
    };

    fetchTotalSize();

    let completedFiles = 0;
    const totalFiles = mediaList.length;

    const streamSingleAsset = async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          if (response.body) {
            const reader = response.body.getReader();
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              totalDownloaded += value.byteLength;
              setDownloadedBytes(totalDownloaded);
              if (knownTotalBytes > 0) {
                const pct = Math.min(Math.round((totalDownloaded / knownTotalBytes) * 100), 100);
                setPreloadProgress(pct);
              }
            }
            const blob = new Blob(chunks);
            const blobUrl = URL.createObjectURL(blob);
            window.__zooBlobUrls[url] = blobUrl;
          } else {
            const blob = await response.blob();
            totalDownloaded += blob.size;
            setDownloadedBytes(totalDownloaded);
            window.__zooBlobUrls[url] = URL.createObjectURL(blob);
          }
        }
      } catch (err) {
        console.warn(`Streaming failed for ${url}:`, err);
      } finally {
        completedFiles++;
        if (knownTotalBytes === 0) {
          const filePct = Math.min(Math.round((completedFiles / totalFiles) * 100), 100);
          setPreloadProgress(filePct);
        }
        if (completedFiles >= totalFiles) {
          setIsReadyToStart(true);
        }
      }
    };

    // Preload files in parallel batches of 4
    const BATCH_SIZE = 4;
    const runBatchDownload = async () => {
      for (let i = 0; i < mediaList.length; i += BATCH_SIZE) {
        const batch = mediaList.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(url => streamSingleAsset(url)));
      }
      setIsReadyToStart(true);
    };

    runBatchDownload();

    return () => clearInterval(speedTicker);
  }, []);

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

  const handleStartApp = () => {
    // Unlock HTML5 audio engine on mobile browsers via user touch gesture
    try {
      const dummy = new Audio();
      dummy.muted = true;
      dummy.play().then(() => {
        dummy.pause();
      }).catch(() => {});
    } catch (e) {}

    setIsPreloading(false);
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
      {/* INITIAL ASSET PRELOADER SCREEN */}
      {isPreloading && (
        <div className="preloader-overlay">
          <div className="preloader-card glass-panel">
            <div className="preloader-header">
              <div className="preloader-badge">
                <Sparkles size={18} color="var(--accent-gold)" />
                <span>Interactive English Zoo</span>
              </div>
              <h1 className="preloader-title">Preparing Zoo Adventure! 🦁🦒</h1>
              <p className="preloader-subtitle">Loading high-definition video assets & interactive scenes...</p>
            </div>

            {/* Dynamic Progress Bar & Real-time Metrics */}
            <div className="preloader-progress-wrapper">
              <div className="preloader-progress-track">
                <div 
                  className="preloader-progress-fill" 
                  style={{ width: `${preloadProgress}%` }}
                />
              </div>
              <div className="preloader-percentage-row">
                <span>{preloadProgress < 100 ? 'Downloading HD Video Assets for Instant Playback...' : '100% Zoo Media Buffered & Ready!'}</span>
                <span className="percent-text">{preloadProgress}%</span>
              </div>

              {/* Real-time Internet Speed & Total File Size Metrics Bar */}
              <div className="preloader-metrics-bar">
                <div className="metric-item">
                  <Zap size={14} className="metric-icon speed-icon" />
                  <span className="metric-label">Speed:</span>
                  <span className="metric-value speed-val">{preloadProgress < 100 ? downloadSpeed : 'Completed'}</span>
                </div>
                <div className="metric-divider"></div>
                <div className="metric-item">
                  <HardDrive size={14} className="metric-icon size-icon" />
                  <span className="metric-label">Downloaded:</span>
                  <span className="metric-value size-val">
                    {formatBytes(downloadedBytes)} {totalBytes > 0 ? `/ ${formatBytes(totalBytes)}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Animal Badges */}
            <div className="preloader-animal-badges">
              <span className="animal-chip">🦁 Lion</span>
              <span className="animal-chip">🦒 Giraffe</span>
              <span className="animal-chip">🐘 Elephant</span>
              <span className="animal-chip">🐼 Panda</span>
            </div>

            {/* Start Adventure Button (Only appears when ALL assets are 100% ready!) */}
            {isReadyToStart && (
              <button 
                className="start-adventure-btn ready"
                onClick={handleStartApp}
              >
                <span>START ADVENTURE! 🚀</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Main Navigation Header (Hidden in Fullscreen Mode & During Preloader) */}
      {!isFullscreen && !isPreloading && (
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
                  <span>Scene {scene.id.replace('scene_0', '')}</span>
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

      {/* Dynamic Scene Content View (ONLY MOUNTED & PLAYED AFTER START ADVENTURE IS CLICKED!) */}
      {!isPreloading && (
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
          ) : activeScene.type === 'matching' ? (
            <Scene3MatchingGame
              sceneData={activeScene}
              onNextScene={handleNextScene}
              onPrevScene={handlePrevScene}
              hasPrevScene={currentSceneIdx > 0}
              hasNextScene={currentSceneIdx < SCENE_CONFIG.length - 1}
            />
          ) : activeScene.type === 'dragdrop_feeding' ? (
            <Scene35DragDropFeeding
              sceneData={activeScene}
              onNextScene={handleNextScene}
              onPrevScene={handlePrevScene}
              hasPrevScene={currentSceneIdx > 0}
              hasNextScene={currentSceneIdx < SCENE_CONFIG.length - 1}
            />
          ) : activeScene.type === 'quiz' ? (
            <Scene3ISpyQuiz
              sceneData={activeScene}
              onNextScene={handleNextScene}
              onPrevScene={handlePrevScene}
              hasPrevScene={currentSceneIdx > 0}
              hasNextScene={currentSceneIdx < SCENE_CONFIG.length - 1}
            />
          ) : activeScene.type === 'milo_1on1' ? (
            <Scene51on1Practice
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
      )}

      {/* Footer Info (Hidden in Fullscreen Mode) */}
      {!isFullscreen && !isPreloading && (
        <footer className="app-footer glass-panel">
          <p>🦁 <strong>Scene 2 Active:</strong> Discovering Lion with Hotspot Ring & Speech Recognition</p>
        </footer>
      )}
    </div>
  );
}
