import { throttle } from 'lodash';

/*
 *  When listening for events on a folder it's sometimes impractical to apply all events in place.
 *  For example renaming folder with 100 files, will trigger 100 remove events and 100 add events.
 *  Hook listens for events and throttles their application. If event queue is over thresholdItems it just does a full refresh.
 */
export const useThrottledEvents = <TEv>(
  eventProcessor: (v: TEv[]) => void | Promise<void>,
  fullRefresh: () => void | Promise<void>,
  throttleMS: number,
  thresholdItems: number,
) => {
  const eventsQ = ref<TEv[]>([]) as Ref<TEv[]>;

  const processQueue = async (forceFull?: boolean) => {
    const toProcess = [...eventsQ.value];
    eventsQ.value = [];

    if (forceFull || eventsQ.value.length > thresholdItems) {
      await fullRefresh();
    } else {
      await eventProcessor(toProcess);
    }
  };

  const throttledProcessor = throttle(processQueue, throttleMS, {});

  const onEvent = (v: TEv) => {
    eventsQ.value.push(v);
    throttledProcessor();
  };

  return { onEvent, processQueue };
};
