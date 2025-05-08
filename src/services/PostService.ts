import { arrayRemove, arrayUnion, getFirestore, increment, serverTimestamp } from '@react-native-firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { Comment, Post, Reply } from '../types/post';

export class PostService {
  static async uploadMedia(uri: string, mediaType: 'image' | 'video'): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  }

  static async createPost(post: Omit<Post, 'id' | 'likes' | 'likedBy'>): Promise<string> {
    const postData = {
      ...post,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp()
    };

    const db = getFirestore();
    const docRef = await db.collection('posts').add(postData);
    return docRef.id;
  }

  static async toggleLike(postId: string, userId: string): Promise<void> {
    const db = getFirestore();
    const postRef = db.collection('posts').doc(postId);
    const post = await postRef.get();
    const postData = post.data() as Post;

    if (postData.likedBy.includes(userId)) {
      await postRef.update({
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
    } else {
      await postRef.update({
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
    }
  }

  static async addComment(comment: Omit<Comment, 'id' | 'replies'>): Promise<string> {
    const commentData = {
      ...comment,
      replies: [],
      createdAt: serverTimestamp()
    };

    const db = getFirestore();
    const docRef = await db.collection('posts')
      .doc(comment.postId)
      .collection('comments')
      .add(commentData);
    return docRef.id;
  }

  static async addReply(reply: Omit<Reply, 'id'> & { postId: string }): Promise<string> {
    // Generate a unique ID for the reply
    const replyId = getFirestore().collection('replies').doc().id;
    
    // First, get the current timestamp as a JavaScript Date
    const now = new Date();
    
    const replyData = {
      id: replyId,
      commentId: reply.commentId,
      userId: reply.userId,
      text: reply.text,
      createdAt: now  // Use JavaScript Date instead of serverTimestamp()
    };

    const db = getFirestore();
    // Get the comment document
    const commentRef = db.collection('posts')
      .doc(reply.postId)
      .collection('comments')
      .doc(reply.commentId);
    
    // Add the reply to the comment's replies array
    await commentRef.update({
      replies: arrayUnion(replyData)
    });
    
    return replyId;
  }
}