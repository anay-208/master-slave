import List from "./components/list"
import { getTodos } from "./db"
export default async function Page(){
  const todos = await getTodos()
  // await prisma.todo.create({
  //   data: {
  //     title: 'TODO #1',

  //   },
  // })
  console.log(todos)
  return (
    <>
    <List todos={todos} />
    </>
  )
}