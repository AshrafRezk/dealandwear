import { Component } from 'react';
import { captureError } from '../lib/monitoring';
import i18n from '../i18n';
import { Button, EmptyState } from './primitives';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    captureError(error, { componentStack: info?.componentStack });
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <EmptyState
        icon="info"
        title={i18n.t('errors.boundaryTitle')}
        body={i18n.t('errors.boundaryBody')}
        action={
          <>
            <Button onClick={() => window.location.reload()}>{i18n.t('errors.reload')}</Button>
            <Button variant="secondary" href="/">
              {i18n.t('errors.goHome')}
            </Button>
          </>
        }
      />
    );
  }
}
