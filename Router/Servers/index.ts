import { Request, Response } from '@Typetron/Router/Http'

export * from './node'
export * from './uNetworking'

export type AppServer = (port: number, handler: (request: Request) => Promise<Response>) => void
