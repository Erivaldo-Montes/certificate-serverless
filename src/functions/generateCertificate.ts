import chromium from "chrome-aws-lambda";
import handlebars from "handlebars";
import dayjs from "dayjs";
import { readFileSync } from "fs";
import { S3 } from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { join } from "path";
import { document } from "../utils/dynamodbClient";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  grade: string;
  medal: string;
  date: string;
}

// insere as variaveis no template do handlebars
const compile = async (data: ITemplate) => {
  // process.cwd - retorna a pasta raiz do projeto.
  const template = join(process.cwd(), "src", "templates", "certificate.hbs");

  // ler o arquivo em forma de texto
  const html = readFileSync(template, "utf-8");

  return handlebars.compile(html)(data);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;
  // valida o certificado
  const response = await document
    .query({
      TableName: "users_certificate",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
    })
    .promise();

  const userAlreadExist = response.Items[0];

  if (!userAlreadExist) {
    // salva no dynamoDB
    await document
      .put({
        TableName: "users_certificate",
        Item: {
          id,
          grade,
          name,
          created_at: new Date().getTime(),
        },
      })
      .promise();
  }

  // pega a imagem do selo
  const medal = readFileSync(
    join(process.cwd(), "src", "templates", "selo.png"),
    "base64"
  );

  const template: ITemplate = {
    id,
    name,
    grade,
    date: dayjs().format("DD/MM/YYYY"),
    medal,
  };

  const content = await compile(template);

  // inicia um navegador headless
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
  });

  const page = await browser.newPage();

  // abre o HTML do tamplate no navegador headless
  await page.setContent(content);

  // obtem o pdf do HTML
  const pdf = await page.pdf({
    format: "a4",
    landscape: true,
    // pega o background definido pelo css
    printBackground: true,
    preferCSSPageSize: true,
    path: process.env.IS_OFFLINE ? "./certificates.pdf" : null,
  });

  await browser.close();

  // upload no buckte da aws
  const s3 = new S3();

  await s3
    .putObject({
      Bucket: "certificates-users",
      Key: `${id}.pdf`,
      ACL: "public-read",
      Body: pdf,
      ContentType: "application/pdf",
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Certificado registrado com sucesso!",
      url: `https://certificates-users.s3.amazonaws.com/${id}.pdf`,
    }),
  };
};
