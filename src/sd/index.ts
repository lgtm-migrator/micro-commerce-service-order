import "isomorphic-fetch";
import bonjour, { Service, Browser } from "bonjour";

interface MicroServiceOptions {
    application: string;
    service: string;
    port: number;
    version?: string;
}

export class MicroService {

    constructor({ application, service, port, version = "default" }: MicroServiceOptions) {
        this._service = bonjour().publish({
            name: service,
            type: application,
            port: port,
            txt: { version }
        });
    }

    private _service: Service;

    /**
     * this service is down
     */
    public async stop(): Promise<void> {
        return new Promise(resolve => {
            this._service.stop(resolve);
        });
    }

}

export class Discover {

    constructor(application: string) {
        this._discover = bonjour().find({ type: application });
    }

    private _discover: Browser;

    private getOneService(serviceName: string): Service {
        return this._discover.services.find(s => s.name == serviceName);
    }

    public async invoke(serviceName: string, path: string, init?: RequestInit): Promise<Response> {
        const service = this.getOneService(serviceName);
        if (!service) {
            throw new Error(`not found instance for ${serviceName}`);
        }
        const url = `http://${service.host}:${service.port}${path}`;
        return fetch(url, init);
    }

}