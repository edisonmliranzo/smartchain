import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    padding: '40px',
                    margin: '20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#ef4444'
                }}>
                    <h2 style={{ marginTop: 0, color: '#ef4444' }}>Something went wrong</h2>
                    <details style={{ whiteSpace: 'pre-wrap', color: '#fca5a5' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                            Error Details
                        </summary>
                        <p><strong>Error:</strong> {this.state.error?.message}</p>
                        <pre style={{
                            fontSize: '0.8rem',
                            overflow: 'auto',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '10px',
                            borderRadius: '8px'
                        }}>
                            {this.state.error?.stack}
                        </pre>
                        {this.state.errorInfo && (
                            <pre style={{
                                fontSize: '0.8rem',
                                overflow: 'auto',
                                background: 'rgba(0,0,0,0.3)',
                                padding: '10px',
                                borderRadius: '8px'
                            }}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '16px',
                            padding: '10px 20px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
