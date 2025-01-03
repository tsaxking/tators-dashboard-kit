/* eslint-disable @typescript-eslint/no-explicit-any */
import { Struct } from "drizzle-struct/back-end";
import "./structs/account";
import "./structs/session";
import "./structs/permissions";
import { DB } from "./db";

Struct.each(s => {
    if (!s.built) {
        s.build(DB as any);
    }
});