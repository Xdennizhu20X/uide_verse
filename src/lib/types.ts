export interface Project {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  avatar: string;
  date: string;
  category: string;
  technologies: string[];
  description: string;
  imageUrls: string[];
  website?: string;
  githubRepo?: string;
  developmentPdfUrl?: string;
  comments: Comment[];
  isEco: boolean;
  likes?: number;
  likedBy?: string[]; // URL del perfil del autor
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isUideStudent?: boolean;
  career?: string;
  skills?: string[];
  role?: 'student' | 'viewer';
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
  authorPhotoURL?: string;
  parentId?: string | null;
}