import { notFound } from "next/navigation"
import { getBlogById } from "@/app/services/blogs"
import { handleLilk } from "@/app/actions/notes"

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
      <form action={handleLilk}>
        <input type="hidden" name="id" value={blog.id} />
        <button type="submit">
          like
        </button>
      </form>
      
    </div>
  )
}

export default BlogPage