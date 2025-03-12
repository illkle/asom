import { format, parse, isValid } from 'date-fns';
import { mkdir, remove, rename } from '@tauri-apps/plugin-fs';
import type { DatePair } from '~/types';
import { useMainStore } from '~/composables/stores/useMainStore';
import { useSettingsStore } from '~/composables/stores/useSettingsStore';

const grabSimpleValue = (rootElement: Element, name: string) => {
  const value = rootElement
    .getElementsByClassName('field ' + name)[0]
    .getElementsByClassName('value')[0];

  if (name === 'title') {
    return value.children[0].getAttribute('title') as string;
  }

  if (value.children.length) {
    return value.children[0].innerHTML.trim();
  } else {
    return value.innerHTML.trim();
  }
};

const parseDate = (stringToParse: string, possibleFormats: string[]): Date | undefined => {
  let parsed;

  for (const format of possibleFormats) {
    parsed = parse(stringToParse, format, new Date());

    if (isValid(parsed)) return parsed;
  }
};

const getDates = (rootElement: Element, dateFormat: string): DatePair[] => {
  // Date started and date finished are separate in a table, each date is marked with a class
  // like date_started_amzn1grreading_sessionv141zd03da758c4d922gx543baa13a0a0 to identify pairs
  const hashes = new Set();
  const dateEls = rootElement.getElementsByClassName('editable_date');
  for (const cdateEl of dateEls) {
    const classes = cdateEl.classList;
    hashes.add(classes[1].replace('date_started', '').replace('date_read', ''));
  }

  const result: DatePair[] = [];

  // No idea why but the seccond format appeared in my export, even though the date is seen on the web
  const possibleFormats = ['MMM dd, y', 'MMM yyyy'];

  for (const hash of hashes) {
    const date: DatePair = {};

    const startedEl = rootElement.getElementsByClassName('date_started' + hash);
    if (startedEl.length) {
      // StartedEl contains a span and a link, we ned span's content
      const parsedStared = parseDate(startedEl[0].children[0].innerHTML, possibleFormats);
      if (parsedStared) {
        const started = format(parsedStared, dateFormat);
        date.started = started;
      }
    }

    const finishedEl = rootElement.getElementsByClassName('date_read' + hash);
    if (finishedEl.length) {
      const parsedFinished = parseDate(finishedEl[0].children[0].innerHTML, possibleFormats);
      if (parsedFinished) {
        const finished = format(parsedFinished, dateFormat);
        date.finished = finished;
      }
    }
    if (date.started || date.finished) {
      result.push(date);
    }
  }
  return result;
};

const getYear = (rootElement: Element) => {
  const yearUnparsed = grabSimpleValue(rootElement, 'date_pub');
  const possibleFormats = ['MMM dd, yyyy', 'yyyy'];

  const date = parseDate(yearUnparsed, possibleFormats);
  if (date) return date.getFullYear();
};

type GoodreadsParsedBook = {
  title: string;
  author: string;
  isbn13: number;
  year?: number;
  rating: number;
  read: DatePair[];
};

const parseBook = (rootElement: Element, dateFormat: string): GoodreadsParsedBook => {
  const book: GoodreadsParsedBook = {
    title: grabSimpleValue(rootElement, 'title'),
    author: grabSimpleValue(rootElement, 'author'),
    isbn13: Number(grabSimpleValue(rootElement, 'isbn13')),
    year: getYear(rootElement),
    rating: rootElement.getElementsByClassName('field rating')[0].getElementsByClassName('star on')
      .length,
    read: getDates(rootElement, dateFormat),
  };

  return book;
};

export const importGoodReadsHTML = (event: Event) => {
  if (!event.target) return;
  const target = event.target as HTMLInputElement;

  if (!target.files) {
    return;
  }

  const ss = useSettingsStore();
  const store = useMainStore();

  const fr = new FileReader();
  const parser = new DOMParser();
  fr.readAsText(target.files[0]);
  fr.onload = async function () {
    if (typeof fr.result === 'string') {
      const html = parser.parseFromString(fr.result, 'text/html');
      const books = html.getElementById('booksBody')?.children;
      if (!books) return;

      const result: GoodreadsParsedBook[] = [];

      if (!ss.settings || !store.rootPath) return;

      for (const book of books) {
        result.push(parseBook(book, ss.settings.dateFormat));
      }

      // write result somewhere
    }
  };
};
