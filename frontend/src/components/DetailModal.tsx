import React, { useEffect } from 'react';
import type { WPPost } from '../types/wordpress';
import { X, ExternalLink, CheckCircle2 } from 'lucide-react';

interface DetailModalProps {
  post: WPPost | null;
  onClose: () => void;
  onAction: (post: WPPost) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ post, onClose, onAction }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!post) return null;

  const title = post.title.rendered.replace(/&#038;/g, '&');
  const isCreator = post.categories.includes(3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isCreator ? 'Verified Grassroots Syndicate' : 'Corporate Sponsorship Brief'}</span>
          </span>
          <span className="text-xs font-mono text-slate-400">Post #{post.id} (WordPress)</span>
        </div>

        {/* Title */}
        <h2 id="modal-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
          {title}
        </h2>

        {/* Rendered WordPress HTML Content */}
        <div
          className="prose prose-invert prose-emerald max-w-none text-slate-300 text-sm leading-relaxed mb-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-slate-300"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />

        {/* Modal Actions */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <a
            href={`http://localhost:8881/wp-admin/post.php?post=${post.id}&action=edit`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            <span>Edit in WordPress Studio</span>
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onAction(post);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
            >
              {isCreator ? 'Initiate Sponsorship Offer' : 'Apply via Talent Scout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
