import { DateTime } from "luxon";
import { useEffect, useState } from "react";

export const CountDownTimer = (props: {
  end: DateTime;
  onFinish: () => void;
}) => {
  const now = DateTime.local();
  const diff = props.end.diff(now);
  const leftSec = diff.as("seconds");
  const getLabel = (leftSec: number) => {
    return leftSec > 60
      ? `${Math.floor(leftSec / 60)}分${Math.floor(leftSec % 60)}秒`
      : `${Math.floor(leftSec)}秒`;
  };
  const [leftLabel, setLeftLabel] = useState(getLabel(leftSec));
  useEffect(() => {
    const handler = setInterval(() => {
      const leftSec = props.end.diffNow().as("seconds");
      if (leftSec < 0) {
        // 終了イベントを投げて終了
        props.onFinish();
        clearInterval(handler);
      } else {
        setLeftLabel(getLabel(leftSec));
      }
    }, 100);
    return () => {
      clearInterval(handler);
    };
  }, []);
  return <span className=" text-lg">残り{leftLabel}</span>;
};

export default CountDownTimer;
