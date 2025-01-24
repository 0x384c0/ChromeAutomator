<template>
    <Splitter class="full-screen-container" layout="vertical">
        <SplitterPanel :minSize="10">
            <div class="flex flex-column h-full">
                <Toolbar style="border-radius: 0">
                    <template #start>
                        <Dropdown v-model="selectedScript" :options="scripts" optionLabel="label" placeholder="Select a Script" class="mr-2" />
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
                <div id="editor-container" class="flex flex-column h-full w-full"></div>
            </div>
        </SplitterPanel>
        <SplitterPanel :size="20" :minSize="10">
            <Output :content="outputText" @clear="clearOutputText" class="w-full" />
        </SplitterPanel>
    </Splitter>
</template>

<script>
import { setupLogic } from './logic.ts';
import Output from './components/Output.vue';

export default {
    components: {
        Output,
    },
    setup: setupLogic,
};
</script>

<style>
.full-screen-container {
    height: screen;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
</style>