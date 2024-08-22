
import { PrismaClient } from '@prisma/client'
import { readReplicas } from '@prisma/extension-read-replicas'

const prisma = new PrismaClient().$extends(
    readReplicas({
        url: process.env.DATABASE_URL_REPLICA as string,
      })
)


export const getTodos = async () => {
    return await prisma.todo.findMany()
    }

export const addTodo = async (title: string) => {
    return await prisma.todo.create({
        data: {
            title,
        }
    })
}

export const todoComplete = async (id: number) => {
    return await prisma.todo.update({
        where: {
            id
        },
        data: {
            done: true
        }
    })
}

export const deleteTodo = async (id: number) => {
    return await prisma.todo.delete({
        where: {
            id: id
        }
    })
}