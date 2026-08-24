import React from 'react';
import { Mail, ExternalLink, MessageCircle } from 'lucide-react';

interface SocialContactsProps {
  variant?: 'dark' | 'light' | 'compact' | 'login';
  className?: string;
}

// Custom SVGs for Instagram & Facebook brand logos
export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const SocialContacts: React.FC<SocialContactsProps> = ({
  variant = 'dark',
  className = ''
}) => {
  const contacts = [
    {
      id: 'ig',
      name: 'Instagram',
      handle: 'kay_umarella318',
      url: 'https://instagram.com/kay_umarella318',
      icon: <InstagramIcon className="w-4 h-4 text-pink-500 shrink-0" />,
      bgHover: 'hover:border-pink-500/50 hover:bg-pink-500/10',
      badgeColor: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white'
    },
    {
      id: 'fb',
      name: 'Facebook',
      handle: 'Kay Umarella',
      url: 'https://facebook.com/Kay Umarella',
      icon: <FacebookIcon className="w-4 h-4 text-blue-500 shrink-0" />,
      bgHover: 'hover:border-blue-500/50 hover:bg-blue-500/10',
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'email',
      name: 'Email',
      handle: 'thetakanome318@gmail.com',
      url: 'mailto:thetakanome318@gmail.com',
      icon: <Mail className="w-4 h-4 text-rose-500 shrink-0" />,
      bgHover: 'hover:border-rose-500/50 hover:bg-rose-500/10',
      badgeColor: 'bg-rose-600 text-white'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {contacts.map((c) => (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${c.name}: ${c.handle}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-slate-900/80 border-slate-700/80 text-slate-200 hover:text-white ${c.bgHover}`}
          >
            {c.icon}
            <span className="font-mono text-[10px]">{c.handle}</span>
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={`w-full space-y-2 ${className}`}>
        <div className="flex items-center gap-2 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Kontak & Media Sosial Pengembang / Admin</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
          {contacts.map((c) => (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-between transition-all group cursor-pointer ${c.bgHover}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`p-1.5 rounded-lg shrink-0 ${c.id === 'ig' ? 'bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 text-white' : c.id === 'fb' ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {c.id === 'ig' ? <InstagramIcon className="w-3.5 h-3.5" /> : c.id === 'fb' ? <FacebookIcon className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase leading-none">{c.name}</div>
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate font-mono mt-0.5">
                    {c.handle}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-[10px] font-extrabold text-teal-200/90 uppercase tracking-wider">
        Kontak & Sosmed Admin
      </div>
      <div className="space-y-1.5 text-xs">
        {contacts.map((c) => (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-xl bg-teal-950/60 hover:bg-teal-800/80 border border-teal-700/50 hover:border-teal-400 text-white transition-all group shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {c.icon}
              <span className="font-bold text-[11px] truncate text-white">{c.handle}</span>
            </div>
            <ExternalLink className="w-3 h-3 text-teal-300 group-hover:text-white shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
};
