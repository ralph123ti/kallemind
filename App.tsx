import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView } from 'react-native';
import Navigation from './src/navigation';
import { initI18n } from './src/i18n';
import { AuthProvider } from './src/context/AuthContext';

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { error: Error | null; info: string };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, info: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info: info.componentStack || '' });
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: 'red', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            CRASH: {this.state.error.message}
          </Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>
            {this.state.error.stack}
          </Text>
          <Text style={{ color: '#aaa', fontSize: 10, marginTop: 20 }}>
            {this.state.info}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [i18nError, setI18nError] = useState<string | null>(null);

  useEffect(() => {
    initI18n()
      .then(() => setI18nReady(true))
      .catch((err) => {
        console.error('i18n init failed:', err);
        setI18nError(String(err?.message || err));
      });
  }, []);

  if (i18nError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 }}>
        <Text style={{ color: 'red', fontSize: 16 }}>i18n failed to initialize:</Text>
        <Text style={{ color: '#fff', marginTop: 10 }}>{i18nError}</Text>
      </View>
    );
  }

  if (!i18nReady) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#0d2137" />
          <Navigation />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
