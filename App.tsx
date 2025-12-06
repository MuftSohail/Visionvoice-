import React, { useState, useRef, useEffect } from 'react';
import { AppMode, AnalysisResult } from './types';
import { analyzeImage, synthesizeSpeech } from './services/geminiService';
import BigButton from './components/BigButton';
import CameraCapture from './components/CameraCapture';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async (buffer: AudioBuffer) => {
    stopAudio(); // Stop any current playback
    
    // Resume context if needed (browser autoplay policy)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    sourceRef.current = source;
    source.start();
    setIsPlaying(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handleImageInput = async (base64Image: string) => {
    setMode(AppMode.PROCESSING);
    try {
      // 1. Analyze Image
      const description = await analyzeImage(base64Image);
      
      // 2. Synthesize Speech
      const audioBuffer = await synthesizeSpeech(description);

      setResult({
        imageUrl: base64Image,
        description,
        audioBuffer
      });
      
      setMode(AppMode.RESULT);
      
      // Auto-play the result
      playAudio(audioBuffer);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
      setMode(AppMode.ERROR);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleImageInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetApp = () => {
    stopAudio();
    setResult(null);
    setMode(AppMode.HOME);
    setErrorMsg('');
  };

  // --- Render Views ---

  if (mode === AppMode.CAMERA) {
    return <CameraCapture onCapture={handleImageInput} onCancel={() => setMode(AppMode.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <header className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center z-10">
        <h1 className="text-3xl font-bold text-yellow-400 tracking-wider">VisionVoice</h1>
        {mode !== AppMode.HOME && (
          <button 
            onClick={resetApp}
            className="text-white font-bold p-2 focus:ring-4 focus:ring-yellow-400 rounded-lg"
            aria-label="Go Home"
          >
            🏠
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        
        {/* HOME VIEW */}
        {mode === AppMode.HOME && (
          <div className="flex flex-col space-y-8 flex-1 justify-center">
            <p className="text-center text-xl text-slate-300 mb-4" aria-live="polite">
              Select an option to describe your surroundings.
            </p>
            
            <BigButton 
              label="Take Photo" 
              onClick={() => setMode(AppMode.CAMERA)} 
              icon={<span>📷</span>} 
            />
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload Photo from Gallery"
              />
              <BigButton 
                label="Pick from Gallery" 
                onClick={() => {}} // Handled by input overlay
                icon={<span>🖼️</span>}
                variant="secondary"
              />
            </div>
          </div>
        )}

        {/* PROCESSING VIEW */}
        {mode === AppMode.PROCESSING && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
            <div className="text-8xl">🤔</div>
            <h2 className="text-3xl font-bold text-yellow-400">Analyzing...</h2>
            <p className="text-xl text-slate-300">Please wait while I look at the image.</p>
          </div>
        )}

        {/* ERROR VIEW */}
        {mode === AppMode.ERROR && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="text-8xl">⚠️</div>
            <h2 className="text-3xl font-bold text-red-500">Error</h2>
            <p className="text-xl text-slate-300">{errorMsg}</p>
            <BigButton label="Try Again" onClick={resetApp} variant="secondary" />
          </div>
        )}

        {/* RESULT VIEW */}
        {mode === AppMode.RESULT && result && (
          <div className="flex flex-col space-y-6">
            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden shadow-lg border-2 border-slate-700">
              <img 
                src={result.imageUrl} 
                alt="Captured content" 
                className="object-contain w-full h-full" 
              />
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2 uppercase">Description</h3>
              <p className="text-xl leading-relaxed">{result.description}</p>
            </div>

            <div className="sticky bottom-0 pb-4 pt-2 bg-slate-900">
              {result.audioBuffer && (
                <BigButton 
                  label={isPlaying ? "Stop Audio" : "Replay Audio"}
                  onClick={() => isPlaying ? stopAudio() : playAudio(result.audioBuffer!)}
                  icon={<span>{isPlaying ? '⏹️' : '🔊'}</span>}
                  variant={isPlaying ? 'danger' : 'primary'}
                />
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
