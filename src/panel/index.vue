<template>
    <div class="panel-container">
        <splitpanes class="default-theme" horizontal>
            <pane min-size="10">
                <div class="editor-wrapper">
                    <div class="controls">
                        <Dropdown v-model="selectedScriptTemplate" :options="scriptTemplates" />
                        <button v-if="!isWorking && !isStopping" @click="start">Play</button>
                        <button v-if="isWorking && !isStopping" @click="stop">Stop</button>
                        <button v-if="isWorking && !isStopping" @click="restart">Restart</button>
                        <input type="checkbox" v-model="isHighlighCurrentLine" @change="isHighlighCurrentLineChange">
                        Highligh current line</input>
                        <div v-if="isStopping">Stopping...</div>
                    </div>
                    <div id="editor-container" class="monaco-editor"></div>
                </div>
            </pane>
            <pane min-size="10">
                <Output :content="outputText" @clear="clearOutputText" class="output-container" />
            </pane>
        </splitpanes>
    </div>
</template>

<script>
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { setupLogic } from './logic.ts';
import Dropdown from './components/Dropdown.vue';
import Output from './components/Output.vue';

export default {
    components: {
        Splitpanes,
        Pane,
        Dropdown,
        Output,
    },
    setup: setupLogic,
};
</script>

<style>
.panel-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.controls {
    flex: 0 0 auto;
}

.editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.monaco-editor {
    flex: 1 1 auto;
    width: 100%;
}

.output-container {
    flex: 0 0 20%;
    width: 100%;
}
</style>