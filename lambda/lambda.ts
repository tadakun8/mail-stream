import * as AWS from 'aws-sdk';
import { downloadObject, sendEmail, scanDynamodb, uploadFile } from './module'

exports.handler = async function(event:any, context:any) {

  // Dynamodbから全件取得する
  await scanDynamodb()

  // 取得したデータをcsv形式でS3バケットにアップロード
  await uploadFile()

  // S3バケットからファイルをダウンロード
  await downloadObject()

  // Eメールを送る
  await sendEmail()

  return response(200, 'Plese Email.');
};

/**
 * レスポンスの定義
 * @param status HTTPステータス
 * @param body HTTPボディ
 */
const response = (status:number, body:string) => {
  var response = {
    statusCode: status,
    headers: {
      "Content-Type": "text/html"
    },
    body: body
  };
  return response;
};