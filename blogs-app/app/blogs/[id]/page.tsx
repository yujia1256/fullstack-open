import { notFound } from "next/navigation"
import { getBlogById } from "@/app/services/blogs"

const BlogPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  console.log("当前获取到路由是id")
  const blog = getBlogById(Number(id))

  if (!blog) {
    notFound()
  }

  return (
    <div>
      <h2>{blog.title}</h2><br />
      <p>author:{blog.author}</p>
      <p>url:{blog.url}       |Likes:{blog.likes}</p>
      
    </div>
  )
}

export default BlogPage