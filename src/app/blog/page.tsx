// @ts-nocheck

// app/page.tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/api";
import Image from 'next/image';
const colors = require('tailwindcss/colors');

const postImages = {
  '2021-12-31-grafana-server-monitoring': '/grafana-post/1_Y9zMs-69y5VhPg7OwNWdGg.webp',
  '2021-12-20-tbats-time-series-forecasting': '/tbats-post/header.webp'
};

const BlogItem = ({ id, date, title }) => {
  const image = postImages[id];
  return(
    
  <li key={id} className="mb-3">
        <div className="group list-item-card">
          <div className="flex items-center justify-between p-3">
            <div className="flex-1">
              <div className="font-medium leading-tight group/link">
                <a href={`/posts/${id}`} className="block font-medium group/link font-mono">
                  <span className="absolute -inset-x-4 -inset-y-2.5 md:-inset-x-6 md:-inset-y-4 block"/>
                  <div className="text-table-text text-xs mb-1">{date}</div>
                  <h3 className="text-box-title-bg hover:text-primary-green transition-colors text-sm">{title}</h3>
                </a>
              </div>
            </div>
            {image && <Image alt={title} width={100} height={50} className="border border-box-outline transition group-hover:border-highlight-text ml-4 flex-shrink-0" src={image} style={{color:colors.transparent}}/>}
          </div>
        </div>
  </li>
  )
}
export default async function Page() {
  const posts = await getAllPosts();

  return (
    <div className="bg-bg-main font-mono leading-relaxed antialiased selection:bg-primary-green selection:text-bg-main">
      <div className="mx-auto min-h-screen max-w-screen-xl px-4 py-6 md:px-8 md:py-12 lg:px-12 lg:py-6 lg:flex lg:justify-between lg:gap-6">
        <div className="lg:w-1/2 lg:py-8">
          <div className="fused-terminal-layout">
            <div className="fused-panel-top w-full">
              <div className="terminal-header">
                <span className="terminal-header-text">NAVIGATION</span>
              </div>
              <div className="font-mono text-table-text p-4">
                <Link href="/" className="inline-flex items-baseline font-medium leading-tight text-table-text hover:text-highlight-text">
                  &larr; Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
        <main className="pt-8 lg:w-1/2 lg:py-8">
          <div className="bg-box-bg p-0 space-y-0 lg:border lg:border-box-outline lg:mt-2">
            <section id="blog" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-0 lg:scroll-mt-24">
              <div className="terminal-header">
                <span className="terminal-header-text">BLOG POSTS</span>
              </div>
              <ol className="group/list p-4">
                {posts.map((post) => {
                  const { id, date, title } = post;
                  return (
                    <BlogItem key={id} id={id} date={date} title={title}/>
                  );
                })}
              </ol>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
