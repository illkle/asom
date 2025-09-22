import {
  zDynamicViewGroup,
  type IDynamicViewGroup,
} from '~/components/Modules/DynamicView/helpers';
import { makeUseConfigHook } from '~/utils/configFiles';

const disk = new ConfigTiedToSchema('viewLayout.json', zDynamicViewGroup, {
  type: 'group',
  id: 'root',
  style: { direction: 'row', gap: '4', align: 'start', justify: 'start', sizeUnits: '1' },
  content: [],
});

const VIEW_LAYOUT_KEY = (root: string | null | undefined, folderPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'viewLayout',
  folderPath,
];

export const useViewLayout = makeUseConfigHook(disk, VIEW_LAYOUT_KEY);

export const saveViewLayout = async (schemaOwnerFolder: string, viewLayout: IDynamicViewGroup) => {
  await disk.set(viewLayout, schemaOwnerFolder);
};
