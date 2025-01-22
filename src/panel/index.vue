<template>
    <div>
        <div class="button-container">
            <button v-if="!is_working && !is_stopping" @click="start">
                Play
            </button>
            <button v-if="is_working && !is_stopping" @click="start">
                Stop
            </button>
        </div>
        <div id="editor-container" class="monaco-editor"></div>
    </div>
</template>

<script>
import { setupLogic } from './logic.ts';

export default {
  setup: setupLogic,
};
</script>

<style>
.button-container {
    margin-bottom: 10px;
}

.monaco-editor {
    width: 100%;
    height: 500px;
}
</style>