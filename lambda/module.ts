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

/**
 * dynamodbにデータを書き込む関数 (データはテストデータを使用)
 * @param dynamodb dynamodbクライアント
 * @param table_name テーブル名
 */
export const writeDynamodb = async (dynamodb: AWS.DynamoDB.DocumentClient, table_name: string) => {
    try {
        console.log('Start write dynamodb !')
        
        const testData = [
            {id: 1, content: 'こんにちは', good: 0},
            {id: 2, content: 'おはよう', good: 3},
            {id: 3, content: 'おやすみ', good: 3},
            {id: 4, content: 'good night', good: 9},
            {id: 5, content: 'さようなら', good: 100},
            {id: 11, content: 'こんにちは', good: 0},
            {id: 12, content: 'おはよう', good: 3},
            {id: 13, content: 'おやすみ', good: 3},
            {id: 14, content: 'good night', good: 9},
            {id: 15, content: 'さようなら', good: 100},
            {id: 21, content: 'こんにちは', good: 0},
            {id: 22, content: 'おはよう', good: 3},
            {id: 23, content: 'おやすみ', good: 3},
            {id: 24, content: 'good night', good: 9},
            {id: 25, content: 'さようなら', good: 100},
            {id: 31, content: 'こんにちは', good: 0},
            {id: 32, content: 'おはよう', good: 3},
            {id: 33, content: 'おやすみ', good: 3},
            {id: 34, content: 'good night', good: 9},
            {id: 35, content: 'さようなら', good: 100},
            {id: 41, content: 'こんにちは', good: 0},
            {id: 42, content: 'おはよう', good: 3},
            {id: 43, content: 'おやすみ', good: 3},
            {id: 44, content: 'good night', good: 9},
            {id: 45, content: 'さようなら', good: 100},
            {id: 51, content: 'こんにちは', good: 0},
            {id: 52, content: 'おはよう', good: 3},
            {id: 53, content: 'おやすみ', good: 3},
            {id: 54, content: 'good night', good: 9},
            {id: 55, content: 'さようなら', good: 100},
        ];

        // Dynamodbの仕様上、書き込みデータの最大は25個という制約がある
        // 書き込みデータが25個になるように調整
        const chunkedTestData = chunk(testData, 25)

        // dynamodbのクエリを作成
        const params: AWS.DynamoDB.DocumentClient.BatchWriteItemInput[] = 
            chunkedTestData.map((testdata: object[]) => {
                return makeBatchWriteItemInput(table_name, testdata)
            })
 
        console.log("Write dynamodb ...")
        
        // dynamodbへデータの書き込み
        for(const param of params) {
            await dynamodb.batchWrite(param).promise()
        }

        console.log("Success write dynamodb !")
    } catch(err) {
        console.log(err)
        throw err;
    }
}

/**
 * dynamodbのbatchWrite()を使用するときの引数を作成する関数
 * @param table_name テーブル名
 * @param data 書き込むデータ
 */
const makeBatchWriteItemInput = (table_name: string, data: object[]): AWS.DynamoDB.DocumentClient.BatchWriteItemInput => {

    // 書き込むデータごとにリクエストを生成
    const writeRequests = data.map((item: object): AWS.DynamoDB.DocumentClient.WriteRequest => {
        return {
            PutRequest: {
                Item: item
            }
        }
    })

    // どのテーブルに書き込むかという最終的なリクエストを生成
    const batchWriteItemInput: AWS.DynamoDB.DocumentClient.BatchWriteItemInput = {
        RequestItems: {
            [table_name]: writeRequests
        }
    }
    
    return batchWriteItemInput
}

/**
 * 配列を指定の個数で区切る関数
 * (lodash.chunk()をネイティブコードで実装した関数)
 * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_chunk
 * @param input 対象配列
 * @param size 指定サイズ
 */
const chunk = (input: any[], size: number) => {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
};

// const processAll = async () => {
//     const dynamodb =  new AWS.DynamoDB.DocumentClient({region: 'ap-northeast-1'})
//     const table = "mail-stream-sample"
//     await writeDynamodb(dynamodb, "mail-stream-table")
//     await scanDynamodb(dynamodb, "mail-stream-table", "latest.csv")
    
    
// }

// processAll()

