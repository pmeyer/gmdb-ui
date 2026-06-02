import { ApolloClient, InMemoryCache } from "@apollo/client";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

export function createGmdbClient(uri = "/graphql") {
  return new ApolloClient({
    link: new UploadHttpLink({
      uri,
    }),
    cache: new InMemoryCache(),
  });
}

export const gmdbClient = createGmdbClient();
