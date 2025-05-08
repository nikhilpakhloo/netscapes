import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'google' | 'link';
  loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, style, disabled, ...props }: ButtonProps) {
  const buttonStyles = [
    styles.button,
    variant === 'google' && styles.googleButton,
    variant === 'link' && styles.linkButton,
    disabled && styles.disabledButton,
    style
  ];

  const textStyles = [
    styles.text,
    variant === 'link' && styles.linkText,
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'link' ? '#0066ff' : '#fff'} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0066ff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleButton: {
    backgroundColor: '#db4437'
  },
  linkButton: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 0
  },
  disabledButton: {
    opacity: 0.6
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  linkText: {
    color: '#0066ff'
  },
  disabledText: {
    opacity: 0.6
  }
});