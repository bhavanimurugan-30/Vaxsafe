import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    storage: 'bg-teal-50 text-teal-800 border-teal-200',
    transit: 'bg-sky-50 text-sky-800 border-sky-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    compromised: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    safe: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    normal: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    critical: 'bg-red-50 text-red-800 border-red-200 font-semibold',
    excursion: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
    quarantine: 'bg-purple-50 text-purple-900 border-purple-200 font-semibold',
    quarantine_review: 'bg-purple-50 text-purple-900 border-purple-200 font-semibold',
    discarded: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold'
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  // Determine variant automatically from status text if not specified
  let resolvedVariant = variant;
  if (typeof children === 'string') {
    const text = children.toLowerCase();
    if (text.includes('discard')) resolvedVariant = 'discarded';
    else if (text.includes('quarantine')) resolvedVariant = 'quarantine_review';
    else if (text.includes('storage')) resolvedVariant = 'storage';
    else if (text.includes('transit')) resolvedVariant = 'transit';
    else if (text.includes('deliver') || text.includes('received')) resolvedVariant = 'delivered';
    else if (text.includes('compromised')) resolvedVariant = 'compromised';
    else if (text.includes('safe') || text.includes('normal')) resolvedVariant = 'safe';
    else if (text.includes('critical')) resolvedVariant = 'critical';
    else if (text.includes('warn')) resolvedVariant = 'warning';
    else if (text.includes('excursion') || text.includes('breach')) resolvedVariant = 'excursion';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[resolvedVariant] || variants.default} ${sizes[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        resolvedVariant === 'discarded' ? 'bg-slate-500' :
        resolvedVariant === 'storage' ? 'bg-teal-500' :
        resolvedVariant === 'transit' ? 'bg-sky-500' :
        resolvedVariant === 'delivered' ? 'bg-emerald-500' :
        resolvedVariant === 'compromised' || resolvedVariant === 'critical' ? 'bg-rose-600' :
        resolvedVariant === 'warning' ? 'bg-amber-500' :
        resolvedVariant === 'excursion' ? 'bg-orange-500' :
        resolvedVariant === 'quarantine_review' || resolvedVariant === 'quarantine' ? 'bg-purple-600' :
        resolvedVariant === 'safe' || resolvedVariant === 'normal' ? 'bg-emerald-500' :
        'bg-slate-400'
      }`} />
      {children}
    </span>
  );
}
