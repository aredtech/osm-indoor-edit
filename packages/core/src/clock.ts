export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date()
};

export function fixedClock(isoString: string): Clock {
  const fixedDate = new Date(isoString);

  return {
    now: () => new Date(fixedDate.getTime())
  };
}

export function toIsoTimestamp(clock: Clock = systemClock): string {
  return clock.now().toISOString();
}

