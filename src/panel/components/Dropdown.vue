<template>
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target)" class="dropdown">
        <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
        </option>
    </select>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface DropdownOption {
    label: string
    value: string | number
}

export default defineComponent({
    name: 'Dropdown',
    props: {
        modelValue: {
            type: [String, Number],
            required: true
        },
        options: {
            type: Array as PropType<DropdownOption[]>,
            required: true
        }
    },
    emits: ['update:modelValue']
})
</script>