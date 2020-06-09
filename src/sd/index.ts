import "isomorphic-fetch";
import bonjour, { Service, Browser } from "bonjour";
import groupBy from "@newdash/newdash-node/groupBy";
import process from "process";
import { hostname } from "os";

interface MicroServiceOptions {
    application: string;
    service: string;
    port: number;
    version?: string;
}

export class MicroService {

    constructor({ application, service, port, version = "default" }: MicroServiceOptions) {
        this._service = bonjour().publish({
            name: `${application}-${service}-${hostname}-${port}-${process.pid}`,
            type: application,
            port: port,
            txt: { version, service }
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

    private _serviceCount = new Map()

    /**
     * 
     * get service 
     * 
     * round trip
     * 
     * @param serviceName 
     */
    private getOneService(serviceName: string): Service {
        const c = this._serviceCount.get(serviceName) || 0;
        const services = groupBy(this._discover.services, 'txt.service');
        const instances = services[serviceName];
        this._serviceCount.set(serviceName, c + 1);
        if (instances && instances.length > 0) {
            return instances[c % instances.length];
        }
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