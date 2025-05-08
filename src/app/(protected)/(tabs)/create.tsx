import { getAuth } from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '../../../components/Button';
import { PostService } from '../../../services/PostService';

export default function Create() {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!mediaUri) return;
    
    setLoading(true);
    try {
      const mediaUrl = await PostService.uploadMedia(mediaUri, 'image');
      const userId = getAuth().currentUser?.uid;
      
      if (!userId) throw new Error('User not authenticated');

      await PostService.createPost({
        userId,
        mediaUrl,
        mediaType: 'image',
        caption,
        createdAt: new Date()
      });

      setMediaUri(null);
      setCaption('');
      router.replace('/(protected)/(tabs)');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        {!mediaUri ? (
          <TouchableOpacity 
            style={styles.imagePicker} 
            onPress={pickImage}
            disabled={loading}
          >
            <Icon name="image-plus" size={40} color="#666" />
            <Text style={styles.imagePickerText}>Add Photo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: mediaUri }} style={styles.preview} />
            <TouchableOpacity 
              style={styles.changeImageButton}
              onPress={pickImage}
              disabled={loading}
            >
              <Icon name="camera" size={20} color="#fff" />
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Write a caption..."
          placeholderTextColor="#666"
          value={caption}
          onChangeText={setCaption}
          multiline
          editable={!loading}
          maxLength={2200}
        />
        
        <Button
          title="Share Post"
          onPress={handlePost}
          loading={loading}
          disabled={!mediaUri || loading}
          style={styles.shareButton}
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
    justifyContent: 'space-between'
  },
  imagePicker: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed'
  },
  imagePickerText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 15
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 15,
    marginVertical: 20,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  shareButton: {
    height: 50,
    borderRadius: 25,
    marginTop: 10
  }
});