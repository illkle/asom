<template>
  <div class="p-4">
    <h2 class="text-3xl font-serif">Goodreads importer</h2>

    <div class="text-sm opacity-50">
      To export your data:
      <ol class="list-decimal pl-4">
        <li>Login into Goodreads on the web</li>
        <li>
          Navigate to "My Boooks"(or to any sheves you have if you want to limit exported data)
        </li>
        <li>In floating element on the bottom of the page set "books per page" to 100</li>
        <li>
          Right click anywhere on the page and select "Save as". Save the file somewhere on your
          computer.
        </li>
      </ol>
    </div>

    <div class="text-xs opacity-50 mt-2">Note that we do not have any deduping logic yet.</div>

    <input type="file" id="file-input" class="opacity-0" @change="handleFileChange" />
    <label
      for="file-input"
      class="text-sm opacity-50 w-full h-16 border border-gray-300 rounded-md flex items-center justify-center"
    >
      select page.html
    </label>

    <div class="mt-2">
      Select one of your schemas to import into
      <div class="mt-2 flex gap-2">
        <ShButton
          v-for="([schemaPath, schema], index) in schemasArray"
          :key="schemaPath"
          :variant="selectedSchemaIndex === index ? 'default' : 'outline'"
          @click="selectedSchemaIndex = index"
        >
          {{ schema.name }}
        </ShButton>
      </div>
    </div>

    <div
      v-if="currentSchema"
      class="grid grid-cols-6 mt-2 items-center gap-2 border border-neutral-200 dark:border-neutral-800 rounded-md p-2"
    >
      <div>Title</div>

      <ArrowRightIcon />
      <ShSelect v-model="mappings.title" :options="awailableTextFields">
        <ShSelectTrigger>{{ mappings.title || 'Select field' }}</ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="field in awailableTextFields" :key="field" :value="field">
            {{ field }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>

      <div>Author</div>
      <ArrowRightIcon />
      <ShSelect v-model="mappings.author" :options="awailableTextFields">
        <ShSelectTrigger>{{ mappings.author || 'Select field' }}</ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="field in awailableTextFields" :key="field" :value="field">
            {{ field }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>

      <div>ISBN13</div>
      <ArrowRightIcon />
      <ShSelect v-model="mappings.isbn13" :options="awailableNumberFields">
        <ShSelectTrigger>{{ mappings.isbn13 || 'Select field' }}</ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="field in awailableNumberFields" :key="field" :value="field">
            {{ field }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>
      <div>Year</div>
      <ArrowRightIcon />
      <ShSelect v-model="mappings.year" :options="awailableNumberFields">
        <ShSelectTrigger>{{ mappings.year || 'Select field' }}</ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="field in awailableNumberFields" :key="field" :value="field">
            {{ field }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>
      <div>Rating</div>
      <ArrowRightIcon />
      <ShSelect v-model="mappings.rating" :options="awailableNumberFields">
        <ShSelectTrigger>{{ mappings.rating || 'Select field' }}</ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="field in awailableNumberFields" :key="field" :value="field">
            {{ field }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>
      <div>Read</div>
      <ArrowRightIcon />
      <ShSelect v-model="mappings.read" :options="awailableDatePairFields">
        <ShSelectTrigger>{{ mappings.read || 'Select DatesPairCollection field' }}</ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="field in awailableDatePairFields" :key="field" :value="field">
            {{ field }}
          </ShSelectItem>
        </ShSelectContent>
      </ShSelect>
    </div>

    <ShButton @click="importBooks" class="mt-2 w-full">Import books</ShButton>

    <div>Found {{ books.length }} books</div>
    <div>
      <div v-for="book in books" :key="book.title">
        {{ book.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mkdir } from '@tauri-apps/plugin-fs';
import { format } from 'date-fns';
import { ArrowRightIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { c_save_file } from '~/api/tauriActions';
import type { AttrValue, RecordFromDb } from '~/types';
import { extractDataFromGoodreadsHTML, type GoodreadsParsedBook } from './goodreadsHTMLParser';

const { schemasArray } = useUsableSchemas();

const books = ref<GoodreadsParsedBook[]>([]);

const selectedSchemaIndex = ref<number | null>(null);

const mappings = ref<Record<keyof GoodreadsParsedBook, string | undefined>>({
  title: undefined,
  author: undefined,
  isbn13: undefined,
  year: undefined,
  rating: undefined,
  read: undefined,
});

const currentSchema = computed(() => {
  if (selectedSchemaIndex.value === null) return null;
  return schemasArray.value[selectedSchemaIndex.value][1];
});

const currentSchemaPath = computed(() => {
  if (selectedSchemaIndex.value === null) return null;
  return schemasArray.value[selectedSchemaIndex.value][0];
});

const awailableTextFields = computed(() => {
  if (currentSchema.value === null) return [];
  return currentSchema.value.items
    .filter((item) => item.value.type === 'Text')
    .map((item) => item.name);
});

const awailableNumberFields = computed(() => {
  if (currentSchema.value === null) return [];
  return currentSchema.value.items
    .filter((item) => item.value.type === 'Number')
    .map((item) => item.name);
});

const awailableDatePairFields = computed(() => {
  if (currentSchema.value === null) return [];
  return currentSchema.value.items
    .filter((item) => item.value.type === 'DatesPairCollection')
    .map((item) => item.name);
});

watch(currentSchema, () => {
  if (currentSchema.value === null) return;
  const keys = currentSchema.value?.items.map((v) => v.name);

  Object.keys(mappings.value).forEach((key) => {
    const matchKey = keys.find((k) => k.toLowerCase().includes(key.toLowerCase()));
    if (matchKey) {
      mappings.value[key as keyof GoodreadsParsedBook] = matchKey;
    } else {
      mappings.value[key as keyof GoodreadsParsedBook] = undefined;
    }
  });
});

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (!file) return;

  const result = await extractDataFromGoodreadsHTML(event, '');
  if (!result) return;
  books.value = result;
};

const importBooks = async () => {
  if (!currentSchemaPath.value) return;
  const sp = currentSchemaPath.value;

  console.log(sp);

  const dirName = 'goodreads-' + format(new Date(), 'yyyy-MM-dd-HH-mm-ss');

  const pathToSave = path.join(sp, dirName);

  await mkdir(pathToSave, { recursive: true });

  for (const book of books.value) {
    const attrs: Record<string, AttrValue> = {};

    if (mappings.value.author) {
      attrs[mappings.value.author] = {
        type: 'String',
        value: book.author,
      };
    }

    if (mappings.value.title) {
      attrs[mappings.value.title] = {
        type: 'String',
        value: book.title,
      };
    }

    if (mappings.value.isbn13) {
      attrs[mappings.value.isbn13] = {
        type: 'Integer',
        value: book.isbn13 ?? null,
      };
    }

    if (mappings.value.year) {
      attrs[mappings.value.year] = {
        type: 'Integer',
        value: book.year ?? null,
      };
    }

    if (mappings.value.rating) {
      attrs[mappings.value.rating] = {
        type: 'Float',
        value: book.rating,
      };
    }

    if (mappings.value.read) {
      attrs[mappings.value.read] = {
        type: 'DatePairVec',
        value: book.read,
      };
    }

    const bookFile: RecordFromDb = {
      path: path.join(pathToSave, `${book.title}.md`),
      modified: null,
      markdown: '',
      attrs,
    };

    try {
      await c_save_file(bookFile, true);
    } catch (e) {
      if (isOurError(e)) {
        console.log('our error', e);
        useRustErrorNotification(e);
      } else {
        console.error(e);
      }
    }
  }
};
</script>
