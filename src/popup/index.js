// import { Storage } from "../modules/storage.js";

//init
const storage = new Storage()
var isVerboseLogging = false

//UI Bindings
var settings = null

//Others
async function init() {
    const isVerbose = await storage.getIsVerboseLogging()
    console.log("isVerbose: " + isVerbose)
    settings = new Vue({
        el: '#settings',
        data: { isVerboseLogging: isVerbose },
        methods: {
            change: () => { storage.setIsVerboseLogging(settings.isVerboseLogging) }
        }
    })
}

Vue.use(VueMaterial.default)
init()