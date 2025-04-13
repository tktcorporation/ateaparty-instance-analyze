/**
 * 定期実行されるサンプルTypeScriptスクリプト
 */

// 現在の日時を取得
const currentDate = new Date();

// 実行情報を出力
console.log(`スクリプト実行時刻: ${currentDate.toLocaleString('ja-JP')}`);
console.log('これはGitHub Actionsで定期実行されるTypeScriptスクリプトです。');

// サンプル機能: 日付情報の表示
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}年${month}月${day}日 ${hours}時${minutes}分${seconds}秒`;
};

console.log(`フォーマット済み日時: ${formatDate(currentDate)}`);

// サンプル機能: 簡単な計算処理
const calculateDaysDifference = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const nextMonth = new Date(currentDate);
nextMonth.setMonth(currentDate.getMonth() + 1);

console.log(`今日から1ヶ月後までの日数: ${calculateDaysDifference(currentDate, nextMonth)}日`);

// スクリプトの処理が終了したことを示すメッセージ
console.log('スクリプトの実行が完了しました。');
