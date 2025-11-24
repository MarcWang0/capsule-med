import React from 'react';
import { Capsule } from '../types';
import { PlayCircle, Clock } from 'lucide-react';

interface VideoPlayerProps {
  capsule: Capsule | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ capsule }) => {
  if (!capsule) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <PlayCircle size={64} className="mb-4 opacity-50" />
        <p className="font-medium">Sélectionnez une capsule pour commencer</p>
      </div>
    );
  }

  // Robust URL parser
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // If it's already an embed link (like from the iframe src), use it directly
    if (url.includes('youtube.com/embed/')) {
        return url;
    }

    // Handle youtu.be/ID
    if (url.includes('youtu.be/')) {
        return url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    
    // Handle youtube.com/watch?v=ID
    if (url.includes('youtube.com/watch?v=')) {
        return url.replace('watch?v=', 'embed/');
    }

    return url;
  };

  const finalVideoUrl = capsule.videoUrl ? getEmbedUrl(capsule.videoUrl) : undefined;
  const isDirectFile = finalVideoUrl?.endsWith('.mp4');

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg ring-1 ring-black/10">
        {finalVideoUrl ? (
          isDirectFile ? (
            <video
              src={finalVideoUrl}
              controls
              className="w-full h-full object-contain"
              autoPlay={false}
            />
          ) : (
            <iframe
              src={finalVideoUrl}
              className="w-full h-full"
              title={capsule.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 flex-col p-8 text-center border border-slate-200">
            <Clock size={48} className="text-slate-400 mb-4" />
            <p className="text-xl font-bold text-slate-700 mb-2">Bientôt disponible</p>
            <p className="text-slate-500 text-sm max-w-md">
              Cette capsule de cours est en cours de préparation. Revenez très vite !
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded uppercase tracking-wide">
                {capsule.subject}
            </span>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-slate-500 text-sm font-medium">
                {capsule.theme}
            </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{capsule.title}</h1>
        <p className="text-slate-600 leading-relaxed">
            {capsule.description || "Regardez cette capsule pour maîtriser les concepts clés de ce chapitre. Utilisez le chat IA à droite pour poser vos questions en temps réel."}
        </p>
      </div>
    </div>
  );
};

export default VideoPlayer;