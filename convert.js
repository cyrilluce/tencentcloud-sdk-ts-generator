const esprima = require("esprima");
const fs = require("fs");
const path = require("path");

const sdkPath = `./node_modules/tencentcloud-sdk-nodejs`;
const bizSdkPath = path.join(sdkPath, `tencentcloud`);
const outPath = `./outputs`;

module.exports = function parseAll(optionalMap = {}) {
  fs.readdir(bizSdkPath, (err, files) => {
    for (const file of files) {
      const stat = fs.lstatSync(path.join(bizSdkPath, file));
      if (!stat.isDirectory()) {
        continue;
      }
      console.log(`processing ${file}`);
      convert(file, optionalMap[file]);
    }
    console.log(`finished`);
  });
};

function convert(sdk, optionalMap = {}) {
  const files = fs.readdirSync(path.join(bizSdkPath, sdk));
  const version = files.find(f => /^v\d+$/.test(f));
  if (!version) {
    return;
  }
  const modelPath = path.join(bizSdkPath, sdk, version, `models.js`);

  const modelsResult = esprima.parseScript(
    fs.readFileSync(modelPath).toString(),
    {
      comment: true,
      range: true
    }
  );

  let comments = modelsResult.comments;
  let lastCommentIndex = -1;
  function findComment(startPos) {
    for (let i = lastCommentIndex + 1; i < comments.length; i++) {
      const {
        range: [start]
      } = comments[i];
      if (start > startPos) {
        lastCommentIndex = i - 1;
        break;
      }
    }
    return comments[lastCommentIndex].value;
  }

  const tsOut = fs.createWriteStream(path.join(outPath, `${sdk}.ts`));
  tsOut.write(`// Auto-generate by tencentcloud-sdk-ts-generator\n\n`);
  const requests = new Set();
  const responses = new Set();
  // 开始解析输出
  for (const statement of modelsResult.body) {
    switch (statement.type) {
      case "ClassDeclaration":
        // class
        parseClassDeclaration(statement, optionalMap);
        break;
    }
  }

  // 生成统一调用出口
  tsOut.write(`export default abstract class Facade_${sdk}{
  abstract request(action, params)
`);
  for (let action of requests) {
    if (!responses.has(action)) {
      continue;
    }
    tsOut.write(`  ${action}(params: ${action}Request): Promise<${action}Response>{
    return this.request('${action}', params)
  }
`);
  }
  tsOut.write(`}\n\n`);

  function parseClassDeclaration(o, optionalMap) {
    const {
      id: { /** 类名 */ name: className },
      body: { body: classBody }
    } = o;

    // 请求参数及回包定义
    const reResult = className.match(/^(\w+)(Request|Response)$/i);
    if (reResult) {
      const [, action, type] = reResult;
      switch (type) {
        case "Request":
          requests.add(action);
          break;
        case "Response":
          responses.add(action);
          break;
      }
    }

    tsOut.write(`export interface ${className}{
`);

    optionalMap = optionalMap[className] || {};

    // 解析构造函数中的声明
    for (const statement of classBody) {
      if (
        !(
          statement.type === "MethodDefinition" &&
          statement.kind === "constructor"
        )
      ) {
        continue;
      }
      // constructor
      const {
        value: {
          body: { body: constructorBody }
        }
      } = statement;

      for (const { expression } of constructorBody) {
        if (expression.type !== "AssignmentExpression") {
          continue;
        }
        // this.Xxxx = xxxx
        const {
          range: [start],
          left: {
            property: { name: propertyName }
          }
        } = expression;
        const comment = findComment(start);
        const [, desc, type] = comment.match(
          /([\s\S\r\n]*)@type \{(.*?) \|\| null\}/
        );
        const optional = propertyName in optionalMap ? "?" : "";
        tsOut.write(`  /** ${desc.replace(/(^|[\r\n]+)\s*\*+/g, "")} */
  ${propertyName}${optional}: ${type.replace(/^Array\.<(.*)>$/, "$1[]")}
`);
      }
    }

    tsOut.write(`}\n\n`);
  }
}
