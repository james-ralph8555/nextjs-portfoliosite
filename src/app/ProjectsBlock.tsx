// @ts-nocheck
'use client'

import React from 'react'
const colors = require('tailwindcss/colors');
import Image from 'next/image';
import projectsConfig from '@/content/projects'
import Star from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';

const ProjectItemDesktop = ({ title, summary, image, url, github, stars, index }) => {
  const projectId = `P${(projectsConfig.items.length - index).toString().padStart(2, '0')}`;
  
  const handleProjectClick = (e) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  const handleStarsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (github) {
      window.open(`https://github.com/${github}`, '_blank');
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
            onClick={handleStarsClick}
          >
            <GitHubIcon style={{ fontSize: '14px' }} />
            <Star style={{ fontSize: '14px' }} />
            <span>{stars !== undefined ? stars : 0}</span>
          </div>
        ) : (
          <span>N/A</span>
        )}
      </td>
      <td className="font-mono text-xs text-center">
        <span className="transition-colors">[ACCESS]</span>
      </td>
    </tr>
  );
};

const ProjectItem = ({ title, summary, image, url, github, stars, index }) => {
  const projectId = `P${(projectsConfig.items.length - index).toString().padStart(2, '0')}`;
  const status = github ? 'ACTIVE' : 'ARCHIVED';
  const statusColor = status === 'ACTIVE' ? 'text-terminal-green' : 'text-terminal-orange';
  
  const handleProjectClick = (e) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  const handleStarsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (github) {
      window.open(`https://github.com/${github}`, '_blank');
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
              onClick={handleStarsClick}
            >
              <GitHubIcon style={{ fontSize: '12px' }} />
              <Star style={{ fontSize: '12px' }} />
              <span>{stars !== undefined ? stars : 0}</span>
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
  const [starCounts, setStarCounts] = React.useState({});

  React.useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch('/api/github-stars');
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.stars) {
          setStarCounts(data.stars);
        }
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
      }
    };

    fetchStars();
  }, []);

  const totalProjects = projectsConfig.items.length;
  const activeProjects = projectsConfig.items.filter(project => project.github).length;

  return (
    <section id="projects" className="mb-2 scroll-mt-8">
      <div className="content-section-borderless m-0 p-0">
        <div className="terminal-header">
          <span className="terminal-header-text">PROJECTS</span>
        </div>
        <div className="px-4 pt-4 pb-4">
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
                {projectsConfig.items.map((project, index) => (
                  <ProjectItemDesktop 
                    key={index}
                    index={index}
                    title={project.title}
                    summary={project.summary}
                    image={project.image}
                    url={project.url}
                    github={project.github}
                    stars={project.github ? starCounts[project.github] : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {projectsConfig.items.map((project, index) => (
              <ProjectItem 
                key={index}
                index={index}
                title={project.title}
                summary={project.summary}
                image={project.image}
                url={project.url}
                github={project.github}
                stars={project.github ? starCounts[project.github] : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
