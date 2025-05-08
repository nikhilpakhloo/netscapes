
import { getApp } from '@react-native-firebase/app';
import { getAuth, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';

const useGoogleAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const configureGoogleSignin = () => {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: true,
      });
    };

    configureGoogleSignin();
  }, []);

  const googleAuth = async () => {
    setLoading(true);
    setError(null);

    const auth = getAuth(getApp());

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      await GoogleSignin.signIn();

      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('No ID token found');
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await auth.signInWithCredential(googleCredential);

      setUser(userCredential.user);
    } catch (err: unknown) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.IN_PROGRESS:
            setError('Sign-in in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Play services not available');
            break;
          default:
            setError('Google Sign-In Error: ' + (err.message || err));
        }
      } else {
        setError('Unexpected Error: ' + (err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { googleAuth, user, loading, error };
};

export { useGoogleAuth };

