export interface TEventActionDefine {
  name: string;
  elQuery: string;
  eventName: keyof HTMLElementEventMap;
  actionMethodName: string;
}
