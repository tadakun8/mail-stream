import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import apigw = require('@aws-cdk/aws-apigatewayv2');
import integrations = require('@aws-cdk/aws-apigatewayv2-integrations');
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam')
import { CONST } from './config'

export class MailStreamStack extends cdk.Stack {
  
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    
    super(scope, id, props);
    
    // Lambda関数の作成
    const lambdaFunction = new lambda.Function(this, 'Lambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'lambda.handler',
      environment: {
        TABLE_NAME: CONST.TABLE_NAME,
        BUCKET_NAME: CONST.BUCKET_NAME
      }
    });
    
    // DynamoDBの作成
    const table = new dynamodb.Table(this, 'Dynamodb', {
      tableName: CONST.TABLE_NAME,
      partitionKey: { name: CONST.PARTITION_KEY_NAME , type: dynamodb.AttributeType.NUMBER }
    });

    // Lambda関数にDynamodbに対するread/write権限を付与
    table.grantReadWriteData(lambdaFunction);

    // APIGatewayの作成
    const apiGateway = new apigw.HttpApi(this, 'ApiGateway', {
      defaultIntegration: new integrations.LambdaProxyIntegration({
        handler: lambdaFunction
      })
    });
    
    // ファイル格納用S3バケットの作成
    const bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName: CONST.BUCKET_NAME
    })

    // Lambda関数にS3バケットに対するread/write権限を付与
    bucket.grantReadWrite(lambdaFunction)

    // Lambda関数がSESのメール送信機能を使えるポリシーの作成
    const sesPolicy = new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
      effect: iam.Effect.ALLOW
    })

    // Lambda関数にメール送信機能の権限を付与
    lambdaFunction.addToRolePolicy(sesPolicy)

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: apiGateway.url ?? 'Something went wrong with the deploy'
    });
  }
}
