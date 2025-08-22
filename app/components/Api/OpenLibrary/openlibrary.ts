import { fetch } from '@tauri-apps/plugin-http';
import z from 'zod';

const zBook = z.object({
  title: z.string(),
  author_name: z.array(z.string()).optional(),
  first_publish_year: z.number().optional(),
  cover_i: z.number().optional(),
  editions: z.object({
    docs: z.array(
      z.object({
        key: z.string(),
        title: z.string(),
        cover_i: z.number().optional(),
      }),
    ),
  }),
  isbn: z.array(z.string()).optional(),
  key: z.string(),
});

type Book = z.infer<typeof zBook>;

const searchBooks = async ({
  yourEmail,
  query,
  signal,
}: {
  yourEmail: string;
  query: string;
  signal: AbortSignal;
}) => {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${query}&fields=title,author_name,first_publish_year,cover_i,isbn,key,editions&lang=en&limit=20`,
    {
      headers: {
        'User-Agent': `asom app by illkle.com | user provided email: ${yourEmail}`,
      },
      signal,
    },
  );

  const json = await res.json();
  console.log('BOOKS JSON', json.docs);

  try {
    const books = z.array(zBook).parse(json?.docs ?? []);
    return books;
  } catch (e) {
    console.error('error', e);
    return json.docs as Book[];
  }
};

export const getBooksFromOpenLibrary = async ({
  yourEmail,
  query,
  signal,
}: {
  yourEmail: string;
  query: string;
  signal: AbortSignal;
}) => {
  if (!query) return [];

  const books = await searchBooks({ yourEmail, query, signal });

  return books;
};

const zEdition = z.object({
  isbn_13: z.array(z.string()).optional(),
  publish_date: z.string().optional(),
  title: z.string().optional(),
  full_title: z.string().optional(),
  covers: z.array(z.string()).optional(),
});

const getEditions = async ({
  yourEmail,
  key,
  signal,
}: {
  yourEmail: string;
  key: string;
  signal: AbortSignal;
}) => {
  const res = await fetch(`https://openlibrary.org/${key}/editions.json?limit=10`, {
    headers: {
      'User-Agent': `asom app by illkle.com | user provided email: ${yourEmail}`,
    },
    signal,
  });

  const json = await res.json();

  console.log('json', json);

  const books = z.array(zEdition).parse(json?.entries ?? []);

  return books;
};

export const getEditionsFromOpenLibrary = async ({
  yourEmail,
  key,
  signal,
}: {
  yourEmail: string;
  key: string;
  signal: AbortSignal;
}) => {
  const editions = await getEditions({ yourEmail, key, signal });

  return editions;
};
