//init
const storage = new Storage()
var isVerboseLogging = false

//UI Bindings
Vue.use(VueMaterial.default)
var settings = null

//Others
async function init() {
    const isVerbose = await storage.getIsVerboseLogging()
    console.log("isVerbose: " + isVerbose)
    console.log("isVerbose.isVerboseLogging: " + isVerbose.isVerboseLogging)
    settings = new Vue({
        el: '#settings',
        data: { isVerboseLogging: isVerbose },
        methods: {
            change: () => { storage.setIsVerboseLogging(settings.isVerboseLogging) }
        }
    })
}

init()