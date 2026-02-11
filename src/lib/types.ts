
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  otherCategory?: string;
  technologies: string[];
  imageUrls: string[];
  website?: string;
  githubRepo?: string;
  developmentPdfUrl?: string;
  likes: number;
  likedBy?: string[];
  views?: number;
  createdAt: string;
  date?: string; // For display
  authors?: string[];
  authorNames?: string[]; // Names of the authors
  author?: string; // Display name
  authorId?: string;
  avatar?: string;
  isEco?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rejectionMessage?: string;
  comments: Comment[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  authorPhotoURL: string;
  createdAt: any; // Date | Timestamp | string
  parentId?: string | null;
  projectId?: string;
  likes?: number;
}

export interface Collaboration {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  skills: string[];
  projectName?: string;
  status: 'open' | 'closed';
  requests?: number;
  createdAt: any;
}

export interface CollaborationRequest {
  id: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  contactInfo?: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  tag: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  createdAt: any;
  editedAt?: any;
  isEdited?: boolean;
  repliesCount: number;
  lastReplyAt: any;
  likes: number;
  likedBy: string[];
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rejectionMessage?: string;
}

export interface ForumReply {
  id: string;
  topicId: string;
  content: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  createdAt: any;
  editedAt?: any;
  isEdited?: boolean;
  likes: number;
  likedBy: string[];
  parentId?: string | null;
  replyToAuthor?: string;
}
export interface Notification {
  id: string;
  recipientId: string;
  type: 'collaboration' | 'like' | 'comment' | 'badge' | 'project_invite';
  title: string;
  message: string;
  avatar?: string;
  read: boolean;
  createdAt: any;
  collaborationId?: string; // Can be projectId for collaborations
  topicId?: string; // For forum/project links
}