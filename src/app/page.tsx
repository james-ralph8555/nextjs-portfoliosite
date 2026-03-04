// @ts-nocheck
import React from 'react'
import Image from 'next/image'
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
    </div>
  );
};

const Sidebar = () => {
  return (
    <div className="fused-terminal-layout">
      <UserProfile />
      <RetroGlobe />
      <div className="w-full border-t border-box-outline bg-bg-main p-2">
        <Image
          src="/nerv.gif"
          alt="NERV animation"
          width={500}
          height={369}
          unoptimized
          className="w-full h-auto"
        />
      </div>
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
