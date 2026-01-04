import Echo from 'laravel-echo';
import {$axios} from '@/helpers/integration/integration';

let $socket: any;

interface EchoConfig {
    broadcaster: string,
    key: string,
    cluster: string,
    wsHost: string,
    disableStats: boolean,
    encrypted: boolean,
    authorizer: (channel: any, options: any) => any,
    forceTLS: boolean
}

export default {
    install: (app: any, config?: any): void => {
        $socket = new Echo({
            broadcaster: import.meta.env.VITE_WEB_SOCKET_BROADCASTER as string,
            key: import.meta.env.VITE_WEB_SOCKET_KEY as string,
            cluster: import.meta.env.VITE_WEB_SOCKET_CLUSTER as string,
            wsHost: 'localhost',
            wsPort: 9522,
            disableStats: true,
            encrypted: false,
            authorizer: (channel, options) => {
                return {
                    authorize: (socketId: string, callback: Function) => {
                        $axios.post('/broadcasting/auth', {
                            socket_id: socketId,
                            channel_name: channel.name
                        })
                            .then(response => {
                                callback(null, response.data);
                            })
                            .catch(error => {
                                callback(error);
                            });
                    }
                };
            },
            forceTLS: false,
        } as EchoConfig);
        window.Echo = $socket;
        app.config.globalProperties.$socket = $socket;
    }
}

export {$socket};