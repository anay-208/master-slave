import { PrismaClient } from '@prisma/client'
import { readReplicas } from '@prisma/extension-read-replicas'

const prisma = new PrismaClient().$extends(
  readReplicas({
    // Here needs to be the url of replica or slave, and main url on the prisma setup file
    url: process.env.DATABASE_URL_REPLICA,
  })
)

// Query is run against the database replica
await prisma.post.findMany()

// Query is run against the primary database
await prisma.post.create({ 
  data: {/** */},
})

// running this file won't work at all, its just for illustration purposes. If you've setup a schema and prisma, it'll work
