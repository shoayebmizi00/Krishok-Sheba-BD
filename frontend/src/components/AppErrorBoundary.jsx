import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const errorBoundaryText = {
  bn: {
    title: 'পাতাটি দেখানো যাচ্ছে না',
    description: 'সমস্যাটি ডেভেলপমেন্ট কনসোলে লগ করা হয়েছে। পাতাটি রিলোড করুন অথবা হোমে ফিরে যান।',
    reload: 'রিলোড',
    home: 'হোম',
  },
  en: {
    title: 'The page cannot be displayed',
    description: 'The error has been logged in the development console. Reload the page or return home.',
    reload: 'Reload',
    home: 'Home',
  },
};

function getText() {
  const lang = document.documentElement.dataset.language === 'en' ? 'en' : 'bn';
  return errorBoundaryText[lang];
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[KRISHOK-SHEBA] Page render failed', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const text = getText();

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold">{text.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {text.description}
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 p-3 rounded-md bg-muted text-left text-xs whitespace-pre-wrap break-words">
              {this.state.error?.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-2 mt-5">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" /> {text.reload}
            </Button>
            <Button asChild><Link to="/">{text.home}</Link></Button>
          </div>
        </div>
      </div>
    );
  }
}
