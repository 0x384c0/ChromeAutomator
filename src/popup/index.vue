<template>
  <div>
    <div class="text_view mb-3">
      Activate the devtools panel with F12 or Ctrl+Shift+J.<br />
      Find and select the "Crome Scrapper" tab from the top menu of the devtools.<br />
    </div>
    <div class="flex align-items-center">
      <InputSwitch type="checkbox" id="checkbox" v-model="isVerboseLogging" @change="isVerboseLoggingChange" />
      <label for="checkbox" class="ml-2">Verbose Logging</label>
    </div>
  </div>
</template>

<script src="./popup_component.ts"></script>

<style>
body {
  padding: 10px;
  width: 300px;
}
</style>