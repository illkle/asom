import type { AttrValue, DatePair, SchemaItem } from '~/types';

const sampleDate = '2020-05-04';
const sampleText = 'Sample text';
const sampleTextCollection = ['Hello', 'World'];
const sampleNumber = 123;
const sampleDateCollection = ['2020-05-04', '2020-05-05'];
const sampleDatesPairCollection = [
  { started: '2025-05-04', finished: '2025-05-05' },
  { started: '2025-05-06', finished: '2025-05-07' },
] as DatePair[];
const sampleImage = '';

export const getValByType = (type: SchemaItem['value']['type']) => {
  switch (type) {
    case 'Date':
      return {
        type: 'String',
        value: sampleDate,
      } as AttrValue;
    case 'Text':
      return {
        type: 'String',
        value: sampleText,
      } as AttrValue;
    case 'TextCollection':
      return {
        type: 'StringVec',
        value: sampleTextCollection,
      } as AttrValue;
    case 'Number':
      return {
        type: 'Float',
        value: sampleNumber,
      } as AttrValue;
    case 'DateCollection':
      return {
        type: 'StringVec',
        value: sampleDateCollection,
      } as AttrValue;
    case 'DatesPairCollection':
      return {
        type: 'DatePairVec',
        value: sampleDatesPairCollection,
      } as AttrValue;
    case 'Image':
      return {
        type: 'String',
        value: sampleImage,
      } as AttrValue;
  }
};
