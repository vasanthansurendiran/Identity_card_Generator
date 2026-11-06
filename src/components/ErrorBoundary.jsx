import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h5>Something went wrong</h5>
        <p className="mb-2">The page hit an unexpected error. Your imported data is still in memory.</p>
        <button className="btn btn-sm btn-outline-danger me-2" onClick={() => this.setState({ error: null })}>Try again</button>
        <a className="btn btn-sm btn-outline-secondary" href="#/dashboard" onClick={() => this.setState({ error: null })}>Back to dashboard</a>
      </div>
    );
  }
}
