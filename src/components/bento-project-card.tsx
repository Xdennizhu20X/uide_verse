'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { ArrowRight, Heart, Leaf, MessageSquare, Eye, Calendar } from 'lucide-react';
import { ClientAvatar } from './client-avatar';
import { motion } from 'framer-motion';

interface BentoProjectCardProps {
    project: Project;
    size?: 'small' | 'medium' | 'large' | 'wide' | 'tall';
    index?: number;
}

export function BentoProjectCard({ project, size = 'medium', index = 0 }: BentoProjectCardProps) {
    // Format date for better readability
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-EC', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const firstAuthor = project.author ? project.author.split(',')[0].trim() : 'Autor desconocido';
    const displayAuthor = firstAuthor.split('@')[0];

    // Size-based classes for bento grid
    const sizeClasses = {
        small: 'md:col-span-1 md:row-span-1',
        medium: 'md:col-span-1 md:row-span-1',
        large: 'md:col-span-2 md:row-span-2',
        wide: 'md:col-span-2 md:row-span-1',
        tall: 'md:col-span-1 md:row-span-2',
    };

    const isLarge = size === 'large' || size === 'wide' || size === 'tall';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={sizeClasses[size]}
        >
            <Link
                href={`/projects/${project.id}`}
                className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl"
                aria-label={`Ver proyecto: ${project.title}`}
            >
                <div className={`
               relative h-full min-h-[280px] overflow-hidden rounded-3xl 
               bg-white dark:bg-[#152a58] 
               border-2 border-slate-100 dark:border-[#1e3a6d]
               shadow-xl hover:shadow-2xl
               transition-all duration-500 
               hover:-translate-y-2 hover:border-primary/50
               ${size === 'tall' ? 'min-h-[580px]' : ''}
               ${size === 'large' ? 'min-h-[580px]' : ''}
            `}>
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src={project.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                            alt={`Imagen del proyecto ${project.title}`}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            priority={index < 3}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2 z-10">
                        <Badge className="bg-white/90 dark:bg-[#0A1A3C]/90 backdrop-blur-md text-[#0A1A3C] dark:text-white shadow-lg border-0 font-semibold px-3 py-1">
                            {project.category}
                        </Badge>
                        {project.isEco && (
                            <Badge className="bg-emerald-500/90 backdrop-blur-md text-white shadow-lg border-0 font-semibold px-3 py-1">
                                <Leaf className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                Ecológico
                            </Badge>
                        )}
                    </div>

                    {/* Stats - Top Right */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        {typeof project.views === 'number' && project.views > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-[#0A1A3C]/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg">
                                <Eye className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                <span className="text-xs font-bold text-[#0A1A3C] dark:text-white">{project.views}</span>
                            </div>
                        )}
                    </div>

                    {/* Content - Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        {/* Technologies */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {project.technologies.slice(0, isLarge ? 5 : 3).map((tech) => (
                                <Badge
                                    key={tech}
                                    className="text-xs px-2.5 py-1 font-medium bg-[#F0A800] text-[#0A1A3C] border-0 shadow-md"
                                >
                                    {tech}
                                </Badge>
                            ))}
                            {project.technologies.length > (isLarge ? 5 : 3) && (
                                <Badge className="text-xs px-2.5 py-1 font-medium bg-white/20 backdrop-blur-sm text-white border-0">
                                    +{project.technologies.length - (isLarge ? 5 : 3)}
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className={`
                     font-bold font-headline text-white leading-tight mb-2
                     group-hover:text-[#F0A800] transition-colors duration-300
                     ${isLarge ? 'text-2xl md:text-3xl line-clamp-3' : 'text-xl line-clamp-2'}
                  `}>
                            {project.title}
                        </h3>

                        {/* Description - Only on larger cards */}
                        {isLarge && (
                            <p className="text-sm text-white/80 line-clamp-2 mb-3 leading-relaxed">
                                {project.description}
                            </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                            {/* Author */}
                            <div className="flex items-center gap-2">
                                <ClientAvatar
                                    src={project.avatar || ''}
                                    alt={`Avatar de ${displayAuthor}`}
                                    fallback={displayAuthor?.charAt(0)?.toUpperCase() || 'U'}
                                    className="h-8 w-8 border-2 border-white/50"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                                        {displayAuthor}
                                    </span>
                                    <span className="text-xs text-white/60 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(project.date || new Date().toISOString())}
                                    </span>
                                </div>
                            </div>

                            {/* Stats & Arrow */}
                            <div className="flex items-center gap-3">
                                {typeof project.likes === 'number' && project.likes > 0 && (
                                    <div className="flex items-center gap-1 text-white/80">
                                        <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                                        <span className="text-sm font-medium">{project.likes}</span>
                                    </div>
                                )}
                                {project.comments && project.comments.length > 0 && (
                                    <div className="flex items-center gap-1 text-white/80">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-sm font-medium">{project.comments.length}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F0A800] text-[#0A1A3C] group-hover:bg-white transition-colors duration-300 shadow-lg">
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
