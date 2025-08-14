import { projects as hardcodedProjects } from '@/lib/data';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { ProjectDetails } from '@/components/project-details';

export default async function ProjectDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const id = params.id;
  let project: Project | undefined | null = hardcodedProjects.find(p => p.id === id);

  if (!project) {
    const projectDoc = await getDoc(doc(db, 'projects', id));

    if (projectDoc.exists()) {
      const data = projectDoc.data();
      project = {
        id: projectDoc.id,
        title: data.title,
        author: data.authors ? data.authors.join(', ') : 'Unknown',
        avatar: data.avatar || 'https://placehold.co/40x40.png',
        date: new Date().toISOString().split('T')[0], // Current date
        category: data.category === 'Otro' ? data.otherCategory : data.category,
        technologies: Array.isArray(data.technologies) ? data.technologies : (data.technologies || '').split(',').map((t: string) => t.trim()),
        description: data.description,
        imageUrls: data.imageUrls || [],
        website: data.website,
        githubRepo: data.githubRepo,
        developmentPdfUrl: data.developmentPdfUrl,
        comments: [], // Comments will be fetched client-side
        isEco: data.isEcological || false,
      };
    }
  }

  if (!project) {
    notFound();
  }

  return <ProjectDetails project={project} />;
}
