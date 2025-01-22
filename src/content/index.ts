import { PageInjector } from "../modules/page_injector.js";
import { Storage } from "../modules/storage.js";

let storage = new Storage();
let pageInjector = new PageInjector(storage);
