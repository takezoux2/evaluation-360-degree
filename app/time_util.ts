import * as luxon from "luxon";
export const toInputDateTimeLocal = (dateString: string) => {
  const d = luxon.DateTime.fromISO(dateString);

  return d.toFormat("yyyy-MM-dd'T'HH:mm");
};
