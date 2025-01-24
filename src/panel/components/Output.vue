<template>
    <div class="flex-column h-full w-full">
        <Toolbar style="border-radius: 0">
            <template #start>
                <div>
                    <Button class="mr-2" @click="saveToFile">Save to file</Button>
                    <Button class="mr-2" text @click="copyToClipboard">Copy</Button>
                    <Button text @click="$emit('clear')">Clear</Button>
                </div>
            </template>
        </Toolbar>
        <ScrollPanel class="h-full w-full px-2">
            <pre><code>{{ content }}</code></pre>
        </ScrollPanel>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import '/node_modules/primeflex/primeflex.css'

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