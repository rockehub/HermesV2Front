<template>
  <Field v-slot="{ handleChange, handleBlur }" :name="params.config.code">
    <div class="flex gap-2">
      <div class="w-full">
        <div class="custom-file-container">
          <label class="custom-file-container__custom-file">
            <input
              :id="params.config.code"
              ref="fileInput"
              :multiple="params.config.multiple"
              class="custom-file-container__custom-file__custom-file-input"
              type="file"
              @blur="handleBlur"
              @change="
                (event) => {
                  previewMultiImage(event)
                  handleChange(event)
                }
              "
            />
            <input name="MAX_FILE_SIZE" type="hidden" value="10485760" />
            <span
              class="custom-file-container__custom-file__custom-file-control ltr:pr-20 rtl:pl-20"
              >{{ t('forms.commons.choose_file')
              }}<span class="custom-file-container__custom-file__custom-file-control__button">
                {{ t('forms.commons.browse') }}
              </span></span
            >
          </label>
          <button
            class="btn rounded-lg bg-error font-medium text-white hover:bg-error-focus focus:bg-error-focus active:bg-error-focus/90"
            type="button"
            @click="reset"
          >
            Reset
          </button>
        </div>
      </div>
      <!-- Reset button -->
    </div>
    <div class="preview-container">
      <div v-for="(img, index) in preview_list" :key="index" class="preview-item">
        <img :alt="'Preview ' + (index + 1)" :src="img" class="preview-image" />
      </div>
    </div>
  </Field>

  <div v-if="initialImage" class="flex justify-center">
    <img :src="initialImage" width="150px" alt="" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Field, useField } from 'vee-validate'
import type { BaseFieldProps, FileFieldSchema } from '@/classes/form/schemas'
import { useI18n } from 'vue-i18n'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'file'>>>()

const preview_list = ref<string[]>([])
const image_list = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const { t } = useI18n()

const { resetField } = useField(props.params.config.code)

const initialImage = computed(() => {
  return props.initialValues?.[props.params.config.code]
})

const previewMultiImage = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    Array.from(input.files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        preview_list.value.push(e.target?.result as string)
      }
      image_list.value.push(file)
      reader.readAsDataURL(file)
    })
  }
}

const reset = () => {
  resetField()
  // Clear the input value
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // Reset preview and image lists
  preview_list.value = []
  image_list.value = []
}
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.preview-item {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reset-button {
  display: inline-block;
}
</style>
