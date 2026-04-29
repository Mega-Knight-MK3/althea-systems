<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false, autolink: true }),
    TextStyle,
    Color,
  ],
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return
    if (editor.value.getHTML() !== value) editor.value.commands.setContent(value, { emitUpdate: false })
  }
)

onBeforeUnmount(() => editor.value?.destroy())

const COLORS = ['#0f172a', '#16a34a', '#dc2626', '#2563eb', '#f97316']

function toggleBold() { editor.value?.chain().focus().toggleBold().run() }
function toggleItalic() { editor.value?.chain().focus().toggleItalic().run() }
function toggleStrike() { editor.value?.chain().focus().toggleStrike().run() }
function toggleBulletList() { editor.value?.chain().focus().toggleBulletList().run() }
function setColor(color: string) { editor.value?.chain().focus().setColor(color).run() }
function clearColor() { editor.value?.chain().focus().unsetColor().run() }
function setLink() {
  if (!editor.value) return
  const previous = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('URL du lien', previous ?? 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<template>
  <div v-if="editor" class="border border-default rounded-lg">
    <div class="flex flex-wrap items-center gap-1 p-2 border-b border-default bg-elevated">
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-bold" :class="{ 'bg-elevated': editor.isActive('bold') }" aria-label="Gras" @click="toggleBold" />
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-italic" :class="{ 'bg-elevated': editor.isActive('italic') }" aria-label="Italique" @click="toggleItalic" />
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-strikethrough" :class="{ 'bg-elevated': editor.isActive('strike') }" aria-label="Barré" @click="toggleStrike" />
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-list" :class="{ 'bg-elevated': editor.isActive('bulletList') }" aria-label="Liste" @click="toggleBulletList" />
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-link" :class="{ 'bg-elevated': editor.isActive('link') }" aria-label="Lien" @click="setLink" />
      <USeparator orientation="vertical" class="h-5 mx-1" />
      <button
        v-for="color in COLORS"
        :key="color"
        type="button"
        class="size-5 rounded-full border border-default"
        :style="{ backgroundColor: color }"
        :aria-label="`Couleur ${color}`"
        @click="setColor(color)"
      />
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-paintbrush" aria-label="Réinitialiser la couleur" @click="clearColor" />
    </div>
    <EditorContent :editor="editor" class="prose prose-sm max-w-none p-3 min-h-32 focus:outline-none" />
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  outline: none;
  min-height: 8rem;
}
:deep(.ProseMirror p) {
  margin: 0 0 0.5rem 0;
}
</style>
