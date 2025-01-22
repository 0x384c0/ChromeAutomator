import { Storage } from '../modules/storage.js'
import { Component, Vue, toNative } from 'vue-facing-decorator'
@Component
class PopupComponent extends Vue {
  private storage: Storage
  public isVerboseLogging = false

  isVerboseLoggingChange(): void {
    this.storage.setIsVerboseLogging(this.isVerboseLogging)
  }

  mounted(): void {
    this.init()
  }

  private async init(): Promise<void> {
    this.storage = new Storage()
    this.isVerboseLogging = await this.storage.getIsVerboseLogging()
  }
}

export default toNative(PopupComponent)