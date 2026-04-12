import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: string
  coverEmoji: string
  content: string
}

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  return files
    .map(file => {
      const slug = file.replace('.md', '')
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      return { slug, content, ...data } as Post
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return { slug, content, ...data } as Post
}
