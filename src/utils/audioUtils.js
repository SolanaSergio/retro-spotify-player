// AMBIENT ENGINE & TEMPO SYNC
// Generates audio-reactive data using pure math, or syncs to tempo if available.
// Removes "fake" chaotic simulation in favor of smooth, organic motion when data is missing.

const generateAmbient = (timeMs, features) => {
  const t = timeMs / 1000;
  
  // 1. BEAT SYNC (If Tempo is available)
  let isBeat = false;
  let beatIntensity = 0;
  
  if (features && features.tempo) {
    const spb = 60 / features.tempo; // Seconds per beat
    const beatProgress = (t % spb) / spb;
    
    // Beat triggers exactly on the beat, decays quickly
    if (beatProgress < 0.1) {
      isBeat = true;
      beatIntensity = 1.0 - (beatProgress * 10); // 1.0 -> 0.0
    }
  } else {
    // AMBIENT MODE: No fake beats. Just smooth waves.
    // This removes the "bad simulation" complaint.
    beatIntensity = (Math.sin(t) + 1) * 0.2; // Gentle breathing
  }
  
  // 2. ENERGY / LOUDNESS
  // If we have 'energy' feature, use it to scale the "loudness"
  const baseEnergy = features ? features.energy : 0.5;
  
  // Create a smooth rolling wave for loudness instead of chaotic noise
  const wave = Math.sin(t * 0.5) * 0.3 + Math.sin(t * 0.2) * 0.2;
  const loudness = -20 + (wave * 20) + (beatIntensity * 10 * baseEnergy);
  
  // 3. PITCHES (Chromogram)
  // Instead of random noise, generate smooth harmonic waves
  // This creates beautiful, flowing gradients in visualizers
  const pitches = new Array(12).fill(0).map((_, i) => {
    // Harmonics based on time
    const val = (Math.sin(t * 0.5 + i * 0.5) + 1) / 2;
    return val * baseEnergy;
  });

  return {
    isBeat,
    beatIntensity, // New prop for smooth beat fading
    loudness,
    pitches,
    timbre: pitches, // Reuse for now
    isSimulated: true,
    tempo: features?.tempo || 0
  };
};

export const findCurrentEntity = (entities, positionSec) => {
  if (!entities || entities.length === 0) return null;
  if (positionSec < entities[0].start) return null;
  if (positionSec > entities[entities.length - 1].start + entities[entities.length - 1].duration) return null;

  let low = 0;
  let high = entities.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const entity = entities[mid];
    const end = entity.start + entity.duration;

    if (positionSec >= entity.start && positionSec < end) {
      return entity;
    } else if (positionSec < entity.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return null;
};

export const getCurrentAudioValues = (audioAnalysis, audioFeatures, currentPositionMs) => {
  // Use Ambient Engine if no detailed analysis
  if (!audioAnalysis) {
    return generateAmbient(currentPositionMs, audioFeatures);
  }
  
  const posSec = currentPositionMs / 1000;
  const segment = findCurrentEntity(audioAnalysis.segments, posSec);
  const beat = findCurrentEntity(audioAnalysis.beats, posSec);
  
  // If we have real analysis, use it
  return {
    isBeat: !!beat,
    beatIntensity: beat ? 1 : 0,
    pitches: segment ? segment.pitches : new Array(12).fill(0),
    timbre: segment ? segment.timbre : new Array(12).fill(0),
    loudness: segment ? segment.loudness_max : -60,
    isSimulated: false,
    tempo: audioFeatures?.tempo || 0
  };
};