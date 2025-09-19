// @ts-nocheck
'use client'

import React from 'react'
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

const SocialItem = ({link, icon, code, label}) => {
  return (
    <li className="mb-1">
      <a href={link}>
        <div className="group flex items-center py-2 border border-box-outline bg-box-bg hover:bg-highlight-bg transition-colors">
          <span className="nav-indicator mr-3 h-px w-6 bg-table-text transition-all group-hover:w-12 group-hover:bg-highlight-text"/>
          <span className="text-table-text text-xs mr-2 font-mono group-hover:text-highlight-text">[{code}]</span>
          <span className="nav-text text-table-text text-xs font-mono uppercase tracking-wider group-hover:text-highlight-text flex items-center gap-2">
            {label} {icon}
          </span>
        </div>
      </a>
    </li>
  );
};

export const Socials = () => {
  return (
    <div className="terminal-border bg-box-bg m-2">
      <div className="terminal-header">
        <span className="terminal-header-text">CONTACT</span>
      </div>
      <ul className='p-4 space-y-2'>
        <SocialItem link='https://github.com/james-ralph8555' icon={<GitHubIcon style={{fontSize: '16px'}}/>} code='GH' label='GITHUB'/>
        <SocialItem link='https://www.linkedin.com/in/jamesfralph/' icon={<LinkedInIcon style={{fontSize: '16px'}}/>} code='LI' label='LINKEDIN'/>
        <SocialItem link='mailto:james.ralph8555@gmail.com' icon={<EmailIcon style={{fontSize: '16px'}}/>} code='EM' label='EMAIL'/>
      </ul>
    </div>
  );
};
