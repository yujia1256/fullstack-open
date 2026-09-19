"use server"

import { redirect } from "next/navigation"
import { addBlog } from "../services/blogs"
import { revalidatePath } from "next/cache"

export const createBlog = async (forDate: FormData) => {
    const title = forDate.get("title") as string
    const author = forDate.get("author") as string
    const url = forDate.get("url") as string
    const likes = 0
    addBlog(title,author,url,likes)
    revalidatePath("/blogs")
    redirect("/blogs")
    //这里的刷新缓冲，一定要写在重定向之前
}