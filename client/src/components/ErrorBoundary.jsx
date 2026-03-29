import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 40, textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😵</div>
          <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Đã xảy ra lỗi</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>
            {this.state.error?.message || 'Một lỗi không mong muốn đã xảy ra.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
