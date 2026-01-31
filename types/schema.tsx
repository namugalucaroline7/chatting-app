// 🔥 USER
export interface User {
  id: string; // same as Firebase Auth UID
  username: string;
  email: string;
  profilePic: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: any; // Firestore Timestamp
}

//////////////////////////////////////////////////////

// 🖼 POST
export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: any;
}

//////////////////////////////////////////////////////

// 💬 COMMENT
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: any;
}

//////////////////////////////////////////////////////

// ❤️ LIKE
export interface Like {
  userId: string;
  likedAt: any;
}

//////////////////////////////////////////////////////

// 🔁 FOLLOW
export interface Follow {
  followerId: string;
  followingId: string;
  followedAt: any;
}

//////////////////////////////////////////////////////

// 📖 STORY (for later)
export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: any;
  expiresAt: any; // 24hrs later
}

//////////////////////////////////////////////////////

// 🔔 NOTIFICATION
export interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  fromUserId: string;
  postId?: string; // only for like/comment
  read: boolean;
  createdAt: any;
}
