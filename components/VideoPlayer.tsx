import React from 'react';
import { Capsule } from '../types';
import { PlayCircle } from 'lucide-react';

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

  // Determine if it's a direct file or an embed needed (simplified logic)
  const isDirectFile = capsule.videoUrl?.endsWith('.mp4');

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg ring-1 ring-black/10">
        {capsule.videoUrl ? (
          isDirectFile ? (
            <video
              src={capsule.videoUrl}
              controls
              className="w-full h-full object-contain"
              autoPlay={false}
            />
          ) : (
            <iframe
              src={capsule.videoUrl} // Assuming user puts embeddable URLs
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white flex-col p-8 text-center">
            <p className="text-xl font-semibold mb-2">Vidéo non hébergée</p>
            <p className="text-slate-400 text-sm max-w-md">
              Pour voir cette vidéo, vous devez ajouter l'URL de votre hébergeur (Vimeo, YouTube, S3) dans le fichier <code>services/courseData.ts</code>.
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