import { DB } from "../db/index";
import { Struct } from "../struct";
import { openStructs, structsPipe } from "./struct";

openStructs().then(async s => {
    s.unwrap();
    (await Struct.buildAll(DB)).unwrap();
    structsPipe();
});