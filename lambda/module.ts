import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer'
import { Readable } from 'stream'
const stringify = require('csv-stringify/lib/sync')

/**
 * ファイルダウンロード用関数
 */
export const downloadObject = async () => {
    
    console.log('Start download object !')

    // ファイルをダウンロードするバケットの設定
    const paramGetObject: AWS.S3.Types.GetObjectRequest = {
        Bucket: '**********',
        Key: 'latest.csv'
    }

    // 書き込み先のストリームを生成
    const dest = fs.createWriteStream('/tmp/latest.csv')
    
    // S3クライアントの定義
    const s3 = new AWS.S3()

    try{
        
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
 * Eメールを送信する関数
 */
export const sendEmail = async () => {
    
    console.log("Start end email ! ")

    // SESをnodemailerでラップ
    const transporter = nodemailer.createTransport({
        SES: new AWS.SES({
          apiVersion: '2010-12-01',
          region: 'ap-northeast-1'
        })
      });
    
    // メールの設定
    const mailOption: nodemailer.SendMailOptions = {
        from: '**********',
        to: '**********',
        subject: 'SES添付メールテスト',
        text: 'SESテストメッセージです。',
        attachments: [{
            filename: 'latest.csv',
            path: '/tmp/latest.csv',
        }]
    };
    
    try{
        
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
 *  Dynamodbからデータを全件取得取得する関数
 */ 
export const scanDynamodb = async () => {
    
    console.log('Start scan dynamodb !')

    // dynamodbのクライアントの生成
    const dynamodb = new AWS.DynamoDB.DocumentClient({region: 'us-east-2'})
    
    // dynamodbのクエリパラメータの定義
    const queryParam: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'sampletable'
    }

    try {
        
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
        fs.writeFileSync('/tmp/latest.csv', csvData)
        
        console.log('Success scan dynamodb !')    

    } catch(err) {
        console.log(err)
        throw err;
    }
}

/**
 * ファイルをアップロードする関数
 */
export const uploadFile = async () => {
    
    console.log('Start upload file !')

    // S3クライアントの定義
    const s3 = new AWS.S3()

    // S3バケットにアップロードするときのパラメータを定義
    const uploadParam: AWS.S3.Types.PutObjectRequest = {
        Bucket: '**********',
        Key: 'latest.csv',
        Body: fs.createReadStream('/tmp/latest.csv'),
        ContentType: 'text/csv'
    }
    try {
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