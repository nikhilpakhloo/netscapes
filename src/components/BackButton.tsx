import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

export default function BackButton() {
  return (
    <Pressable onPress={() => router.back()}>
      <FontAwesome size={28} name="arrow-left" color="#ffffff" />
    </Pressable>
  );
}
