<template>
    <div>
        <div>
            <Dropdown v-model="selectedScriptTemplate" :options="scriptTemplates" />
            <button v-if="!isWorking && !isStopping" @click="start">
                Play
            </button>
            <button v-if="isWorking && !isStopping" @click="stop">
                Stop
            </button>
            <button v-if="isWorking && !isStopping" @click="restart">
                Restart
            </button>
            <input type="checkbox" v-model="isHighlighCurrentLine" @change="isHighlighCurrentLineChange">Highligh
            current line</input>
            <div v-if="isStopping">Stopping...</div>
        </div>
        <div id="editor-container" class="monaco-editor"></div>
        <Output 
            :content="outputText"
            @clear="clearOutputText"
        />
    </div>
</template>

<script>
import { setupLogic } from './logic.ts';
import Dropdown from './components/Dropdown.vue';
import Output from './components/Output.vue';

export default {
    components: {
        Dropdown,
        Output,
    },
    setup: setupLogic,
};
</script>

<style>
.monaco-editor {
    width: 100%;
    height: 500px;
}
</style>