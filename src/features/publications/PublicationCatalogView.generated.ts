/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from '../../graphql/generated/graphql';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PublicationCatalogQueryVariables = Exact<{
  criteria?: Types.PubSearchCriteria;
}>;


export type PublicationCatalogQuery = { pubSearch: Array<{ __typename: 'PubSearchResult', id: number, name: string, type: Types.PubType, pubDate: string | null, serialNumber: string, pubIndexId: number, details:
      | { __typename: 'BookDetails', edition: string, cover: string | null }
      | { __typename: 'MagDetails', volume: string | null, issue: string | null, issueName: string, cover: string | null }
    , transcriptions: Array<{ __typename: 'PubTranscription', id: number, song: { __typename: 'Song', id: number, title: string } }> | null }> };


export const PublicationCatalogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicationCatalog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PubSearchCriteria"}}},"defaultValue":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pubSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"criteria"},"value":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"pubDate"}},{"kind":"Field","name":{"kind":"Name","value":"serialNumber"}},{"kind":"Field","name":{"kind":"Name","value":"pubIndexId"}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"cover"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MagDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"volume"}},{"kind":"Field","name":{"kind":"Name","value":"issue"}},{"kind":"Field","name":{"kind":"Name","value":"issueName"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BookDetails"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edition"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"transcriptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"song"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PublicationCatalogQuery, PublicationCatalogQueryVariables>;