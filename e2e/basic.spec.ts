import { $, browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import fs from 'fs/promises';
import path from 'path';
import ShortUniqueId from 'short-unique-id';
import {
  setDateFieldValue,
  setNumberFieldValue,
  setTextCollectionFieldValue,
  setTextFieldValue,
} from './inputSetters';

const uid = new ShortUniqueId({ length: 10 });

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

const inputTypes = [
  'Text',
  'TextCollection',
  'Number',
  'Date',
  'DateCollection',
  'DatesPairCollection',
  'Image',
];

describe('Essential flow', () => {
  it('Complete onboarding', async () => {
    await waitForPageToLoad();

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

    for (let i = 0; i < 7; i++) {
      await (await $('button*=Add')).click();
    }

    const schemaItems = await main.$$('[data-schema-item]');

    await expect(schemaItems.length).toBe(7);

    for (let i = 0; i < inputTypes.length; i++) {
      const t = schemaItems[i];

      // target input by placeholder "Key"
      const nameinput = await t.$('input[placeholder="Name"]');
      await nameinput.setValue('testfield-' + inputTypes[i]);

      const typeSelect = await t.$('[data-select-type]');

      await expect(typeSelect).toBeExisting();
      await typeSelect.click();

      //data-slot="select-trigger"
      const typeSelectTrigger = await t.$('[data-slot="select-trigger"]');

      // data-slot="select-item"
      const buttonInPopper = await popperWrapper.$('[data-slot="select-item"]*=' + inputTypes[i]);
      await buttonInPopper.click();

      await expect(typeSelectTrigger).toHaveText(inputTypes[i]);
    }

    await (await $('button*=Save')).click();
  });

  it('Create file in newly created schema', async () => {
    const sidebar = await $('[data-sidebar="content"]');

    await (await sidebar.$('button*=Create')).click();

    const modal = await $('[data-dismissable-layer]');

    const ultimaSchemaButton = await modal.$('button*=ultimateSchema');
    await expect(ultimaSchemaButton).toBeExisting();
    await ultimaSchemaButton.click();

    const input = await modal.$('input');
    await expect(input).toBeExisting();
    await input.setValue('testFile');

    const createButton = await modal.$('button[data-button-create]');
    await expect(createButton).toBeExisting();

    await createButton.click();

    const main = await $('main');

    await expect(main).toHaveText(expect.stringContaining('testFile.md'));

    await expect(main).toHaveText(
      expect.stringContaining('All schema items are hidden in current layout'),
    );
  });

  it('Add schema items to layout', async () => {
    const main = await $('main');

    await (await main.$('button*=Edit Layout')).click();

    await expect(main).toHaveText(expect.stringContaining('Layout editor'));

    const configButton = await $('[data-group-config-button]');
    await expect(configButton).toBeExisting();
    await configButton.click();

    const modal = await $('[data-dismissable-layer]');
    await expect(modal).toBeExisting();

    const directionSelect = await modal.$('div*=Direction');
    await expect(directionSelect).toBeExisting();
    await directionSelect.moveTo({ xOffset: 5, yOffset: 5 });
    await directionSelect.click();

    const clmn = await modal.$('div*=Column');
    await expect(clmn).toBeExisting();
    await clmn.moveTo({ xOffset: 5, yOffset: 5 });
    await clmn.click();

    const dropTargetFirst = await $('[data-drop-target]');
    const dropTargetSecond = await $('[data-orderable]');
    let isFirst = true;

    for (const t of inputTypes) {
      await browser.pause(250); // animations
      const item = await main.$(`[data-input-for="testfield-${t}"]`);
      await expect(item).toBeExisting();

      if (isFirst) {
        await expect(dropTargetFirst).toBeExisting();
      } else {
        await expect(dropTargetSecond).toBeExisting();
      }

      const sourceLocation = await item.getLocation();
      const targetLocation = isFirst
        ? await dropTargetFirst.getLocation()
        : await dropTargetSecond.getLocation();

      await browser.performActions([
        {
          type: 'pointer',
          id: 'mouse1',
          parameters: { pointerType: 'mouse' },
          actions: [
            {
              type: 'pointerMove',
              duration: 0,
              x: Math.floor(sourceLocation.x + 10),
              y: Math.floor(sourceLocation.y + 10),
            },
            { type: 'pointerDown', button: 0 },
            {
              type: 'pointerMove',
              duration: 100,
              x: Math.floor(targetLocation.x + 10),
              y: Math.floor(targetLocation.y + 10),
            },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ]);

      if (isFirst) {
        isFirst = false;
      }
    }

    await expect(main).toHaveText(expect.stringContaining('Unused items: 0'));
  });

  it('Update file using editor', async () => {
    const main = await $('main');

    const backButton = await $('[data-button-back]');
    await expect(backButton).toBeExisting();
    await backButton.click();

    await expect(main).toHaveText(expect.stringContaining('testFile.md'));

    const textField = await main.$('[data-input-for="testfield-Text"]');
    const numberField = await main.$('[data-input-for="testfield-Number"]');
    const textCollectionField = await main.$('[data-input-for="testfield-TextCollection"]');
    const dateField = await main.$('[data-input-for="testfield-Date"]');
    const dateCollectionField = await main.$('[data-input-for="testfield-DateCollection"]');
    const datesPairCollectionField = await main.$(
      '[data-input-for="testfield-DatesPairCollection"]',
    );
    const imageField = await main.$('[data-input-for="testfield-Image"]');

    await expect(textField).toBeExisting();
    await expect(numberField).toBeExisting();
    await expect(textCollectionField).toBeExisting();
    await expect(dateField).toBeExisting();
    await expect(dateCollectionField).toBeExisting();
    await expect(datesPairCollectionField).toBeExisting();
    await expect(imageField).toBeExisting();

    await setTextFieldValue(textField, 'testValue');
    await setNumberFieldValue(numberField, 123);

    await setTextCollectionFieldValue(textCollectionField, ['testValue', 'testValue2']);

    await setDateFieldValue(dateField, 2024, 2, 14);
    await expect(dateField).toHaveText(expect.stringContaining('14 Mar 2024'));
  });
});
