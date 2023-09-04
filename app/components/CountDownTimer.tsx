import { DateTime } from "luxon";
import { useEffect, useState } from "react";

export const CountDownTimer = (props: { end: DateTime }) => {
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
      setLeftLabel(getLabel(props.end.diffNow().as("seconds")));
    }, 100);
    return () => {
      clearInterval(handler);
    };
  }, []);
  return <>残り{leftLabel}</>;
};

export default CountDownTimer;
