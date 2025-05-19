<template>
  <div class="bg-background h-full overflow-y-auto gutter-stable scrollbarMod">
    <div class="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <h2 class="text-3xl font-serif col-span-2">Goodreads importer</h2>

      <div class="mt-2">
        <h3 class="font-mono text-xl">Source</h3>

        <div class="text-sm opacity-50">
          <ol class="list-decimal pl-4">
            <li>Login into Goodreads on the web</li>
            <li>Open «My Boooks» section</li>
            <li>Click «Print» in the top right corner</li>
            <li>
              Increase «per page» value to 100 in the bottom left corner. You can set it event
              higher by modifiying parameter in the url.
            </li>
            <li>Right click anywhere on the page and select «Save as».</li>
            <li>Save each page as a separate file somewhere on your computer</li>
          </ol>
        </div>

        <input type="file" id="file-input" class="opacity-0" @change="handleFileChange" />

        <Button variant="outline" size="lg" class="w-full" as-child>
          <label for="file-input" :data-empty="selectedFileInfo.fileName === ''" class="">
            <template v-if="selectedFileInfo.fileName">
              {{ selectedFileInfo.fileName }}
            </template>
            <template v-else> Select saved file </template>
          </label>
        </Button>
      </div>

      <div>
        <h3 class="font-mono text-xl">Destination</h3>

        <div class="mt-2 items-center flex flex-col rounded-md overflow-hidden bg-accent/10">
          <div class="grid grid-cols-2 w-full odd:bg-accent/20 p-2 items-center">
            <div :class="{ 'opacity-0': currentSchema === null }">Goodreads</div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full">
                    <template v-if="selectedSchemaIndex !== null">
                      Schema: {{ schemasArray[selectedSchemaIndex][1].name }}
                    </template>
                    <template v-else> Select schema </template>

                    <ChevronDown class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    v-for="([schemaPath, schema], index) in schemasArray"
                    :key="schemaPath"
                    @click="selectedSchemaIndex = index"
                  >
                    {{ schema.name }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div
            v-if="currentSchema"
            v-for="mappingKey in mappingKeys"
            :key="mappingKey.key"
            class="grid grid-cols-2 w-full odd:bg-accent/20 p-2 items-center"
          >
            <div>{{ mappingKey.label }}</div>

            <Select v-model="mappings[mappingKey.key]" :options="mappingKey.fields" class="w-full">
              <SelectTrigger class="w-full">{{
                mappings[mappingKey.key] || 'Select field'
              }}</SelectTrigger>
              <SelectContent>
                <SelectItem v-for="field in mappingKey.fields.value" :key="field" :value="field">
                  {{ field }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div
        :class="{
          'opacity-50 cursor-not-allowed':
            books.length === 0 || !currentSchemaPath || !selectedFileInfo.fileName,
        }"
      >
        <h3 class="font-mono text-xl">Import</h3>

        <div
          v-if="books.length > 0"
          class="max-h-64 overflow-y-auto scrollbarMod border rounded-md text-xs text-muted-foreground"
        >
          <ol>
            <li v-for="book in books" :key="book.title" class="p-1 odd:bg-accent/20">
              {{ book.title }}
            </li>
          </ol>
        </div>
        <Button
          @click="importBooks"
          variant="outline"
          :disabled="books.length === 0"
          class="mt-2 w-full"
        >
          <template v-if="selectedFileInfo.importDone">
            <Check class="w-4 h-4" />
            Import done
          </template>
          <template v-else> Import {{ books.length }} books </template>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mkdir } from '@tauri-apps/plugin-fs';
import { format } from 'date-fns';
import { Check, ChevronDown } from 'lucide-vue-next';
import path from 'path-browserify';
import { c_save_file } from '~/api/tauriActions';
import type { AttrValue, RecordFromDb } from '~/types';
import { extractDataFromGoodreadsHTML, type GoodreadsParsedBook } from './goodreadsHTMLParser';

const usableSchemas = useUsableSchemas();
const schemasArray = computed(() => usableSchemas.schemasArray.value);

watch(
  schemasArray,
  (newVal) => {
    if (newVal.length === 0) return;

    const bookSchema = newVal.findIndex((v) => {
      return v[1].name.toLowerCase().includes('book');
    });

    console.log(bookSchema);

    if (bookSchema === -1) return;

    nextTick(() => {
      selectedSchemaIndex.value = bookSchema;
    });
  },
  { immediate: true },
);

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

const selectedFileInfo = ref({ fileName: '', bookCount: 0, importDone: false });

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (!file) return;

  selectedFileInfo.value.fileName = file.name;
  selectedFileInfo.value.importDone = false;
  const result = await extractDataFromGoodreadsHTML(event, '');
  if (!result) return;
  books.value = result;
  selectedFileInfo.value.bookCount = result.length;
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

    selectedFileInfo.value.importDone = true;
  }
};

const mappingKeys: {
  key: keyof GoodreadsParsedBook;
  label: string;
  fields: Ref<string[]>;
}[] = [
  {
    key: 'title',
    label: 'Title',
    fields: awailableTextFields,
  },
  {
    key: 'author',
    label: 'Author',
    fields: awailableTextFields,
  },
  {
    key: 'isbn13',
    label: 'ISBN13',
    fields: awailableNumberFields,
  },
  {
    key: 'year',
    label: 'Year',
    fields: awailableNumberFields,
  },
  {
    key: 'rating',
    label: 'Rating',
    fields: awailableNumberFields,
  },
  {
    key: 'read',
    label: 'Read',
    fields: awailableDatePairFields,
  },
];
</script>
