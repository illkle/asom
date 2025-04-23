import z from 'zod';

export const zLayoutItem = z.interface({
  id: z.string(),
  type: z.literal('item'),
});

export const zDynamicViewGroup = z.interface({
  type: z.literal('group'),
  id: z.string(),
  style: z.interface({
    direction: z.enum(['row', 'column']).default('row'),
    gap: z.string().default('0'),
    align: z.enum(['start', 'center', 'end']).default('start'),
    justify: z
      .enum(['start', 'center', 'end', 'between', 'around', 'evenly'])
      .optional()
      .default('start'),
  }),
  get content() {
    return z.array(zDynamicViewGroup.or(zLayoutItem));
  },
});

export type ILayoutItem = z.infer<typeof zLayoutItem>;

export const zDynamicItem = z.discriminatedUnion('type', [zLayoutItem, zDynamicViewGroup]);

export type IDynamicViewGroup = z.infer<typeof zDynamicViewGroup>;

export type IDynamicItem = z.infer<typeof zDynamicItem>;

export const mapAlign: Record<IDynamicViewGroup['style']['align'], string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

export const mapJustify: Record<IDynamicViewGroup['style']['justify'], string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

export const getStyle = (group: IDynamicViewGroup) => {
  return {
    display: 'flex',
    flexDirection: group.style.direction,
    gap: group.style.gap + 'px',
    alignItems: mapAlign[group.style.align],
    justifyContent: mapJustify[group.style.justify],
  };
};

export const findItem = (data: IDynamicItem, targetId: string): IDynamicItem => {
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

export const findAndRemoveItem = (
  data: IDynamicViewGroup,
  targetId: string,
): IDynamicItem | undefined => {
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
  data: IDynamicViewGroup,
  itemToInsert: IDynamicItem,
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

export const getFlatItems = (group: IDynamicViewGroup): IDynamicItem[] => {
  const items: IDynamicItem[] = [];
  for (let i = 0; i < group.content.length; i++) {
    const item = group.content[i];
    if (item.type === 'group') {
      items.push(...getFlatItems(item));
    } else {
      items.push(item);
    }
  }
  return items;
};
