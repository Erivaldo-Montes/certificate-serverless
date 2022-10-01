para realizar o deploy na aws é preciso ter as credancias de um usuário IAM na plataforma, que
são as chave de acesso e a cheve secreta que devem ser adicionadas nas configuracões do
serverless por meio do comando:

- serverless config credendtials --provider aws --key=[chave_de_acesso] --secret [chave_secreta] -o

Para salvar os pdf foi feito um Bucket no s3.

- Quando fazia o deploy da função na aws ao fazer uma requisição para criar um certificado
  me retornava um erro que era o sequinte:

  "Error: Failed to launch the browser process!",
  "/tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory",
  o que indicava que o puppeteer não estava iniciando o browser headless, isso se deu por conta
  que o puppeteer só funciona com a arquitetura a arm64.
  [resolvido].
