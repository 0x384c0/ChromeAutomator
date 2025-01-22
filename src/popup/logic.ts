import { ref, onMounted } from 'vue';
import { Storage } from '../modules/storage.js';

export function setupLogic() {
  const storage = new Storage();
  const isVerboseLogging = ref(false);

  const change = () => {
    storage.setIsVerboseLogging(isVerboseLogging.value);
  };

  const init = async () => {
    const isVerbose = await storage.getIsVerboseLogging();
    console.log('isVerbose: ' + isVerbose);
    isVerboseLogging.value = isVerbose;
  };

  onMounted(() => {
    init();
  });

  return {
    isVerboseLogging,
    change
  };
}