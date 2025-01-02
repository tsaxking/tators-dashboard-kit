import { DB } from "../db/index";
import { Struct } from "drizzle-struct/src/back-end";
import { openStructs } from "./struct";
import { Folder } from "./utils";
import accounts from "./accounts";
import serverController from "./server-controller";

export const home  = new Folder(
    'Home',
    'Root Folder Access',
    '🏠',
    [
        serverController,
        accounts,
    ],
);

Folder.home = home;

openStructs().then(async s => {
    s.unwrap();
    (await Struct.buildAll(DB)).unwrap();
    // structsPipe();
    home.action();
});