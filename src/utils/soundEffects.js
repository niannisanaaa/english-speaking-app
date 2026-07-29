// Web Audio API Sound Synthesizer (Instant, 100% reliable across browsers)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play cheerful 3-note ascending chime when user clicks Lion or speaks correctly
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Notes: G5 (783.99 Hz), C6 (1046.50 Hz), E6 (1318.51 Hz)
    const notes = [783.99, 1046.50, 1318.51];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.01, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.3, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.38);
    });
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

/**
 * Play clean tap / discovery chime when user clicks hotspot
 */
export function playTapChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Notes: C6 (1046.50 Hz), G6 (1567.98 Hz)
    const notes = [1046.50, 1567.98];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.01, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.28);
    });
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}
