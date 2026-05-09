import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Video, Square, Download, Send } from 'lucide-react';

interface VideoRecorderProps {
  onClose: () => void;
}

export default function VideoRecorder({ onClose }: VideoRecorderProps) {
  const [step, setStep] = useState<'intro' | 'camera' | 'recording' | 'preview'>('intro');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep('camera');
    } catch (err) {
      console.error("Error accessing media devices.", err);
      alert("No se pudo acceder a la cámara o micrófono.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };

    mediaRecorder.onstop = () => {
      // Will handle in useEffect or directly here
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setStep('recording');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && step === 'recording') {
      mediaRecorderRef.current.stop();
      stopCamera();
      setStep('preview');
    }
  };

  // Generate video URL when chunks change and recording stopped
  React.useEffect(() => {
    if (step === 'preview' && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    }
  }, [step, recordedChunks]);

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `jcmc-radio-mensaje-${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
    >
      <button 
        onClick={handleClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-md flex flex-col items-center gap-8">
        
        {step === 'intro' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)]">
              <Camera size={48} className="text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-light text-white">Graba tu Mensaje</h2>
              <ul className="text-left text-white/70 space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                <li className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">1</span>
                  Toca para abrir la cámara
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">2</span>
                  Selecciona el icono de la cámara
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">3</span>
                  Toca el botón de grabación
                </li>
              </ul>
            </div>
            <button
              onClick={startCamera}
              className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg"
            >
              Comenzar
            </button>
          </motion.div>
        )}

        {(step === 'camera' || step === 'recording') && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="relative w-full aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {step === 'recording' && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Grabando</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center h-24">
              {step === 'camera' ? (
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-red-500 border-4 border-white/20 hover:scale-110 hover:bg-red-600 transition-all flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                >
                  <Video size={24} className="text-white" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-white border-4 border-white/20 hover:scale-110 transition-all flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                  <Square size={24} className="text-black fill-black" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 'preview' && videoUrl && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="w-full aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <video 
                src={videoUrl} 
                controls 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="grid grid-cols-2 w-full gap-4">
              <button
                onClick={() => {
                  setStep('intro');
                  setVideoUrl(null);
                  setRecordedChunks([]);
                }}
                className="py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all"
              >
                Reintentar
              </button>
              <button
                onClick={downloadVideo}
                className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                <Download size={18} />
                Guardar
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
