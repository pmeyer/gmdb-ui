import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.GRAPHQL_SCHEMA ?? "http://localhost:8080/graphql",
  documents: ["src/**/*.graphql"],
  generates: {
    "src/graphql/generated/graphql.ts": {
      plugins: ["typescript-operations"],
      config: {
        generateOperationTypes: false,
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        useTypeImports: true,
      },
    },
    "src/": {
      preset: "near-operation-file",
      plugins: ["typescript-operations", "typed-document-node"],
      config: {
        importSchemaTypesFrom: "./src/graphql/generated/graphql.ts",
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
