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

let nextId = 4

export const getBlogs = () => {
  return blogs
}

export const addBlog = (title: string, author: string,url:string,likes:number) => {
  blogs.push({ id: nextId++, title, author,url,likes})
}