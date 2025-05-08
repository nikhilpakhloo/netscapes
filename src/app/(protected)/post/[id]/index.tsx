import { Comment, Post } from '@/src/types/post';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BackButton from '../../../../components/BackButton'; // Import the BackButton component
import { PostService } from '../../../../services/PostService';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const doc = await firestore().collection('posts').doc(id).get();
        const postData = doc.data();

        if (postData) {
          const commentsSnapshot = await firestore()
            .collection('posts')
            .doc(doc.id)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .get();

          const comments = commentsSnapshot.docs.map((commentDoc) => ({
            id: commentDoc.id,
            postId: doc.id,
            ...commentDoc.data(),
          }));

          setPost({ id: doc.id, ...postData, comments } as Post);
        }
      } catch (error) {
        console.error('Post fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Set up real-time listener for comments independent of post state
    const unsubscribe = firestore()
      .collection('posts')
      .doc(id as string)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          postId: id as string,
          ...doc.data()
        })) as Comment[];
        
        setPost(prevPost => prevPost ? {...prevPost, comments} : null);
      });

    return () => unsubscribe();
  }, [id]);

  const handleComment = async () => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId || !newComment.trim() || !id) return;

      await PostService.addComment({
        postId: id as string,
        userId,
        text: newComment,
        createdAt: new Date(),
      });

      setNewComment('');
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleReply = async () => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId || !replyText.trim() || !replyingTo || !id) return;

      await PostService.addReply({
        commentId: replyingTo.id,
        postId: id as string,
        userId,
        text: replyText,
        createdAt: new Date(),  // This is fine as it's passed to the function
      });

      // Reset reply state
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const renderComment = ({ item: comment }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>User {comment.userId.substring(0, 4)}</Text>
        <Text style={styles.commentTime}>{comment.createdAt?.toDate?.() ? new Date(comment.createdAt.toDate()).toLocaleString() : 'Just now'}</Text>
      </View>
      
      <Text style={styles.commentText}>{comment.text}</Text>
      
      <TouchableOpacity 
        style={styles.replyButton} 
        onPress={() => startReply(comment)}
      >
        <Text style={styles.replyButtonText}>Reply</Text>
      </TouchableOpacity>
      
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          <Text style={styles.repliesHeader}>Replies ({comment.replies.length})</Text>
          {comment.replies.map((reply) => (
            <View key={reply.id} style={styles.replyContainer}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyAuthor}>User {reply.userId.substring(0, 4)}</Text>
                <Text style={styles.replyTime}>{reply.createdAt?.toDate?.() ? new Date(reply.createdAt.toDate()).toLocaleString() : 'Just now'}</Text>
              </View>
              <Text style={styles.replyText}>{reply.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#0066ff" />;

  if (!post) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Post not found</Text>;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}    >
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: post.mediaUrl }} style={styles.media} />
            <View style={styles.backButtonContainer}>
              <BackButton />
            </View>
          </View>
          <Text style={styles.caption}>{post.caption}</Text>
          
          <View style={styles.commentsSection}>
            <Text style={styles.commentsHeader}>Comments</Text>
            
            {post.comments && post.comments.length > 0 ? (
              post.comments.map(comment => renderComment({ item: comment }))
            ) : (
              <Text style={styles.noComments}>No comments yet</Text>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed comment input at bottom */}
        {replyingTo ? (
          <View style={styles.fixedInputContainer}>
            <Text style={styles.replyingToText}>Replying to: {replyingTo.text.substring(0, 30)}{replyingTo.text.length > 30 ? '...' : ''}</Text>
            <View style={styles.replyInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a reply..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                placeholderTextColor="#ccc"

              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleReply}
              >
                <Icon name="send" size={24} color="#0066ff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelReply}
              >
                <Icon name="close" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.fixedInputContainer}>
            <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              placeholderTextColor="#ccc"

            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleComment}
            >
              <Icon name="send" size={24} color="#0066ff" />
            </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  media: { width: '100%', height: 300 },
  backButtonContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  caption: { padding: 15, fontSize: 16 },
  commentsSection: { padding: 15 },
  commentsHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  commentContainer: { marginBottom: 15, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  commentText: { fontSize: 14, flex: 1 },
  replyButton: { paddingHorizontal: 8, paddingVertical: 4 },
  replyButtonText: { fontSize: 12, color: '#0066ff' },
  replyContainer: { marginLeft: 20, marginTop: 5, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  replyText: { fontSize: 13 },
  noComments: { fontStyle: 'italic', color: '#666', textAlign: 'center', padding: 20 },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  replyInputContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: { marginLeft: 10 },
  cancelButton: { marginLeft: 5 },
  commentAuthor: { fontWeight: 'bold', fontSize: 14 },
  commentTime: { fontSize: 12, color: '#666' },
  repliesContainer: { 
    marginTop: 10,
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
    paddingLeft: 10 
  },
  repliesHeader: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 5,
    fontWeight: 'bold' 
  },
  replyHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 2 
  },
  replyAuthor: { fontWeight: 'bold', fontSize: 13 },
  replyTime: { fontSize: 11, color: '#666' },
  fixedInputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
});
