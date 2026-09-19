import { createBlog } from "@/app/actions/notes"
const NewBlog = () => {
  return (
    <div>
      <h2>Create a new blog</h2>

      <form action={createBlog}>
        <div>
          <label>
            title:
            <input type="text" name="title" required />
          </label>
        </div>
        <div>
          <label>
            author:
            <input type="text" name="author" />
          </label>
        </div>
        <div>
          <label>
            url:
            <input type="text" name="url" />
          </label>
        </div>
        
        <button type="submit">Create</button>
      </form>
    </div>
  )
}

export default NewBlog