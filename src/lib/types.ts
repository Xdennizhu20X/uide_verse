export interface Project {
  id: string;
  title: string;
  author: string;
  avatar: string;
  date: string;
  category: string;
  technologies: string[];
  description: string;
  images: string[];
  comments: { id: string; author: string; text: string }[];
  isEco: boolean;
}
