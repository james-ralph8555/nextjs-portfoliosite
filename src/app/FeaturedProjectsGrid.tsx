// @ts-nocheck
'use client'

import React from 'react'
import Image from 'next/image'
import GitHubIcon from '@mui/icons-material/GitHub'
import projectsConfig from '@/content/projects'

const FeaturedProjectCard = ({ title, summary, image, url, github, githubUrl }) => {
  const handleProjectClick = () => {
    window.open(url, '_blank')
  }

  const handleGitHubClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const target = githubUrl ? githubUrl : `https://github.com/${github}`
    window.open(target, '_blank')
  }

  return (
    <div 
      className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      onClick={handleProjectClick}
    >
      <div className="border border-box-outline bg-box-bg h-full transition-all duration-300 hover:bg-highlight-bg hover:border-box-title-bg">
        {/* Project Image */}
        <div className="relative h-48 w-full overflow-hidden border-b border-box-outline">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-box-title-bg/20 flex items-center justify-center">
              <div className="text-box-title-bg font-mono text-xs opacity-50">NO IMAGE</div>
            </div>
          )}
        </div>
        
        {/* Project Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-box-title-bg font-mono text-sm font-bold flex-1 mr-2">
              {title}
            </h3>
            {github && (
              <button
                onClick={handleGitHubClick}
                className="text-table-text transition-colors duration-200 hover:text-primary-green flex-shrink-0"
                title="View on GitHub"
              >
                <GitHubIcon style={{ fontSize: '16px' }} />
              </button>
            )}
          </div>
          
          <p className="text-table-text font-mono text-xs leading-relaxed line-clamp-3">
            {summary}
          </p>
          
          <div className="mt-3 pt-3 border-t border-box-outline">
            <div className="text-box-title-bg font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              [CLICK TO VIEW PROJECT]
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const FeaturedProjectsGrid = () => {
  // Featured projects as specified by the user
  const featuredProjectTitles = [
    'Real-Time Black Hole Simulator',
    'HomeBench', 
    'Web-Audio Synthesizer'
  ]

  const featuredProjects = projectsConfig.items.filter(project => 
    featuredProjectTitles.includes(project.title)
  )

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredProjects.map((project, index) => (
          <FeaturedProjectCard
            key={`featured-${index}`}
            title={project.title}
            summary={project.summary}
            image={project.image}
            url={project.url}
            github={project.github}
            githubUrl={project.githubUrl}
          />
        ))}
      </div>
    </div>
  )
}