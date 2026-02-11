
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { ProjectDetails } from '@/components/project-details';

export default async function ProjectDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const id = params.id;
  // Try to fetch from Firestore directly
  let project: Project | undefined | null = null;

  const projectDoc = await getDoc(doc(db, 'projects', id));

  if (projectDoc.exists()) {
    const data = projectDoc.data();
    const authors = data.authors || [];
    let authorId = '';

    if (authors.length > 0) {
      const usersQuery = query(collection(db, 'users'), where('email', '==', authors[0]));
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        authorId = usersSnapshot.docs[0].id;
      }
    }

    project = {
      id: projectDoc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      otherCategory: data.otherCategory,
      technologies: Array.isArray(data.technologies) ? data.technologies : (data.technologies || '').split(',').map((t: string) => t.trim()),
      imageUrls: data.imageUrls || [],
      website: data.website,
      githubRepo: data.githubRepo,
      developmentPdfUrl: data.developmentPdfUrl,
      likes: data.likes || 0,
      likedBy: data.likedBy || [],
      views: data.views || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0], // Fallback display date
      authors: data.authors,
      authorNames: data.authorNames,
      author: data.authorNames ? data.authorNames.join(', ') : (data.authors ? data.authors.join(', ') : 'Unknown'),
      authorId: authorId,
      avatar: data.avatar || 'https://placehold.co/40x40.png',
      isEco: data.isEcological || false,
      comments: [],
    };
  }

  if (!project) {
    notFound();
  }

  return <ProjectDetails project={project} />;
}
