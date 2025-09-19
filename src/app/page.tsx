// @ts-nocheck
import React from 'react'
import { getAllPosts } from '@/lib/api'
import { SideBar } from './SideBar'
import { AboutBlock } from './AboutBlock'
import { ExperienceBlock } from './ExperienceBlock'
import { ProjectsBlock } from './ProjectsBlock'
import { BlogLinkBlock } from './BlogLinkBlock'
import { RetroGlobe } from './RetroGlobe'
import { PortfolioLayout } from './PortfolioLayout'

const UserProfile = () => {
  return (
    <div className="fused-panel-top w-full">
      <div className="terminal-header">
        <span className="terminal-header-text">PROFILE</span>
      </div>
      <div className="font-mono text-table-text p-4">
        <div className="mb-2">
          <span className="text-box-title-bg">NAME:</span> JAMES RALPH
        </div>
        <div className="mb-2">
          <span className="text-box-title-bg">ROLE:</span> DATA SCIENTIST
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  return (
    <div className="fused-terminal-layout">
      <UserProfile />
      <RetroGlobe />
      <SideBar />
    </div>
  );
};

export default async function Home() {
  const posts = await getAllPosts();
  
  return (
    <PortfolioLayout sidebar={<Sidebar />}>
      <AboutBlock />
      <ExperienceBlock />
      <ProjectsBlock />
      <BlogLinkBlock posts={posts} />
    </PortfolioLayout>
  )
}
