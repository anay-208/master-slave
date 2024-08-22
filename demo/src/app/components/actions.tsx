"use server";

import { addTodo, deleteTodo, todoComplete } from "../db";

export const createTodo = async (title: string) => {
    return await addTodo(title)
}

export const markToDoComplete = async (id: number) => {
    await todoComplete(id)
}

export const removeTodo = async (id: number) => {
    await deleteTodo(id)
}