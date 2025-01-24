<template>
    <Splitter class="panel-container" layout="vertical">
        <SplitterPanel :minSize="10">
            <div class="editor-wrapper">
                <Toolbar style="border-radius: 0">
                    <template #start>
                        <Button icon="pi pi-play" class="mr-2" :disabled="isWorking || isStopping" @click="start" />
                        <Button icon="pi pi-stop" class="mr-2" :disabled="!isWorking || isStopping" @click="stop" />
                        <Button icon="pi pi-refresh" class="mr-2" :disabled="!isWorking || isStopping"
                            @click="restart" />
                    </template>
                    <template #center>
                        <div v-if="isStopping">Stopping...</div>
                        <div v-if="isWorking">Working</div>
                        <div v-if="!isWorking">Stopped</div>
                    </template>
                    <template #end>
                        <div class="flex align-items-center">
                            <InputSwitch v-model="isHighlighCurrentLine" @change="isHighlighCurrentLineChange"
                                inputId="isHighlighCurrentLine" />
                            <label for="isHighlighCurrentLine" class="ml-2"> Highligh current line </label>
                        </div>
                    </template>
                </Toolbar>
                <div id="editor-container" class="monaco-editor"></div>
            </div>
        </SplitterPanel>
        <SplitterPanel :size="20" :minSize="10">
            <Output :content="outputText" @clear="clearOutputText" class="output-container" />
        </SplitterPanel>
    </Splitter>
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
    width: 100%;
}
</style>