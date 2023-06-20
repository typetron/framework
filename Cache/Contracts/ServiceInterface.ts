interface ServiceInterface {
  get(name: string): Promise<any>
  set(name: string, data: any, duration?: number): Promise<any>
  delete(name: string): Promise<Boolean>
  flush(): Promise<void>
}
export default ServiceInterface
