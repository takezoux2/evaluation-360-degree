import { DateTime } from "luxon";
import CountDownTimer from "../CountDownTimer";

export function ExamTimeBar({
  start,
  end,
  onFinish,
}: {
  start: DateTime;
  end: DateTime;
  onFinish: () => void;
}) {
  const totalSeconds = end.diff(start).as("seconds");
  const percent = end.diffNow().as("seconds") / totalSeconds;
  const barColor =
    percent > 0.3
      ? "bg-green-400"
      : percent > 0.1
      ? "bg-yellow-300"
      : "bg-red-600";
  return (
    <div className="flex flex-row">
      <div className="w-1/12"></div>
      <div className="w-9/12">
        <div className="h-full w-full place-items-end rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={"h-full rounded-full " + barColor}
            style={{ width: `${Math.floor(percent * 100)}%` }}
          ></div>
        </div>
      </div>
      <div className="w-2/12 px-2">
        <CountDownTimer end={end} onFinish={onFinish} />
      </div>
    </div>
  );
}

export default ExamTimeBar;
