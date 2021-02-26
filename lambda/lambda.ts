import * as AWS from 'aws-sdk';
import { downloadObject, sendEmail, scanDynamodb, uploadFile, writeDynamodb } from './module'

// AWSサービスクライアント
const s3 = new AWS.S3()
const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: 'ap-northeast-1'
})
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: 'ap-northeast-1'
})

const BUCKET_NAME = process.env.BUCKET_NAME
const DOWNLOAD_KEY_NAME = 'latest.csv'
const DOWNLOAD_PATH = '/tmp/latest.csv'
const TABLE_NAME = process.env.TABLE_NAME
const QUERY_OUTPUT_FILE_PATH = "/tmp/latest.csv"
const UPLOAD_KEY_NAME = 'latest.csv'
const FROM = "**********"
const TO = "**********"
const SUBJECT = "SESの送信"
const TEXT = "SESから送信されました"
const ATTACHMENT_FILE_NAME = 'latest.csv'
const ATTACHMENT_FILE_PATH = '/tmp/latest.csv'

exports.handler = async (event:any, context:any, callback: Function) => {

  // Dynamodbにデータを格納する
  await writeDynamodb(dynamodb, TABLE_NAME)

  // Dynamodbから全件取得する
  await scanDynamodb(dynamodb, TABLE_NAME, QUERY_OUTPUT_FILE_PATH)

  // 取得したデータをcsv形式でS3バケットにアップロード
  await uploadFile(s3, BUCKET_NAME, UPLOAD_KEY_NAME, QUERY_OUTPUT_FILE_PATH)

  // S3バケットからファイルをダウンロード
  await downloadObject(s3, BUCKET_NAME, DOWNLOAD_KEY_NAME, DOWNLOAD_PATH)

  // Eメールを送る
  await sendEmail(ses, FROM, TO, SUBJECT, TEXT, ATTACHMENT_FILE_NAME, ATTACHMENT_FILE_PATH)

  return response(200, 'Please check email.');
};

/**
 * レスポンスの定義
 * @param status HTTPステータス
 * @param body HTTPボディ
 */
const response = (status:number, body:string) => {
  const response = {
    statusCode: status,
    headers: {
      "Content-Type": "text/html"
    },
    body: body
  };
  return response;
};