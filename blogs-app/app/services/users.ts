import { db } from "@/db";
import { users,blogs } from "../../db/schema";
import { eq } from "drizzle-orm";
export const getUsers = async () => { 
  return db.query.users.findMany()
}
export const getUserById = async (id: number) => {
  return db.query.users.findFirst({
    where: eq(users.id, id)
  })
}
export const getBlogsByUserId = async (userId: number) => {
  return db.query.blogs.findMany({
    where: eq(blogs.userId, userId)
  })
}
