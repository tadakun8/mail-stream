import * as AWS from 'aws-sdk';
import { downloadObject, sendEmail } from './module'

exports.handler = async function(event:any, context:any) {

  // S3からファイルをダウンロード
  await downloadObject()

  // Eメールを送る
  await sendEmail()

  return response(200, 'You have connected with the Lambda!');
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