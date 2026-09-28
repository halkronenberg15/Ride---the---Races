import type { PendingCloudWrite, PendingCloudWriteStore } from './index.ts'

export class MemoryPendingCloudWriteStore implements PendingCloudWriteStore{
  private writes=new Map<string,PendingCloudWrite>()
  async list(){return [...this.writes.values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt))}
  async put(write:PendingCloudWrite){this.writes.set(write.id,write)}
  async remove(id:string){this.writes.delete(id)}
}
