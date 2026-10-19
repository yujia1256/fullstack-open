# 点赞不起作用：错在哪

按钮、表单、Server Action 这条链路是通的。点下去之后页面上的数字不变，是因为 **赞数没有写进数据库**。

本文只说明错在哪、为什么、改哪两个地方。代码先不动。

---

## 1. 现在点一次赞实际发生了什么

详情页 `app/blogs/[id]/page.tsx` 的表单是对的：

- `action={handleLilk}`，提交会进 Server Action
- 隐藏字段 `name="id"`，博客 id 能传到服务端

`app/actions/notes.ts` 里的 `handleLilk` 会取出这个 id，然后调用 `updateLikes(id)`，再 `revalidatePath`。

真正加赞的函数在 `app/services/blogs.ts`：

```ts
export const updateLikes = async (id: number) => {
  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, id)
  })
  if (blog){
    blog.likes +=1
    return blog
  }
}
```

这里做了两件事：

1. 按 id 从 Postgres **读出**一行。
2. 把读出来的那个 JavaScript 对象的 `likes` 加 1，然后 return。

没有第 3 步。没有 `db.update(...)`，数据库里的 `likes` 列始终是原来的值。

列表页和详情页都是重新 `SELECT` 出来再渲染的（`getBlogs`、`getBlogById`）。它们读到的还是库里的旧数字，所以界面看起来「点了没反应」。

函数名写成 `handleLilk` 不是原因。页面和 action 用的是同一个拼写，调用能对上。

---

## 2. 为什么以前这样写能工作

迁到 Drizzle 之前，博客存在内存数组里。`find` 拿到的是数组里的那个对象，`blog.likes += 1` 改的就是数组里的同一份数据，下次 `getBlogs()` 还能看到。

换成数据库之后，`db.query.blogs.findFirst` 返回的是查询结果的普通对象，不是「会自动同步回表」的记录。改它只影响这次函数里的局部变量，函数结束就丢掉了。

`addBlog` 能用，是因为它走了 `db.insert(...).values(...)`，真的写了库。点赞这条没有对应的写操作。

---

## 3. 要改的地方

### 3.1 `app/services/blogs.ts` 的 `updateLikes`（主因）

读出来再 `+= 1` 不够，要把新的赞数 **UPDATE 回 `blogs` 表**。

用 Drizzle 的 update，按 id 定位这一行，把 `likes` 设成「当前列的值 + 1」。`sql` 要从 `drizzle-orm` 引进来，和现有的 `eq` 放在一起。

意图是这条语句（自己补全到函数里）：

```ts
db.update(blogs)
  .set({ likes: sql`${blogs.likes} + 1` })
  .where(eq(blogs.id, id))
```

用数据库里的列做加法，比「先读到 JS 里再加一再写回去」更合适：两次点击不会互相覆盖。

读出来的那个 `if (blog)` 判断可以留下，用来确认这篇博客存在；确认之后必须再执行上面的 update。只 return 加过 1 的对象，页面不会变。

### 3.2 `app/actions/notes.ts` 的 `handleLilk`（写上之后才会暴露）

现在是：

```ts
updateLikes(id)
revalidatePath("/blogs")
revalidatePath(`/blogs/${id}`)
```

`updateLikes` 是 async，这里没有 `await`。函数还在查库（改完之后还在执行 UPDATE）时，`revalidatePath` 已经跑完，紧接着的重新渲染仍可能读到旧赞数。

改成 `await updateLikes(id)`，等写入结束再刷新 `/blogs` 和 `/blogs/${id}`。

表单那一页不用改。

---

## 4. 改完怎么确认

1. 打开某一篇 `/blogs/[id]`，记下当前 Likes。
2. 点 like，同一页的数字加 1。
3. 回到 `/blogs`，这一行的 `(Likes:…)` 也是新数字，排序仍按赞数从高到低。
4. 刷新浏览器，数字还在。如果刷新后回到旧值，说明 UPDATE 仍没写进库。
