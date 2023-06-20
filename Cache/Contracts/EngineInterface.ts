interface EngineInterface {
  get(name: string): Promise<any>
  set(name: string, data: any, duration: number): Promise<any>
  delete(name: String): Promise<Boolean>
  flush(): Promise<void>
}
export default EngineInterface
