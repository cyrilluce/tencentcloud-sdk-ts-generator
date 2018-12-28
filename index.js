const convert = require("./convert");

// 可选参数列表
const optionalMap = {
  scf: {
    GetFunctionRequest: {
      Qualifier: 1,
      ShowCode: 1
    },
    InvokeRequest: {
      Qualifier: 1
    },
    UpdateFunctionConfigurationRequest: {
      Description: 1,
      MemorySize: 1,
      Timeout: 1,
      Runtime: 1,
      Environment: 1,
      VpcConfig: 1
    },
    ListFunctionsRequest: {
      Order: 1,
      Orderby: 1,
      SearchKey: 1
    },
    DeleteTriggerRequest: {
      Qualifier: 1
    },
    Code: {
      CosBucketName: 1,
      CosObjectName: 1,
      ZipFile: 1,
      CosBucketRegion: 1
    },
    UpdateFunctionCodeRequest: {
      CosBucketName: 1,
      CosObjectName: 1,
      ZipFile: 1,
      CosBucketRegion: 1
    },
    GetFunctionLogsRequest: {
      Qualifier: 1
    },
    CreateTriggerRequest: {
      Qualifier: 1
    }
  }
};

convert(optionalMap);
