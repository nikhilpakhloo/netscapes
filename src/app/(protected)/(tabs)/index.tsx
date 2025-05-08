import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PostService } from '../../../services/PostService';
import { Post } from '../../../types/post';

const POSTS_STORAGE_KEY = 'local-posts';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load posts from local storage
  const loadLocalPosts = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (jsonValue !== null) {
        const localPosts = JSON.parse(jsonValue);
        setPosts(localPosts);
      }
    } catch (error) {
      console.error('Error loading local posts:', error);
    }
  };

  // Save posts to local storage
  const saveLocalPosts = async (postsToSave: Post[]) => {
    try {
      const jsonValue = JSON.stringify(postsToSave);
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving local posts:', error);
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      // First load from local storage to show something immediately
      await loadLocalPosts();
      
      const snapshot = await firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get();

      const postsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const postData = doc.data();
          
          // Only get comment count instead of fetching all comments
          const commentsSnapshot = await firestore()
            .collection('posts')
            .doc(doc.id)
            .collection('comments')
            .count()
            .get();

          return {
            id: doc.id,
            ...postData,
            comments: [],
            commentCount: commentsSnapshot.data().count,
          } as Post;
        })
      );

      setPosts(postsData);
      // Save the fetched posts to local storage
      saveLocalPosts(postsData);
    } catch (error) {
      console.error('Feed error:', error);
      // If fetching fails, we'll still have local posts displayed
    }
  }, []);

  useEffect(() => {
    // First try to load from local storage
    loadLocalPosts().then(() => {
      // Then fetch from Firestore
      fetchPosts().finally(() => setLoading(false));
    });

    const unsubscribe = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot(async (snapshot) => {
        const postsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const postData = doc.data();
            
            // Only get comment count instead of fetching all comments
            const commentsSnapshot = await firestore()
              .collection('posts')
              .doc(doc.id)
              .collection('comments')
              .count()
              .get();

            return {
              id: doc.id,
              ...postData,
              comments: [],
              commentCount: commentsSnapshot.data().count,
            } as Post;
          })
        );
        setPosts(postsData);
        // Save updated posts to local storage
        saveLocalPosts(postsData);
      });

    return () => unsubscribe();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) return;
      await PostService.toggleLike(postId, userId);
      
      // Update local storage after like
      const updatedPosts = [...posts];
      const postIndex = updatedPosts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        const post = updatedPosts[postIndex];
        const userLiked = post.likedBy?.includes(userId);
        
        if (userLiked) {
          updatedPosts[postIndex] = {
            ...post,
            likes: post.likes - 1,
            likedBy: post.likedBy.filter(id => id !== userId)
          };
        } else {
          updatedPosts[postIndex] = {
            ...post,
            likes: post.likes + 1,
            likedBy: [...(post.likedBy || []), userId]
          };
        }
        
        setPosts(updatedPosts);
        saveLocalPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const renderPost = ({ item: post }: { item: Post }) => (
    <View style={styles.post}>
      <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
        <Image source={{ uri: post.mediaUrl }} style={styles.media} />
        <Text style={styles.caption}>{post.caption}</Text>
      </TouchableOpacity>

      <View style={styles.interactions}>
        <TouchableOpacity style={styles.interactionButton} onPress={() => handleLike(post.id)}>
          <Icon
            name={
              post.likedBy?.includes(getAuth().currentUser?.uid || '')
                ? 'heart'
                : 'heart-outline'
            }
            size={24}
            color={
              post.likedBy?.includes(getAuth().currentUser?.uid || '') ? '#ff3b30' : '#666'
            }
          />
          <Text style={styles.interactionText}>{post.likes} likes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => router.navigate(`/post/${post.id}`)}
        >
          <Icon name="comment-outline" size={24} color="#666" />
          <Text style={styles.interactionText}>
            {post.commentCount || 0} comments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(post) => post.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066ff']} />
        }
        contentContainerStyle={styles.listContent}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 10, paddingBottom: 80 },
  post: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5,
  },
  media: { width: '100%', height: 300, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  caption: { padding: 15, fontSize: 16 },
  interactions: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  interactionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  interactionText: { marginLeft: 5, color: '#666', fontSize: 14 },
  commentSection: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentContainer: { marginBottom: 10 },
  commentText: { fontSize: 14, marginBottom: 5 },
  replyButton: { alignSelf: 'flex-start' },
  replyButtonText: { color: '#666', fontSize: 12 },
  replyContainer: {
    marginLeft: 20,
    marginTop: 5,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  replyText: { fontSize: 14 },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  replyingToText: { color: '#666', marginRight: 10 },
  commentInput: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: { marginLeft: 10 },
});
