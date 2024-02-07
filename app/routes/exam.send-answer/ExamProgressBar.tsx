export function ExamProgressBar(props: {
  current: number;
  max: number;
  onChangePage: (page: number) => void;
}) {
  const percentage = Math.floor((props.current / props.max) * 100);

  return (
    <div className="flex flex-row">
      <div className="w-1/12">
        {props.current > 1 && (
          <button
            onClick={() => props.onChangePage(props.current - 1)}
            className="h-full rounded-md bg-blue-300 px-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ←戻る
          </button>
        )}
      </div>
      <div className="w-9/12 align-middle">
        <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      <div className="w-1/12 text-center">{`${props.current}/${props.max}`}</div>
      <div className="w-1/12 object-right">
        {props.current < props.max && (
          <button
            onClick={() => props.onChangePage(props.current + 1)}
            className="h-full rounded-md bg-blue-300 px-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            進む→
          </button>
        )}
      </div>
    </div>
  );
}

export default ExamProgressBar;
