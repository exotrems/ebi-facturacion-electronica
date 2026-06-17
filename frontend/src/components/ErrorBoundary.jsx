import React from 'react';

/**
 * ErrorBoundary - Captura errores de React y muestra UI amigable
 * Evita que la app se rompa completamente
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Algo salió mal</h2>
            <p>Se ha producido un error en la aplicación.</p>

            {this.state.error && (
              <details className="error-details">
                <summary>Ver detalles técnicos</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className="error-actions">
              <button className="btn-primary" onClick={this.handleReset}>
                🔄 Intentar de nuevo
              </button>
              <button className="btn-secondary" onClick={() => window.location.reload()}>
                🏠 Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
