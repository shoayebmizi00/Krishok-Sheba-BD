import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';

export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  const t = useTranslation();
  return <div className="relative">
    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
    <Input {...props} type={visible ? 'text' : 'password'} className={`pl-10 pr-11 h-12 ${className}`} />
    <button type="button" onClick={() => setVisible((value) => !value)} aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
    </button>
  </div>;
}
