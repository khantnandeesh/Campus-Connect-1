import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { onlineStatusState } from '../atoms/onlineStatusAtom';
import websocketService from '../services/websocket';

const WebSocketProvider = ({ children }) => {
    const setOnlineStatus = useSetRecoilState(onlineStatusState);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            websocketService.setOnlineStatusSetter(setOnlineStatus);
            websocketService.connect(token);
        }

        return () => {
            websocketService.disconnect();
        };
    }, []);

    return children;
};

export default WebSocketProvider; 