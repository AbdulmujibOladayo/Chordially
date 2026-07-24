export interface Stream {
  id: string
  creatorId: string
  title: string | null
  startedAt: Date
  endedAt: Date | null
}

export interface CreateStreamInput {
  creatorId: string
  title?: string
}

export interface StreamResponse {
  id: string
  creatorId: string
  title: string | null
  isLive: boolean
  startedAt: string
  endedAt: string | null
}

export function toStreamResponse(stream: Stream): StreamResponse {
  return {
    id: stream.id,
    creatorId: stream.creatorId,
    title: stream.title,
    isLive: stream.endedAt === null,
    startedAt: stream.startedAt.toISOString(),
    endedAt: stream.endedAt ? stream.endedAt.toISOString() : null,
  }
}
