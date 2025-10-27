import { $, browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';

export const setTextFieldValue = async (field: ChainablePromiseElement, value: string) => {
  await expect(field).toBeExisting();
  await field.click();
  await field.setValue(value);
};

export const setNumberFieldValue = async (field: ChainablePromiseElement, value: number) => {
  const input = await field.$('input');
  await expect(input).toBeExisting();
  await input.click();
  await input.setValue(value);
};

export const setTextCollectionFieldValue = async (
  field: ChainablePromiseElement,
  value: string[],
) => {
  const input = await field.$('input');
  await expect(input).toBeExisting();
  await input.click();

  for (const v of value) {
    await input.setValue(v);
    await browser.keys('Enter');
  }
};

const monthNamesShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const setDateFieldValue = async (
  field: ChainablePromiseElement,
  year: number,
  month: number,
  day: number,
) => {
  await field.click();

  const modal = await $('[data-dismissable-layer]');
  await expect(modal).toBeExisting();

  const monthSelectTrigger = await modal.$('[data-calendar-month-select-trigger]');
  await expect(monthSelectTrigger).toBeExisting();
  await monthSelectTrigger.click();

  const selectViewPort = await $('[data-reka-select-viewport]');
  await expect(selectViewPort).toBeExisting();

  const selectItem = await selectViewPort.$(`span*=${monthNamesShort[month]}`);
  await expect(selectItem).toBeExisting();
  await selectItem.click();

  const yearInputWrapper = await modal.$('[data-calendar-year-input]');
  await expect(yearInputWrapper).toBeExisting();
  const yearInput = await yearInputWrapper.$('input');
  await expect(yearInput).toBeExisting();
  await yearInput.click();
  await yearInput.setValue(year.toString());
  await browser.keys('Enter');

  const dayButton = await modal.$(`button*=${day}`);
  await dayButton.click();
};
