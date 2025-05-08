import { getAuth } from '@react-native-firebase/auth';
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null; 
  }

  if (!isLoggedIn) {
    return <Redirect href={"/login"}/>
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
      <Stack.Screen name="post/[id]/index" options={{headerShown: false}}/>
    </Stack>
  );
}
