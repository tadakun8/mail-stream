import * as AWS from 'aws-sdk';
import { table } from 'console';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer'
import { Readable } from 'stream'
const stringify = require('csv-stringify/lib/sync')

/**
 * S3バケットから指定したオブジェクトをダウンロードする関数
 * @param s3 s3クライアント
 * @param bucket_name ダウンロードするオブジェクトが格納されているバケット名
 * @param key_name ダウンロードするオブジェクトキー
 * @param donwload_path ダウンロード先
 */
export const downloadObject = async (s3: AWS.S3, bucket_name: string, key_name: string, donwload_path: string) => {
    try{
        
        console.log('Start download object !')

        // ファイルをダウンロードするバケットの設定
        const paramGetObject: AWS.S3.Types.GetObjectRequest = {
            Bucket: bucket_name,
            Key: key_name
        }

        // 書き込み先のストリームを生成
        const dest = fs.createWriteStream(donwload_path)

        console.log('Download object ...')

        // S3バケットからオブジェクトを取得
        const object = await s3.getObject(paramGetObject).promise()

        // 取得オブジェクトのストリームを生成
        const stream = Readable.from([object.Body?.toString()])

        // 送信先に保存
        stream.pipe(dest)

        console.log('Success Download !!')

    } catch (err) {
        console.log(err)
        throw err;  
    }
}


/**
 * 指定したファイル添付しメールを送信する関数
 * @param ses sesクライアント
 * @param from 送信元メールアドレス
 * @param to 送信先メールアドレス
 * @param subject 件名
 * @param text メール本文
 * @param attachment_file_name 添付ファイルの名前(どのようなファイル名で添付するか)
 * @param attachment_file_path 添付するファイルのファイルパス
 */
export const sendEmail = async (ses: AWS.SES, from: string, to: string, subject: string, text: string, attachment_file_name: string, attachment_file_path: string) => {
    
    try{
        
        console.log("Start end email ! ")

        // SESをnodemailerでラップ
        const transporter = nodemailer.createTransport({
            SES: ses
        });
        
        // メールの設定
        const mailOption: nodemailer.SendMailOptions = {
            from: from,
            to: to,
            subject: subject,
            text: text,
            attachments: [{
                filename: attachment_file_name,
                path: attachment_file_path,
            }]
        };
    
        console.log('Send email ...')

        // メールの送信
        await transporter.sendMail(mailOption)

        console.log('Success send email !');

    } catch(err) {
        console.log(err)
        throw err;
    }
}

/**
 * Dynamodbからデータを全件取得し、取得結果を指定したファイルに保存する関数
 * @param dynamodb dynamodbクライアント
 * @param table_name 操作するテーブル名
 * @param output_file_path 結果を保存するファイルパス
 */
export const scanDynamodb = async (dynamodb: AWS.DynamoDB.DocumentClient, table_name: string, output_file_path: string) => {
    
    try {
        
        console.log('Start scan dynamodb !')

        // dynamodbのクエリパラメータの定義
        const queryParam: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: table_name
        }

        console.log('scan dynamodb ...')

        // dynamodbを全件取得
        const data = await dynamodb.scan(queryParam).promise() 
        
        // csv変換の設定
        const csvParam = {
            header: true,
            columns: ['id', 'content', 'good']
        }
        
        // 取得データをcsv形式に変換
        const csvData = stringify(data.Items, csvParam)
        
        // 取得データをローカルに一時保存
        fs.writeFileSync(output_file_path, csvData)
        
        console.log('Success scan dynamodb !')    

    } catch(err) {
        console.log(err)
        throw err;
    }
}

/**
 * 指定したファイルをS3バケットにアップロードする関数
 * @param s3 s3クライアント
 * @param bucket_name アップロード先のバケット名
 * @param key_name アップロードファイル名(どのようなキーでアップロードするか)
 * @param upload_file_path アップロードするファイルのファイルパス
 */
export const uploadFile = async (s3: AWS.S3, bucket_name: string, key_name: string, upload_file_path: string) => {
    
    try {
        
        console.log('Start upload file !')

        // S3バケットにアップロードするときのパラメータを定義
        const uploadParam: AWS.S3.Types.PutObjectRequest = {
            Bucket: bucket_name,
            Key: key_name,
            Body: fs.createReadStream(upload_file_path),
            ContentType: 'text/csv'
        }
        // 
        await s3.putObject(uploadParam).promise()
    } catch(err) {
        console.log(err)
        throw err;
    }
}


// const processAll = async () => {
//     await scanDynamodb()
//     await uploadFile()
// }

// processAll()