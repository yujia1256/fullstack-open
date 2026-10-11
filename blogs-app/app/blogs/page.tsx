import Link from "next/link"
import { getBlogs } from "../services/blogs"

const Blogs = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { filter } = await searchParams
  const term = typeof filter === "string" ? filter.trim() : ""
  const blogs = getBlogs() //const用来声明一个常量
  const blogsToShow = [...blogs]
    .filter(
      (blog) =>
        term === "" || blog.title.toLowerCase().includes(term.toLowerCase())
    )
    .sort((a, b) => b.likes - a.likes)
  return (
    <div>
      <h2>blogs</h2>
      <form>
        <input name="filter" defaultValue={term} />
        <button type="submit">search</button>
      </form>
      <ul>
        {blogsToShow.map(blog => (
          
          <li key={blog.id}>
            
             
              <Link href={`/blogs/${blog.id}`}>{blog.title}</Link>
                auther:{blog.author}  |     
              url:
               <a href={blog.url}>
               {blog.url}
               </a>

              (Likes:{blog.likes})
           
          </li>
        ))}
      </ul>
    </div>
  )
}
export default Blogs  //export 表示导出，只有加上export，其他文件才能通过import引入它