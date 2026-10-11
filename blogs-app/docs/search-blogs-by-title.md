# `/blogs` 按标题搜索：实现思考过程

需求原文：

> Add a search feature to the blogs list that allows the user to filter blogs by title. Implement the feature using URL search parameters and a Server Component, following the same pattern used in the notes app. The search term should be reflected in the URL (e.g. /blogs?filter=next) so that the filtered view can be bookmarked and shared. Add a text input and a search button to the page. Submitting the form should update the URL and re-render the list with only the matching blogs.

本文只回答三件事：**数据怎么走、要改哪些地方、为什么这样改**。代码先不动。

---

## 1. 先把需求翻译成可验证的规则

这不是在浏览器里用 `useState` 藏一个关键字，也不是再写一个 Server Action 去改内存数组。搜索词必须出现在地址栏里，列表由服务端按这个词重算。

1. `/blogs` 上有一个文本框和一个提交按钮。
2. 提交后地址变成 `/blogs?filter=用户输入`。例子里搜 `next`，地址就是 `/blogs?filter=next`。
3. 列表只保留 **title 包含该词** 的博客。
4. 把这个地址复制到新标签页，看到的是同一份过滤结果（可收藏、可分享）。
5. 没有 `filter`，或 `filter` 为空时，仍显示全部博客。
6. 现有的按 `likes` 降序不能丢：过滤之后，剩下的仍然赞多的在前。

第 4 条决定了实现形状。如果关键字只活在组件 state 里，刷新或把链接发给别人都会回到完整列表。

---

## 2. 列表现在是怎么渲染的

`/blogs` 已经是 Server Component。`app/blogs/page.tsx` 没有 `"use client"`，组件在服务端执行，浏览器拿到的是渲染结果。

```
内存数组 blogs
    ↓
getBlogs()                         // app/services/blogs.ts，原样返回
    ↓
[...blogs].sort(likes 降序)        // 只在 page.tsx 里排，不改原数组
    ↓
map 成 <li>
```

当前种子数据两篇标题相同，都是 `next.js utilizes React Server Components`，likes 分别是 7 和 5。所以现在打开 `/blogs`，id 1 在 id 2 前面。

点赞和新建走的是另一条路，这次不要碰：

- `app/blogs/[id]/page.tsx` 的 like 表单提交 `handleLilk`，内部 `revalidatePath("/blogs")`。
- `app/blogs/new/page.tsx` 的创建表单提交 `createBlog`，写完 `redirect("/blogs")`。

那两个表单带了 `action={函数}`，是 **POST Server Action**：请求体里的数据不会进 URL。搜索如果也走这条路，地址栏不会出现 `?filter=next`。

---

## 3. 笔记应用用的是哪一种模式

首页指向的 [fullstack-hy2020/nextjs-notes](https://github.com/fullstack-hy2020/nextjs-notes) 当前 `main` 只有 `create-next-app` 模板，里面没有笔记列表，也没有 `searchParams`。课程里笔记页的做法是下面这一套，和这次要的 URL 形状一致：

1. 页面仍是 Server Component，改成 `async`。
2. 从页面 props 里取出 `searchParams`，读查询参数 `filter`。
3. 先把笔记全部取回来，再在页面里按内容做 `includes` 过滤。过滤不放进数据服务。
4. 页面上放一个 **没有 `action` 函数** 的 `<form>`：一个 `name="filter"` 的输入框，一个 `type="submit"` 的按钮。

浏览器对这种表单的默认行为就够用：

- 没写 `method` 时，方法是 `GET`。
- 没写 `action` 时，提交到 **当前页面**。
- 成功控件的 `name` 和 `value` 被编进查询字符串。

所以在 `/blogs` 上提交 `filter=next`，导航目标就是 `/blogs?filter=next`。Next.js 用新的查询参数再跑一次这个 Server Component，列表跟着变。不需要 `onSubmit`、`useRouter` 或客户端状态。

这和本项目里已经有的创建、点赞表单是两种提交：

| | 搜索 | 创建 / 点赞 |
| --- | --- | --- |
| 表单 | 原生 `<form>`，默认 GET | `action={serverAction}` |
| 数据去哪 | URL 查询参数 | 请求体，再改内存数组 |
| 页面怎么更新 | 同一路由带着新 query 重新渲染 | `revalidatePath` + 必要时 `redirect` |

---

## 4. 这个 Next.js 版本里 `searchParams` 怎么读

项目用的是 Next.js 16.3.5。`node_modules/next/dist/docs` 里 page 的约定是：`searchParams` 是一个 **Promise**，必须 `await`（或在客户端用 `use()`）。同步读取是旧版本行为，后面会弃用。

详情页已经按同一约定写过动态段：

```tsx
const BlogPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  // ...
}
```

列表页要对齐的是查询参数，不是路径参数。文档里的类型是：

```ts
searchParams: Promise<{ [key: string]: string | string[] | undefined }>
```

对应关系：

| 地址 | `await searchParams` 之后 |
| --- | --- |
| `/blogs` | `{}`，没有 `filter` |
| `/blogs?filter=next` | `{ filter: "next" }` |
| `/blogs?filter=next&filter=react` | `{ filter: ["next", "react"] }` |

单个文本框只会提交出一个字符串。第三行是同一键出现两次时的形状，防御一下即可，不要对它调用 `toLowerCase()`。

文档还写了两点，和这次直接相关：

- 使用 `searchParams` 会让这个页面在 **请求时动态渲染**。查询参数事先不知道，不能当成静态页烤死。对“每个链接一份过滤结果”来说，这是要的行为。
- `searchParams` 是普通对象，不是 `URLSearchParams`。用解构拿 `filter`，不要当 URL API 用。

---

## 5. 推荐的数据流

仍然只在 `app/blogs/page.tsx` 里做。服务层继续返回完整数组。

```
用户提交表单
    ↓
浏览器 GET /blogs?filter=next
    ↓
async 页面 await searchParams，取出 filter
    ↓
getBlogs() 拿到全部
    ↓
标题包含 filter 的留下；没有 filter 则全部留下
    ↓
剩下的按 likes 降序
    ↓
map 渲染
```

过滤和排序都是展示策略，发生在读取之后。`getBlogs()` 不接收关键字，避免详情页、以后的其它调用方被搜索词影响。笔记页也是“先取全量，再在页面里滤”。

匹配规则跟笔记里对 `content` 的做法相同，只是字段换成 `title`：

- 大小写不敏感：`Next` 能命中 `next.js utilizes...`。
- 子串包含：`react` 能命中现有两篇标题。
- 空字符串视为不过滤。

用现在这两篇数据自测：

| 地址 | 期望 |
| --- | --- |
| `/blogs` | 两篇都在，likes 7 在 5 前面 |
| `/blogs?filter=next` | 两篇都在，顺序仍是 7 然后 5 |
| `/blogs?filter=REACT` | 两篇都在 |
| `/blogs?filter=zzz` | 列表为空，页面其它部分还在 |
| 把 `/blogs?filter=next` 贴到新标签 | 与当前过滤结果相同 |

输入框要用 `defaultValue` 填回当前 `filter`。别人打开分享链接时，框里能看到正在生效的词。这里不能用受控的 `value`：那需要客户端 state，而这个页面要保持 Server Component。每次带新 query 的请求都会重新输出 HTML，`defaultValue` 会是这次请求的词。

页面需要变成 `async`，否则无法 `await searchParams`。列表 JSX、`Link`、作者和 url 的展示保持原样。

示意（尚未写入源码）：

```tsx
const Blogs = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { filter } = await searchParams
  const term = typeof filter === "string" ? filter.trim() : ""

  const blogs = getBlogs()
  const blogsToShow = [...blogs]
    .filter((blog) =>
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
      <ul>{/* 现有的 map，数据源改成 blogsToShow */}</ul>
    </div>
  )
}
```

`name` 必须是 `filter`，否则 URL 不会是需求里的 `?filter=next`。`trim()` 只去掉首尾空白，避免误打空格后一篇都匹配不上；比较本身仍是笔记那种子串包含。

---

## 6. 改哪里、不改哪里

| 地方 | 是否改 | 原因 |
| --- | --- | --- |
| `app/blogs/page.tsx` | **改** | 唯一需要读 URL、画表单、决定展示哪些博客的地方。 |
| `getBlogs()` | 不改 | 它的职责是交出完整列表。搜索词来自这一次请求的 URL，不属于存储。 |
| `app/actions/notes.ts` | 不改 | 创建和点赞是写操作。搜索不新增 Server Action。 |
| `app/blogs/[id]/page.tsx` | 不改 | 详情不按标题过滤。 |
| `app/blogs/new/page.tsx` | 不改 | 创建成功后本来就会 `redirect("/blogs")`，回到不带 `filter` 的完整列表。 |
| `layout.tsx` | 不改 | 导航链接指向 `/blogs`，不带查询参数，等于“看全部”。 |

不引入 Client Component。输入框在提交前不需要自己过滤列表；提交这一下由浏览器导航完成。

也不用 Next.js 的 `<Form action="/blogs">`。那个组件在 `action` 为字符串时同样会把字段编进查询参数，并且走客户端导航。课程笔记页用的是原生 `<form>`，这次对齐那个写法。原生 GET 会整页导航一次，对本页来说结果一样：新的 URL，新的服务端渲染。

---

## 7. 和现有功能怎么相处

**排序。** 过滤后再按 likes 降序，和现在 `[...blogs].sort(...)` 的意图相同。拷贝后再排，内存数组的插入顺序保持不变。

**点赞。** `revalidatePath("/blogs")` 让列表的缓存失效。用户如果正停在 `/blogs?filter=next`，这次请求的 query 仍由 URL 决定，重新执行页面时还会带上 `filter`。搜索不用为点赞再加一次 `revalidatePath`。

**新建。** `redirect("/blogs")` 不保留查询参数。创建完看到的是完整列表。这和“搜索是 URL 的一部分”一致，不必把旧的 `filter` 带回去。

**空结果。** 没有匹配时 `map` 得到空 `<ul>`。不需要额外错误页。

**重复的查询键。** `filter` 若是数组，当成没有有效单词，显示全部。正常表单不会产生这种情况。

---

## 8. 实现时不要走的路

- 用 `useState` 在客户端过滤：列表能变，地址不变，无法收藏和分享。
- 写成 Server Action，再 `redirect(\`/blogs?filter=${term}\`)`：能把词放进 URL，但多一次 POST，和笔记页的 GET 表单不是同一模式。
- 在 `getBlogs()` 里写死过滤：调用方拿不到全量，而且搜索词在页面 props 里，服务层读不到这次请求的 URL。
- 同步使用 `searchParams`：和本仓库详情页、以及 Next.js 16 文档不一致。

---

## 9. 做完之后怎么核对

开发服务器打开 `/blogs`，按真实使用走一遍，而不是只看输入框在不在：

1. 不输入直接搜索，地址是 `/blogs` 或 `/blogs?filter=`，两篇都在，赞多的在前。
2. 输入 `next` 再搜索，地址是 `/blogs?filter=next`，两篇都在。
3. 输入一个标题里没有的词，列表为空，导航和标题还在。
4. 复制带 `filter` 的地址，新开标签，结果与原页一致，输入框里是同一个词。
5. 从过滤后的列表点进详情，点赞，再回到刚才那个带 `filter` 的地址，匹配关系和 likes 顺序仍然对。
6. 新建一篇标题不含 `next` 的博客，创建后的 `/blogs` 是完整列表；再手动打开 `/blogs?filter=next`，新博客不出现。
