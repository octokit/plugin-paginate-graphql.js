# plugin-paginate-graphql.js

> Octokit plugin to paginate GraphQL API endpoint responses

[![@latest](https://img.shields.io/npm/v/@octokit/plugin-paginate-graphql.svg)](https://www.npmjs.com/package/@octokit/plugin-paginate-graphql)
[![Build Status](https://github.com/octokit/plugin-paginate-graphql.js/workflows/Test/badge.svg)](https://github.com/octokit/plugin-paginate-graphql.js/actions?workflow=Test)

## Usage

<table>
<tbody valign=top align=left>
<tr><th>
Browsers
</th><td width=100%>

Load `@octokit/plugin-paginate-graphql` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
  import {
    paginateRest,
    composePaginateRest,
  } from "https://cdn.skypack.dev/@octokit/plugin-paginate-graphql";
</script>
```

</td></tr>
<tr><th>
Node
</th><td>

Install with `npm install @octokit/core @octokit/plugin-paginate-graphql`. Optionally replace `@octokit/core` with a core-compatible module

```js
const { Octokit } = require("@octokit/core");
const {
  paginateGraphql,
} = require("@octokit/plugin-paginate-graphql");
```

</td></tr>
</tbody>
</table>

```js
const MyOctokit = Octokit.plugin(paginateGraphql);
const octokit = new MyOctokit({ auth: "secret123" });

const response = await octokit.paginateGraphql(
  (cursor) => `{
  repository(owner: "octokit", name: "rest.js") {
    issues(first: 10, after: ${cursor.create()}) {
      nodes {
        title
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`);

console.log(`Found ${response.issues.nodes.length} issues!`);
```

## `octokit.paginateGraphql()`

The `paginateGraphql` plugin adds a new `octokit.paginateGraphql()` method which accepts a query-builder function that
- gets passed a cursor-object to create the cursors (or cursor-variables) which are required for pagination
- needs to return a valid graphql query as string

The query returned from that function will get passed over to the `octokit.graphql()`-function. The response will be scanned for a `pageInfo`-object, so you have to make sure to include it in the query. If `hasNextPage` is `true`, it will automatically use the `endCursor` to execute the next query until `hasNextPage` is `false`.

While iterating, it ongoingly merges all `nodes` and/or `edges` of all responses and returns a combined response in the end.

> **Note**
> Please note that nested pagination is **not** supported by this plugin. More details below.

## `octokit.paginateGraphql.iterator()`

If your target runtime environments supports async iterators (such as most modern browsers and Node 10+), you can iterate through each response:

```js
const pageIterator = octokit.paginateGraphql.iterator<TestResponseType>(
    (cursor) => `{
    repository(owner: "octokit", name: "rest.js") {
      issues(first: 10, after: ${cursor.create()}) {
        nodes {
          title
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }`
);

for await (const response of pageIterator) {
  const issues = response.repository.issues;
  console.log(`${issues.length} issues found.`);
}
```

### Variables

Per default, the plugin creates a query-statement (like `query paginate(cursor1: String!)`) containing the cursor variable(s) you provided.

To pass your own variables, you can create the query-statement yourself and pass the variables as a second parameter to the `paginateGraphql` or `iterator`-function, just like you do with the [octokit/graphql.js](https://github.com/octokit/graphql.js/#variables) plugin.

```js
await octokit.paginateGraphql<TestResponseType>(
  (cursor) => {
    const cursorVariable = cursor.create();
    return `
      query paginate(${cursorVariable}: String, $organization: String!) {
        repository(owner: $organization, name: "rest.js") {
          issues(first: 10, after: ${cursorVariable}) {
            nodes {
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;
  },
  { 
    organization: "octokit" 
  }
);
```

> **Note**
> You will have to make sure to insert the created cursor-variable both in the query statement as well as in the paginated resource.

### Initial cursor values

To pass initial cursor values, you can create a named cursor by passing a string to the cursor-creator like `cursor.create("namedCursor")` and then use the name as property-key in the variable-object:

```js
await octokit.paginateGraphql<TestResponseType>(
  (cursor) => {
    const cursorVariable = cursor.create("namedCursor");
    return `
      query paginate(${cursorVariable}: String, $organization: String!) {
        repository(owner: $organization, name: "rest.js") {
          issues(first: 10, after: ${cursorVariable}) {
            nodes {
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;
  },
  { 
    namedCursor: "initialValue", 
    organization: "octokit" 
  }
);
```

### Pagination Direction

You can control the pagination direction by the structure of the provided `pageInfo`.

For a forward pagination, use:

```gql
pageInfo {
  hasNextPage
  endCursor
}
```

For a backwards pagination, use:

```gql
pageInfo {
  hasNextPage
  endCursor
}
```

If you provide all 4 properties in a `pageInfo`, the plugin will default to forward pagination.

### Parallel pagination

You can do a parallel pagination by creating several cursors for different resources:

```js
const { repository } = await octokit.paginateGraphql((cursor) => {
  const topicsCursor = cursor.create("topics");
  const issuesCursor = cursor.create("issues");

  return `{   
      repository(owner: "octokit", name: "plugin-paginate-graphql.js") {
         issues(first: 1, after: ${topicsCursor}) {
            nodes {
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
          repositoryTopics(first: 1, after: ${issuesCursor}) {
            nodes {
              topic {
                name
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`;
});

console.log(`Found ${repository.issues.nodes.length} issues and ${repository.repositoryTopuics.nodes.length} repositoryTopics.`);
```

You will have to make sure to create the cursors in exactly the same order as the corresponding resources appear in the query, as matching is done based on order.

### Unsupported: Nested pagination

tbd.

### TypeScript Support

tbd.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
