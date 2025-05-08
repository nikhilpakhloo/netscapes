import { createUserWithEmailAndPassword, getAuth } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

type AuthError = {
  code: string;
  message: string;
};

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the Google Auth hook
  const { googleAuth, loading: googleLoading, error: googleError } = useGoogleAuth();

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/(protected)/(tabs)');
    } catch (err) {
      const firebaseError = err as AuthError;
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('Email already in use');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await googleAuth();
      router.replace('/(protected)/(tabs)');
    } catch (err) {
      // The hook already handles errors, but we can add additional handling here if needed
      console.error('Additional Google signup error handling:', err);
    }
  };

  // Use either the component's error state or the Google auth error
  const displayError = error || googleError;
  // Use either the component's loading state or the Google auth loading state
  const isLoading = loading || googleLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          placeholderTextColor="#ccc"

        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          placeholderTextColor="#ccc"

        />
        
        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}
        
        <Button
          title="Sign Up"
          onPress={handleRegister}
          loading={isLoading}
          disabled={!email || !password || isLoading}
        />
        
        <Button
          title="Sign up with Google"
          variant="google"
          onPress={handleGoogleSignup}
          disabled={isLoading}
        />
        
        <Button
          title="Already have an account? Log in"
          variant="link"
          onPress={() => router.navigate('/login')}
          disabled={isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  form: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center'
  }
});