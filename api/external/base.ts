export type ApiResponseText = string;
export type ApiResponseTextCollection = string[];
export type ApiResponseNumber = number;
export type APiResponseDate = Date;
export type ApiResponseImageUrl = string;

export type ApiRespones =
  | ApiResponseText
  | ApiResponseTextCollection
  | ApiResponseNumber
  | APiResponseDate
  | ApiResponseImageUrl;

export type ApiResponse = {
  [key: string]: ApiRespones;
};

const makeExternalApi = <T extends ApiResponse, I>(fetch: (input: I) => Promise<T[]>) => {
  return {
    fetch,
  };
};
