// @ts-nocheck
import { getPostById, getAllPosts } from "@/lib/api";
import Link from "next/link";

// Set the title of the page to be the post title, note that we no longer use
// e.g. next/head in app dir
 export async function generateMetadata(
   props: {
     params: Promise<{ id: string }>;
   }
 ) {
   const params = await props.params;

   const {
     id
   } = params;

   const { title } = await getPostById(id);
   return {
     title,
   };
 }

// Generate the post, note that this is a "react server component"! it is allowed to be async
export default async function Post(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { id } = params;
  const { html, title, date } = await getPostById(id);

  return (
    <div className="bg-bg-main font-mono leading-relaxed antialiased selection:bg-primary-green selection:text-bg-main">
      <div className="mx-auto min-h-screen max-w-screen-xl px-4 py-6 md:px-8 md:py-12 lg:px-12 lg:py-6">
        <div className="mb-4">
          <div className="fused-terminal-layout max-w-xs !m-0">
            <div className="fused-panel-top w-full">
              <div className="terminal-header">
                <span className="terminal-header-text">NAVIGATION</span>
              </div>
              <div className="font-mono text-table-text p-4">
                <Link href="/blog" className="inline-flex items-baseline font-medium leading-tight text-table-text hover:text-highlight-text">
                  &larr; All Posts
                </Link>
              </div>
            </div>
          </div>
        </div>
        <main className="w-full lg:border lg:border-box-outline">
          <div className="bg-box-bg p-6 lg:p-0 space-y-0">
            <header className="p-4 border-b border-box-outline">
              <h1 className="text-2xl font-bold tracking-tight text-box-title-bg font-mono uppercase mb-2">{title}</h1>
              <p className="text-xs text-table-text font-mono uppercase tracking-wide">{date}</p>
            </header>
            <div 
              className="prose max-w-none p-4" 
              dangerouslySetInnerHTML={{ __html: html }} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// This function can statically allow nextjs to find all the posts that you have made, and statically generate them
export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    id: post.id,
  }));
}
