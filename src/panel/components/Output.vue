<template>
    <div class="output-wrapper">
        <div>
            <button @click="saveToFile">Save to file</button>
            <button @click="copyToClipboard">Copy</button>
            <button @click="$emit('clear')">Clear</button>
        </div>
        <textarea 
            readonly
            :value="content"
            rows="10"
            class="output-textarea"
        ></textarea>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'Output',
    props: {
        content: {
            type: String,
            required: true
        }
    },
    emits: ['clear'],
    setup() {
        const saveToFile = () => {
            const blob = new Blob([content.value], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'output.txt'
            link.click()
            URL.revokeObjectURL(url)
        }

        const copyToClipboard = async () => {
            await navigator.clipboard.writeText(content.value)
        }

        return {
            saveToFile,
            copyToClipboard
        }
    }
})
</script>

<style scoped>
.output-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.output-textarea {
    width: 100%;
    height: 100%;
    resize: none;
    box-sizing: border-box;
}
</style>