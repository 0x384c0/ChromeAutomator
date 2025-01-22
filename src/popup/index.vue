<template>
  <div>
    <div class="text_view">
      <div>
        You will need the devtools "Crome Scrapper" panel opened.<br />
        Activate the devtools panel with F12 or Ctrl+Shift+J.<br />
        With the devtools open, find and select the "Crome Scrapper" tab from the top menu of the devtools.<br />
        You may need to press the ">>" in order to find it.
      </div>
    </div>
    <div id="settings">
      <input type="checkbox" id="checkbox" v-model="isVerboseLogging" @change="change" />
      <label for="checkbox">Verbose Logging</label>
    </div>
  </div>
</template>

<script>
import { setupLogic } from './logic.ts';

export default {
  setup() {
    return setupLogic();
  }
};
</script>