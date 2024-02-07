// 改行をbrタグに変換する関数
export const toNodeWithBr = (text: string) => {
  return text.split("\n").map((str, index, arr) => {
    if (index === arr.length - 1) return str;
    else
      return (
        <span key={index}>
          {str}
          <br />
          {"\n"}
        </span>
      );
  });
};
