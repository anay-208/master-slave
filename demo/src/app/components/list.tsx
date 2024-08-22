"use client";
import { title } from 'process';
import { useState, useEffect } from 'react';
import { createTodo, markToDoComplete, removeTodo } from './actions';
type Todo = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string | null;
  done: boolean;
};
export const revalidate = 0;


export default function List({ todos }: { todos: Todo[] }) {
    const [curTodo, setCurTodo] = useState<Todo[]>(todos);
    const [newTodoStr, setNewTodoStr] = useState("");
  
    const createNewTodo = async () => {
      const newTodo = await createTodo(newTodoStr);
        setCurTodo(prev => ([...prev, newTodo]));
    };
  
    const completeTodo = (id: number) => {
        markToDoComplete(id);
        setCurTodo(prev => prev.map(todo => todo.id === id ? {...todo, done: true} : todo));
    };
  
  
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">TODO List</h1>
          <ul className="w-full mb-4">
            {curTodo.map((todo) => (
              <li key={todo.id} className="border-b p-2 flex justify-between items-center">
                <span>{todo.title}</span>
                <div className="flex space-x-2">
                  <button onClick={() => completeTodo(todo.id)} className={todo.done ? "text-green-500": "text-red-500"}>
                        {todo.done ? "Completed" : "Not Completed"}
                  </button>
                  <button onClick={() => removeTodo(todo.id)} className="text-red-500">
                        Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={newTodoStr}
            onChange={(e) => setNewTodoStr(e.target.value)}
            placeholder="New TODO"
            className="border p-2 w-full mb-2 text-black"
          />
          <button onClick={createNewTodo} className="bg-blue-500 text-white p-2 w-full">
            Add TODO
          </button>
        </div>
      </main>
    );
  }