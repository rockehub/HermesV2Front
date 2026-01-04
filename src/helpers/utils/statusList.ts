export interface Status {
    type: string,
    color: string
}


export const statusList: Status[] = [
    {
        type: 'online',
        color: 'bg-success'
    },
    {
        type: 'offline',
        color: 'bg-slate-300'
    },
    {
        type: 'away',
        color: 'bg-warning'
    },
    {
        type: 'busy',
        color: 'bg-red-500'
    },
]