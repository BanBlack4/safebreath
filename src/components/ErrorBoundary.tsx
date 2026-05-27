import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset: () => void;
  keyIdentifier: string;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorInfo: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error bound:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.keyIdentifier !== (this as any).props.keyIdentifier && (this as any).state.hasError) {
      (this as any).setState({ hasError: false, errorInfo: null });
    }
  }

  public render() {
    if ((this as any).state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 pt-24 h-[60vh] animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-[#f87171]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#071e27] dark:text-white">Algo salió mal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Ha ocurrido un error inesperado al cargar esta pantalla. Las funciones de monitoreo en segundo plano siguen activas.
            </p>
            {(this as any).state.errorInfo && (
              <p className="text-[10px] text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-xl border border-red-100 dark:border-red-900/30 truncate max-w-[280px]">
                {(this as any).state.errorInfo}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              (this as any).setState({ hasError: false, errorInfo: null });
              (this as any).props.onReset();
            }}
            className="mt-4 flex items-center justify-center gap-2 bg-[#00796b] text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition hover:bg-[#005e53] active:scale-95 cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
