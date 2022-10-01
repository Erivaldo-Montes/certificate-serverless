import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "certificate-ignite",
  frameworkVersion: "3",
  // referencias dos plugin serverless
  plugins: [
    "serverless-esbuild",
    "serverless-dynamodb-local",
    "serverless-offline",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    region: "us-east-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    // permisão para o usuário acessar o dynamo
    iam: {
      role: {
        statements: [
          // permisão para o usuário acessar o dynamo
          {
            Effect: "Allow",
            Action: ["dynamodb:*"],
            Resource: "*",
          },
          // Permisão para o usuário acessar o S3
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: "*",
          },
        ],
      },
    },
  },
  // inclui a pasta templates no build
  package: { individually: false, patterns: ["./src/templates/**"] },

  // import the function via paths
  functions: {
    generateCertificate: {
      handler: "src/functions/generateCertificate.handler",
      timeout: 60,
      events: [
        {
          http: {
            path: "generateCertificate",
            method: "post",
            cors: true,
          },
        },
      ],
    },
    verifyCertificate: {
      handler: "src/functions/verifyCertificate.handler",
      timeout: 60,
      events: [
        {
          http: {
            path: "verifyCertificate/{id}",
            method: "get",
            cors: true,
          },
        },
      ],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      external: ["chrome-aws-lambda"],
    },
    // dynamo redar na maquina local
    dynamodb: {
      stages: ["dev", "local"],
      start: {
        migrate: true,
        port: 8000,
        inMemory: true,
      },
    },
  },
  resources: {
    Resources: {
      // instaciar bancos
      dbCertificatesUsers: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          // tabela no banco
          TableName: "users_certificate",
          // capacidade do banco de dados
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
