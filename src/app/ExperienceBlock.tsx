// @ts-nocheck
'use client'

import React from 'react'
import experienceConfig from '@/content/experience.json'

const ExperienceItemDesktop = ({ start, end, company, company_link, title, body, index }) => {
  const jobId = `E${(experienceConfig.items.length - index).toString().padStart(2, '0')}`;
  const duration = end === 'Present' ? 'CURRENT' : 'COMPLETED';
  const statusColor = duration === 'CURRENT' ? 'text-primary-green' : 'text-table-text';
  
  const handleRowClick = () => {
    if (company_link) {
      window.open(company_link, '_blank');
    }
  };
  
  return(
    <tr className="group border-b border-box-outline cursor-pointer" onClick={handleRowClick}>
      <td className="font-mono text-xs">{jobId}</td>
      <td className="font-mono text-xs">{start}-{end}</td>
      <td className="font-mono text-xs">
        <div className="text-box-title-bg">
          {title}
        </div>
        <div>{company}</div>
        {body && body.length > 0 && (
          <div className="text-xs mt-1">
            {body.map((item, i) => (
              <div key={i} className="mb-1">• {item}</div>
            ))}
          </div>
        )}
      </td>
      <td className="font-mono text-xs text-center">
        <span className={`${statusColor} ${duration === 'COMPLETED' ? 'group-hover:text-highlight-text' : ''}`}>
          {duration}
        </span>
      </td>
    </tr>
  );
};

const ExperienceItem = ({ start, end, company, company_link, title, body, index }) => {
  const jobId = `E${(experienceConfig.items.length - index).toString().padStart(2, '0')}`;
  const duration = end === 'Present' ? 'CURRENT' : 'COMPLETED';
  const isCurrent = duration === 'CURRENT';
  const statusColor = isCurrent ? 'text-primary-green' : 'text-table-text';
  
  return(
    <div className="mobile-card mb-3 p-3 border border-box-outline bg-box-bg hover:bg-highlight-bg hover:border-box-title-bg block md:hidden">
      <div className="flex justify-between items-start mb-2">
        <div className="font-mono text-xs text-table-text hover-text">{jobId}</div>
        <div className="font-mono text-xs text-table-text hover-text">{start}-{end}</div>
      </div>
      <div className="mb-2">
        <a href={company_link} className="text-table-text hover-text font-mono text-sm">
          <span className="text-box-title-bg">{title}</span>
        </a>
        <div className="text-table-text hover-text font-mono text-xs mt-1">{company}</div>
      </div>
      {body && body.length > 0 && (
        <div className="text-table-text hover-text text-xs leading-relaxed">
          {body.map((item, i) => (
            <div key={i} className="mb-1">• {item}</div>
          ))}
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-box-outline">
        <span className={`font-mono text-xs ${!isCurrent ? 'hover-text' : ''} ${statusColor}`}>
          {duration}
        </span>
      </div>
    </div>
  );
};


export const ExperienceBlock = () => {
  const totalJobs = experienceConfig.items.length;
  
  return (
    <section id="experience" className="mb-2 scroll-mt-8">
      <div className="content-section-borderless m-0 p-0">
        <div className="terminal-header">
          <span className="terminal-header-text">EXPERIENCE</span>
        </div>
        <div className="px-4 pt-4 pb-4">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table w-full font-mono text-xs">
              <thead>
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">PERIOD</th>
                  <th className="text-left">POSITION</th>
                  <th className="text-center">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {experienceConfig.items.map((item, index) => (
                  <ExperienceItemDesktop 
                    key={index}
                    index={index}
                    start={item.start} 
                    end={item.end} 
                    company={item.company} 
                    company_link={item.company_link} 
                    title={item.title} 
                    body={item.body}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {experienceConfig.items.map((item, index) => (
              <ExperienceItem 
                key={index}
                index={index}
                start={item.start} 
                end={item.end} 
                company={item.company} 
                company_link={item.company_link} 
                title={item.title} 
                body={item.body}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
