
import {eq , sql} from "drizzle-orm"
import { db } from "@/db"
import { blogs } from "@/db/schema"
import { getCurrentUser } from "./session"
export const getBlogs = async() => {
  return db.query.blogs.findMany()
}
export const updateLikes = async (id: number) => {
  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, id)
  })
  if (blog){
    await db.update(blogs).set({ likes: blog.likes + 1 }).where(eq(blogs.id, id))
    return blog
  }

}
export const addBlog = async(title: string, author: string,url:string,likes:number) => {
  const user = await getCurrentUser()
  if (!user) { 
    throw new Error("Not logged in")
  }
   await db.insert(blogs).values({ title, author, url, likes, userId: user!.id })
}
export const getBlogById = async(id: number) => {
  return db.query.blogs.findFirst({
    where: eq(blogs.id, id)
  })
}