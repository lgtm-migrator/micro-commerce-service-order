import express from "express";
import process from "process";
import { MicroService, Discover } from "./sd";

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
const sd = new Discover("micro-commerce");

app.use(express.json());

app.get("/api/v1/order", async req => {
    try {
        const res = await sd.invoke("service-catalog", "/api/v1/catalog");
        const body = await res.json();
        req.res.json(body);
    } catch (error) {
        req.next(error);
    }
});

app.listen(port, () => {
    const ms = new MicroService({
        application: "micro-commerce",
        service: "service-order",
        version: "v0.0.1", port
    });
    process.on("SIGINT", async () => {
        await ms.stop();
        process.exit(0);
    });
});
