export class Connection {
    id;
    socket;
    listenCallback;
    closeCallback;
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;
        this.socket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.listenCallback?.(message);
            }
            catch (e) {
                console.error('Failed to parse message:', e);
            }
        });
        this.socket.on('close', () => {
            this.closeCallback?.();
        });
    }
    listen(callback) {
        this.listenCallback = callback;
    }
    onClose(callback) {
        this.closeCallback = callback;
    }
    send(message) {
        this.socket.send(JSON.stringify(message));
    }
    close(reason) {
        console.log(`Closing connection ${this.id}: ${reason}`);
        this.socket.close();
    }
}
