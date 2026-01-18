export type TEventActionMethod = (
  eventActionName: string,
  element: HTMLElement,
  eventName: string,
  event: Event
) => void;
