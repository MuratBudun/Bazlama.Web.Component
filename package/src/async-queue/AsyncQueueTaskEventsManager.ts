import BazGeneral from "../helper/BazGeneral"
import BazlamaAsyncQueue from "./BazlamaAsyncQueue"
import { IAsyncQueueRunningTask } from "./IAsyncQueueRunningTask"
import { IAsyncQueueTaskEventListener, TAsyncQueueTaskEventHandler, TAsyncQueueTaskEventNames } from "./TAsyncQueueTaskEventHandlers"

export class AsyncQueueTaskEventsManager {
    private _idPrefix = "NAQTE"
    private _owner: BazlamaAsyncQueue
    public get owner(): BazlamaAsyncQueue {
        return this._owner
    }

    private _eventListeners: Record<TAsyncQueueTaskEventNames, IAsyncQueueTaskEventListener[]> = 
        {} as Record<TAsyncQueueTaskEventNames, IAsyncQueueTaskEventListener[]>

    constructor(owner: BazlamaAsyncQueue) {
        this._owner = owner
    }

    public addEventListener(eventName: TAsyncQueueTaskEventNames, listenerEventHandler: TAsyncQueueTaskEventHandler): string {
        const listenerId =  BazGeneral.createId(this._idPrefix)
        if (!this._eventListeners[eventName]) {
            this._eventListeners[eventName] = []
        }

        this._eventListeners[eventName].push({ 
            listenerId: listenerId,
            listenerEventHandler: listenerEventHandler 
        })

        return listenerId
    }
    
    public removeEventListener(eventName: TAsyncQueueTaskEventNames, listenerId: string): void {
        const listeners = this._eventListeners[eventName]
        const listenerIndex = listeners.findIndex(listener => listener.listenerId === listenerId)
        if (listenerIndex > -1) {
            listeners.splice(listenerIndex, 1)
        }
    }

    public async fireEvent(eventName: TAsyncQueueTaskEventNames, runningTask: IAsyncQueueRunningTask) {
        // Fire all events listeners
        this._eventListeners["all"]?.forEach(listener => {
            listener.listenerEventHandler(eventName, runningTask)
        })

        // Fire task all event handler
        runningTask.task.events?.["all"]?.(eventName, runningTask)

        // Fire event listeners
        this._eventListeners[eventName]?.forEach(listener => {
            listener.listenerEventHandler(eventName, runningTask)
        })

        // Fire task event handler
        runningTask.task.events?.[eventName]?.(eventName, runningTask)
    }
}