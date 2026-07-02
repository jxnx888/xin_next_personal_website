'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Project } from '@/lib/types/projects';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [showQr, setShowQr] = useState(false);

  const handleCardClick = () => {
    if (project.url && !project.storeUrlQr) {
      window.open(project.url, '_blank');
    }
  };

  return (
    <div
      id={project.title.replaceAll(' ', '')}
      className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 phone:mx-4"
    >
      <div className="md:flex">
        <div className="md:w-2/5 relative h-64 md:h-auto">
          <Image
            src={project.img}
            alt={project.title}
            fill
            className="object-cover cursor-pointer"
            onClick={handleCardClick}
          />
        </div>
        <div className="md:w-3/5 p-6">
          <h3 className="text-2xl phone:text-xl font-bold text-gray-800 mb-3">
            {project.title}
          </h3>
          <p className="text-gray-600 mb-4 phone:text-sm leading-relaxed">
            {project.desc}
          </p>
          <div className="mb-4">
            <p className="text-sm text-gray-500 phone:text-xs">
              <span className="font-semibold">Technologies: </span>
              {project.tags}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {project.url && !project.storeUrlQr && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors phone:text-sm"
              >
                Visit Website
              </a>
            )}
            {project.storeUrlQr && (project.storeUrlQr.ios || project.storeUrlQr.android) && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowQr(true)}
                  onMouseLeave={() => setShowQr(false)}
                  onClick={() => setShowQr(!showQr)}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors phone:text-sm"
                >
                  Download App
                </button>
                {showQr && (
                  <div className="absolute bottom-full left-0 mb-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <div className="space-y-2">
                      {project.storeUrlQr.ios && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">iOS App:</p>
                          <Image
                            src={project.storeUrlQr.ios}
                            alt="iOS QR Code"
                            width={150}
                            height={150}
                            className="border border-gray-300"
                          />
                        </div>
                      )}
                      {project.storeUrlQr.android && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Android App:</p>
                          <Image
                            src={project.storeUrlQr.android}
                            alt="Android QR Code"
                            width={150}
                            height={150}
                            className="border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {project.code > 0 && (
              <a
                href={`https://github.com/xin-ning`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors phone:text-sm"
              >
                View Code
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
