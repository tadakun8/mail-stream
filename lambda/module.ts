import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer'
import { Readable } from 'stream'
// const streamapi = require('stream')
/**
 * ファイルダウンロード用関数
 */
export const downloadObject = async () => {
    console.log('Start download object !')

    // ファイルをダウンロードするバケットの設定
    const paramGetObject = {
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
    const mailOption = {
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
        // メールの送信
        console.log('Send email ...')
        await transporter.sendMail(mailOption)
        console.log('Success send email !');
    } catch(err) {
        console.log(err)
    }
}

