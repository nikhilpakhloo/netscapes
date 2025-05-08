type Post = {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  comments?: Comment[];
  commentCount?: number;
};

type Comment = {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: Date;
  replies: Reply[];
};

type Reply = {
  id: string;
  commentId: string;
  userId: string;
  text: string;
  createdAt: Date;
};


export type { Comment, Post, Reply };

