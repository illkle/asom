import { format, isValid, parse } from 'date-fns';
import { defineExApiSchema, type ExApiData } from '~/api/external/base';
import type { DatePair } from '~/types';

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

  result.sort((a, b) => {
    if (a.started && b.started) {
      return new Date(a.started).getTime() - new Date(b.started).getTime();
    }
    return 0;
  });

  return result;
};

const getYear = (rootElement: Element) => {
  const yearUnparsed = grabSimpleValue(rootElement, 'date_pub');
  const possibleFormats = ['MMM dd, yyyy', 'yyyy'];

  const date = parseDate(yearUnparsed, possibleFormats);
  if (date) return date.getFullYear();
};

export const goodreadsApiSchema = defineExApiSchema({
  title: 'Text',
  author: 'Text',
  isbn: 'Text',
  year: 'Number',
  rating: 'Number',
  read: 'DatesPairCollection',
});

export type GoodreadsParsedBook = ExApiData<typeof goodreadsApiSchema>;

const parseBook = (rootElement: Element, dateFormat: string): GoodreadsParsedBook => {
  const book: GoodreadsParsedBook = {
    title: grabSimpleValue(rootElement, 'title'),
    author: grabSimpleValue(rootElement, 'author'),
    isbn: grabSimpleValue(rootElement, 'isbn13'),
    year: getYear(rootElement),
    rating: rootElement.getElementsByClassName('field rating')[0].getElementsByClassName('star on')
      .length,
    read: getDates(rootElement, dateFormat),
  };

  return book;
};

export const extractDataFromGoodreadsHTML = async (event: Event, rootPath: string) => {
  if (!event.target) return;
  const target = event.target as HTMLInputElement;

  if (!target.files) {
    return;
  }

  const parser = new DOMParser();

  const file = target.files[0];

  const fileContent = await readFileContent(file);

  console.log('aaa', typeof fileContent);
  if (typeof fileContent !== 'string') throw new Error('File content is not a string');

  const html = parser.parseFromString(fileContent, 'text/html');
  const booksBody = html.getElementById('booksBody');

  if (!booksBody) throw new Error('No books found');

  const result: GoodreadsParsedBook[] = [];

  for (const book of booksBody.children) {
    const b = parseBook(book, 'yyyy-MM-dd');
    console.log(b);
    result.push(b);
  }

  return result;
};

async function readFileContent(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}
