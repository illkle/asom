export type ContentItem = {
  id: string;
  type: 'string';
  data: string;
};

export type ContentGroup = {
  id: string;
  type: 'group';
  content: Item[];
};

export type Item = ContentItem | ContentGroup;

export const sampleData: ContentGroup = {
  id: 'root',
  type: 'group',
  content: [
    { id: '1133', type: 'string', data: '1133' },
    { id: '2123', type: 'string', data: '2123' },
    { id: '3414', type: 'string', data: '3414' },
    {
      id: 'sub11',
      type: 'group',
      content: [
        { id: '1337', type: 'string', data: '1337' },
        { id: '224', type: 'string', data: '224' },
      ],
    },
  ],
};

export const findItem = (data: Item, targetId: string): Item => {
  if (data.id === targetId) {
    return data;
  }

  if (data.type === 'group' && Array.isArray(data.content)) {
    for (let i = 0; i < data.content.length; i++) {
      const item = data.content[i];
      if (item.id === targetId) {
        return item;
      }
      if (item.type === 'group' && Array.isArray(item.content)) {
        const foundItem = findItem(item, targetId);
        if (foundItem) {
          return foundItem;
        }
      }
    }
  }
  throw new Error('Item not found');
};

export const findAndRemoveItem = (data: ContentGroup, targetId: string): Item | undefined => {
  for (let i = 0; i < data.content.length; i++) {
    const item = data.content[i];
    if (item.id === targetId) {
      const removedItem = data.content.splice(i, 1)[0];
      return removedItem;
    }
    if (item.type === 'group' && Array.isArray(item.content)) {
      const foundItem = findAndRemoveItem(item, targetId);
      if (foundItem) {
        return foundItem;
      }
    }
  }
  return undefined;
};

export const insertItemIntoGroup = (
  data: ContentGroup,
  itemToInsert: Item,
  targetGroupId: string,
  index: number,
): boolean => {
  if (data.id === targetGroupId) {
    data.content.splice(index, 0, itemToInsert);
    return true;
  }

  for (let i = 0; i < data.content.length; i++) {
    const currentItem = data.content[i];

    if (currentItem.type === 'group' && currentItem.id === targetGroupId) {
      const saved = currentItem.content[index];
      currentItem.content.splice(index, 0, itemToInsert);
      return true;
    }

    if (currentItem.type === 'group') {
      const inserted = insertItemIntoGroup(currentItem, itemToInsert, targetGroupId, index);
      if (inserted) {
        return true;
      }
    }
  }

  return false;
};
