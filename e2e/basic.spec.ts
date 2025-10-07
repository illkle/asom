import { $, browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import fs from 'fs/promises';
import path from 'path';
import ShortUniqueId from 'short-unique-id';
const uid = new ShortUniqueId({ length: 10 });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForPageToLoad = async () => {
  await browser.waitUntil(
    async () => {
      const state = await browser.execute(() => document.readyState);
      return state === 'complete';
    },
    {
      timeout: 10000, // how long to wait (in ms)
      timeoutMsg: 'Page did not load completely within 10s',
    },
  );
};

const pasteToRootInput = async (text: string) => {
  const input = await $('input#rootPathE2E');
  await input.setValue(text);
};

const createDirectoryForTest = async () => {
  const directory = path.join(process.cwd(), 'e2e', 'temp', uid.randomUUID());

  await fs.mkdir(directory, { recursive: true });

  return directory;
};

const checkTextOnPage = async (text: string) => {
  await expect($('body')).toHaveText(expect.stringContaining(text));
};

describe('Essential flow', () => {
  it('Complete onboarding', async () => {
    await waitForPageToLoad();

    await sleep(10000);

    const directory = await createDirectoryForTest();
    await pasteToRootInput(directory);

    const b = await $('button*=Set Root Path');
    await b.click();

    const b2 = await $('button*=Setup books, movies and games folders');

    await b2.click();

    await checkTextOnPage('You have nothing opened');

    await (await $('button*=Root Path & Schemas')).click();

    const main = await $('main');
    await expect(main).toHaveText(expect.stringContaining('Books'));
    await expect(main).toHaveText(expect.stringContaining('Games'));
    await expect(main).toHaveText(expect.stringContaining('Movies'));
  });

  it('Create new folder and add default schema', async () => {
    await (await $('button*=Root Path & Schemas')).click();
    const main = await $('main');

    await (await main.$('button*=Create Folder')).click();
    const modal = await $('[data-dismissable-layer]');

    const input = await modal.$('input');
    await input.setValue('userCreatedFolder');

    await (await modal.$('button*=Create')).click();

    await expect(main).toHaveText(expect.stringContaining('userCreatedFolder'));

    const newFolderContainer = await main.$('li*=userCreatedFolder');

    await newFolderContainer.waitForExist();

    await expect(newFolderContainer).not.toHaveText(expect.stringContaining('Schema Owner'));

    await (await newFolderContainer).click({ button: 'right' });

    const popperWrapper = await $('[data-reka-popper-content-wrapper]');

    await (await popperWrapper.$('div*=Create From Template')).moveTo();
    await (await popperWrapper.$('div*=Books')).click();

    await expect(newFolderContainer).toHaveText(expect.stringContaining('Schema Owner'));

    await (await newFolderContainer).click({ button: 'right' });

    await (await popperWrapper.$('div*=Delete Schema')).click();
    await expect(newFolderContainer).not.toHaveText(expect.stringContaining('Schema Owner'));

    await (await newFolderContainer).click({ button: 'right' });

    await (await popperWrapper.$('div*=Delete Folder')).click();
    await expect(newFolderContainer).not.toBeExisting();
  });

  it('Create new folder and assign schema with every item type', async () => {
    await (await $('button*=Root Path & Schemas')).click();
    const main = await $('main');
    await (await main.$('button*=Create Folder')).click();

    const modal = await $('[data-dismissable-layer]');

    const input = await modal.$('input');
    await input.setValue('ultimateSchema');

    await (await modal.$('button*=Create')).click();

    await expect(main).toHaveText(expect.stringContaining('ultimateSchema'));

    const ultimateSchemaContainer = await main.$('li*=ultimateSchema');

    await expect(ultimateSchemaContainer).not.toHaveText(expect.stringContaining('Schema Owner'));

    await (await ultimateSchemaContainer).click({ button: 'right' });

    const popperWrapper = await $('[data-reka-popper-content-wrapper]');

    await (await popperWrapper.$('div*=Create Schema')).click();

    await ultimateSchemaContainer.$('button=Schema').click();

    await expect(main).toHaveText(expect.stringContaining('Schema editor'));

    // TODO
  });
});
