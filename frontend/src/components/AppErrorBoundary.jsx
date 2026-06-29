import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold">পাতাটি দেখানো যাচ্ছে না</h1>
          <p className="text-sm text-muted-foreground mt-2">
            The error has been logged in the development console. Reload the page or return home.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 p-3 rounded-md bg-muted text-left text-xs whitespace-pre-wrap break-words">
              {this.state.error?.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-2 mt-5">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Reload
            </Button>
            <Button asChild><Link to="/">হোম</Link></Button>
          </div>
        </div>
      </div>
    );
  }
}
