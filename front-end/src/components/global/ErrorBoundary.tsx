import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  countdown: number;
}

class ErrorBoundaryClass extends Component<Props, State> {
  private countdownInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      countdown: 10
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      countdown: 10
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidMount() {
    this.startCountdown();
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (this.state.hasError && prevState.countdown !== this.state.countdown && this.state.countdown === 0) {
      this.handleRefresh();
    }
  }

  componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown = () => {
    this.countdownInterval = setInterval(() => {
      this.setState(prevState => ({
        countdown: prevState.countdown - 1
      }));
    }, 1000);
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Lỗi hệ thống</h1>
                <p className="text-gray-600 mb-6">Đã xảy ra lỗi không mong muốn trong hệ thống.</p>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-2">Tự động làm mới trong:</p>
                  <p className="text-2xl font-bold text-blue-600">{this.state.countdown} giây</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={this.handleRefresh}
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Làm mới ngay
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks with class component
const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary;
