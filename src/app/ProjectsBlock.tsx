// @ts-nocheck
'use client'

import React from 'react'
import projectsConfig from '@/content/projects'
import GitHubIcon from '@mui/icons-material/GitHub';
import { FeaturedProjectsGrid } from './FeaturedProjectsGrid';

const ProjectItemDesktop = ({ title, summary, image, url, github, githubUrl, index }) => {
  const projectId = `P${(projectsConfig.items.length - index).toString().padStart(2, '0')}`;
  
  const handleProjectClick = (e) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  const handleGithubClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (github) {
      const target = githubUrl ? githubUrl : `https://github.com/${github}`;
      window.open(target, '_blank');
    }
  };

  return(
    <tr className="group border-b border-box-outline transition-colors cursor-pointer hover:bg-highlight-bg" onClick={handleProjectClick}>
      <td className="font-mono text-xs">{projectId}</td>
      <td className="font-mono text-xs">
        <div className="text-box-title-bg">{title}</div>
        <div className="text-xs mt-1">{summary}</div>
      </td>
      <td className="font-mono text-xs text-center">
        {github ? (
          <div 
            className="flex items-center justify-center gap-1 transition-colors cursor-pointer group-hover:text-primary-green"
            onClick={handleGithubClick}
            title="View on GitHub"
          >
            <GitHubIcon style={{ fontSize: '14px' }} />
          </div>
        ) : (
          <span>N/A</span>
        )}
      </td>
      <td className="font-mono text-xs text-center">
        <span className="transition-colors group-hover:text-primary-green">[ACCESS]</span>
      </td>
    </tr>
  );
};

const ProjectItem = ({ title, summary, image, url, github, githubUrl, index }) => {
  const projectId = `P${(projectsConfig.items.length - index).toString().padStart(2, '0')}`;
  const status = github ? 'ACTIVE' : 'ARCHIVED';
  const statusColor = status === 'ACTIVE' ? 'text-terminal-green' : 'text-terminal-orange';
  
  const handleProjectClick = (e) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  const handleGithubClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (github) {
      const target = githubUrl ? githubUrl : `https://github.com/${github}`;
      window.open(target, '_blank');
    }
  };

  return(
    <div 
      className="group mobile-card mb-3 p-3 border border-box-outline bg-box-bg cursor-pointer transition-all hover:bg-highlight-bg hover:border-box-title-bg block md:hidden"
      onClick={handleProjectClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-mono text-xs text-table-text hover-text">{projectId}</div>
        <div className="flex gap-2">
          {github && (
            <div 
              className="flex items-center gap-1 text-table-text transition-colors text-xs group-hover:text-primary-green hover:text-primary-green focus:text-primary-green active:text-primary-green"
              onClick={handleGithubClick}
              title="View on GitHub"
            >
              <GitHubIcon style={{ fontSize: '12px' }} />
            </div>
          )}
          <a 
            href={url} 
            className="text-table-text transition-colors text-xs group-hover:text-primary-green"
            onClick={(e) => e.stopPropagation()}
          >
            [VIEW]
          </a>
        </div>
      </div>
      <div className="text-box-title-bg font-mono text-sm mb-2">{title}</div>
      <div className="text-table-text hover-text text-xs leading-relaxed">{summary}</div>
    </div>
  );
};

export const ProjectsBlock = () => {

  // Featured projects to exclude from the main table
  const featuredProjectTitles = [
    'PageSonic',
    'Real-Time Black Hole Simulator',
    'HomeBench', 
    'Web Audio Synthesizer'
  ];

  // Filter out featured projects from the table display
  const tableProjects = projectsConfig.items.filter(project => 
    !featuredProjectTitles.includes(project.title)
  );

  const totalProjects = projectsConfig.items.length;
  const activeProjects = projectsConfig.items.filter(project => project.github).length;

  return (
    <section id="projects" className="mb-2 scroll-mt-8">
      <div className="content-section-borderless m-0 p-0">
        <div className="terminal-header">
          <span className="terminal-header-text">PROJECTS</span>
        </div>
        <div className="px-4 pt-4 pb-4">
          {/* Featured Projects Grid */}
          <FeaturedProjectsGrid />
          
          {/* Separator before projects table */}
          <div className="my-6 border-t border-box-outline"></div>
          
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table w-full font-mono text-xs">
              <thead>
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">PROJECT</th>
                  <th className="text-center">GITHUB</th>
                  <th className="text-center">LINK</th>
                </tr>
              </thead>
              <tbody>
                {tableProjects.map((project, index) => (
                  <ProjectItemDesktop 
                    key={index}
                    index={index}
                    title={project.title}
                    summary={project.summary}
                    image={project.image}
                    url={project.url}
                    github={project.github}
                    githubUrl={project.githubUrl}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {tableProjects.map((project, index) => (
              <ProjectItem 
                key={index}
                index={index}
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
      </div>
    </section>
  );
};
