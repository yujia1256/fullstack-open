const blogs = [
  { id: 1,
  title: "next.js utilizes React Server Components",
  author:"Zhangjidong",
  url:"https://courses.mooc.fi/org/uh-cs/courses/full-stack-open-nextjs",
  likes: 5,},
 { id: 2,
  title: "next.js utilizes React Server Components",
  author:"Zhangjidong",
  url:"https://courses.mooc.fi/org/uh-cs/courses/full-stack-open-nextjs",
  likes: 5,},
  
]

const Blogs = () => {
  return (
    <div>
      <h2>blogs</h2>
      <ul>
        {blogs.map(blog => (
          <li key={blog.id}>
            {blog.id}.<strong>{blog.title}</strong><br />
               auther:{blog.author}         url:{""}
               <a href={blog.url}>
                url 
               </a>

          (Likes:{blog.likes})
            
          </li>
        ))}
      </ul>
    </div>
  )
}
export default Blogs