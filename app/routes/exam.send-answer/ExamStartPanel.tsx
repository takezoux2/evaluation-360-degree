export const ExamStartPanel = (props: {
  limitMinute: number;
  onStartExam: () => void;
}) => {
  return (
    <div className="flex flex-col">
      <div className="p-3">
        制限時間は
        <span className="text-2xl font-bold text-red-500">
          {props.limitMinute}分
        </span>
        です。
        <br />
        スキルテストを開始するとカウントダウンが始まります。
        <br />
        <span className=" text-red-500">
          制限時間をすぎると回答できなくなります。
        </span>
        <br />
        全問回答完了するとスキルテスト終了となります。
      </div>
      <div className="p-3 text-2xl">スキルテストを開始しますか？</div>
      <div className="px-10 py-3">
        <button
          className="rounded bg-sky-600 px-6 py-3 text-4xl font-bold text-white hover:bg-sky-700"
          onClick={props.onStartExam}
        >
          開始
        </button>
      </div>

      <div className="p-3">
        注意 <br />
        <ul className="list-disc">
          <li>受験期限内に回答完了できるようにしてください。</li>
          <li className="text-red-400">
            デバッグコンソールを開いている場合は、閉じてから受験を開始してください。
          </li>
          <li>各種チート行為は記録されるようになっています。</li>
          <li>
            チート行為と判断されるとスキルテストの点数は0点となり、懲戒処分の可能性もあります。
          </li>
          <li>
            変な操作を行った場合も、チート行為とみなされる可能性がありますので、ご注意ください。
          </li>
        </ul>
      </div>
    </div>
  );
};
