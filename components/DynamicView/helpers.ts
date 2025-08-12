import z from 'zod/v4';
import type { ItemInfoCore, PointQuadrant } from '~/components/NestedDrag/common';

export const zLayoutItem = z.object({
  id: z.string(),
  type: z.literal('item'),
});

export const zDynamicViewGroup = z.object({
  type: z.literal('group'),
  id: z.string(),
  style: z.object({
    direction: z.enum(['row', 'column']).default('row'),
    gap: z.string().default('0'),
    align: z.enum(['start', 'center', 'end']).default('start'),
    justify: z
      .enum(['start', 'center', 'end', 'between', 'around', 'evenly'])
      .optional()
      .default('start'),
    sizeUnits: z.string().default('1'),
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
    flex: `${group.style.sizeUnits} 1 0`,
  };
};

const locateParent = (data: IDynamicViewGroup, info: ItemInfoCore): IDynamicViewGroup => {
  let parent = data;
  while (info.parentIds.length > 0) {
    const parentId = info.parentIds.shift();
    if (!parentId) {
      throw new Error('Error when locating parent on shift');
    }
    const g = parent.content.find((item) => item.id === parentId);
    if (!g) {
      throw new Error('Parent ID not found');
    }

    if (g.type !== 'group') {
      throw new Error('Parent ID is not a group');
    }

    parent = g;
  }
  return parent;
};

export const findAndRemoveItem = (
  data: IDynamicViewGroup,
  info: ItemInfoCore,
): IDynamicItem | undefined => {
  let parent = locateParent(data, info);

  const index = parent.content.findIndex((item) => item.id === info.id);

  const removedItem = parent.content.splice(index, 1)[0];

  return removedItem;
};

export const insertItemIntoGroup = (
  data: IDynamicViewGroup,
  itemToInsert: IDynamicItem,
  info: ItemInfoCore,
  quadrant: PointQuadrant,
): boolean => {
  let parent = locateParent(data, info);

  const index = parent.content.findIndex((item) => item.id === info.id);
  const isBefore = parent.style.direction === 'row' ? quadrant.x === 'left' : quadrant.y === 'top';

  const pointerToUpdated = clamp(isBefore ? index : index + 1, 0, parent.content.length);

  parent.content.splice(pointerToUpdated, 0, itemToInsert);
  return true;
};

export const swapItems = (
  data: IDynamicViewGroup,
  from: ItemInfoCore,
  to: ItemInfoCore,
  quadrant: PointQuadrant,
) => {
  const parentFrom = locateParent(data, from);
  const parentTo = locateParent(data, to);

  const pointerFrom = parentFrom.content.findIndex((item) => item.id === from.id);
  const resFrom = parentFrom.content.splice(pointerFrom, 1);

  const pointerTo = parentTo.content.findIndex((item) => item.id === to.id);

  const isBefore =
    parentTo.style.direction === 'row' ? quadrant.x === 'left' : quadrant.y === 'top';

  const pointerToUpdated = clamp(isBefore ? pointerTo : pointerTo + 1, 0, parentTo.content.length);

  parentTo.content.splice(pointerToUpdated, 0, ...resFrom);
};

export const getFlatItems = (group: IDynamicViewGroup): IDynamicItem[] => {
  const items: IDynamicItem[] = [];
  for (let i = 0; i < group.content.length; i++) {
    const item = group.content[i];
    if (!item) {
      continue;
    }
    if (item.type === 'group') {
      items.push(...getFlatItems(item));
    } else {
      items.push(item);
    }
  }
  return items;
};
