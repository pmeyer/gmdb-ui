import { ApolloClient, InMemoryCache } from "@apollo/client";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

export const gmdbClient = new ApolloClient({
  link: new UploadHttpLink({
    uri: "/graphql",
  }),
  cache: new InMemoryCache(),
});
