import { DateTime } from "luxon";
import CountDownTimer from "../../components/CountDownTimer";
import { useEffect, useState } from "react";

export function ExamTimeBar({
  start,
  end,
  onFinish,
}: {
  start: DateTime;
  end: DateTime;
  onFinish: () => void;
}) {
  const [percent, setPersent] = useState(0.5);
  useEffect(() => {
    const handler = setInterval(() => {
      const percent = (end.diffNow().as("seconds") / totalSeconds) * 100;
      if (percent < 0) {
        clearInterval(handler);
      } else {
        setPersent(percent);
      }
    }, 500);
    return () => {
      clearInterval(handler);
    };
  }, []);
  const totalSeconds = end.diff(start).as("seconds");
  const barColor =
    percent > 30
      ? "bg-green-400"
      : percent > 10
      ? "bg-yellow-300"
      : "bg-red-600";
  return (
    <div className="flex flex-row">
      <div className="w-1/12"></div>
      <div className="w-9/12">
        <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={"h-full rounded-full " + barColor}
            style={{ width: `${percent}%` }}
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
