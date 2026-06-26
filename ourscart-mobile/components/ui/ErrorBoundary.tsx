// =============================================================================
// Error boundary for React Native. Catches render-phase errors and shows a
// user-friendly fallback UI instead of a white screen crash.
//
// Integrates with Sentry to report the crash details for debugging. Wrap every
// tab screen's root View with this boundary so a crash in one screen doesn't
// take down the entire app.
// =============================================================================
import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { captureError } from '../../lib/monitoring';
import { FontSize, FontFamily } from '../../constants/typography';
import { Space } from '../../constants/spacing';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, {
      componentStack: info.componentStack,
      errorBoundary: true,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={56} color="#9B9792" />
          <Text style={styles.title}>
            {this.props.fallbackTitle || 'Something went wrong'}
          </Text>
          <Text style={styles.subtitle}>
            {this.props.fallbackSubtitle ||
              'The team has been notified. Please try again.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space[8],
    backgroundColor: '#F9F9F8',
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: '#1A1917',
    marginTop: Space[4],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: '#6B6862',
    marginTop: Space[2],
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },
  button: {
    marginTop: Space[6],
    paddingVertical: Space[3],
    paddingHorizontal: Space[8],
    backgroundColor: '#D97757',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
});
