export const FILENAME_REGEX = /[\\/:"*?<>|]+/g;
export const DOTFILE_REGEX = /(?:^|[\\/])(\.(?!\.)[^\\/]+)$/;
export const DOTDIR_REGEX = /(?:^|[\\/])(\.(?!\.)[^\\/]+)[\\/]/;
export const NUMBERS_REGEX = /[^0-9.]/g;

// https://isbn-information.com/convert-isbn-10-to-isbn-13.html
export const ISBN10to13 = (isbn: number) => {
  const isbnS = String(isbn);

  if (isbnS.length != 10) {
    throw 'Incorrect ISBN passed';
  }

  const numbers = [9, 7, 8, ...isbnS.split('').map((el) => Number(el))];
  numbers.pop();

  const checkTotal = numbers.reduce((prev, current, index) => {
    return prev + (index % 2 === 0 ? current * 3 : current);
  }, 0);

  numbers.push(10 - (checkTotal % 10));

  return Number(numbers.join(''));
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
