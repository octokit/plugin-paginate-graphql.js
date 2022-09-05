# plugin-paginate-graphql.js

> Octokit plugin to paginate REST API endpoint responses

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

const issues = await octokit.paginateGraphql(
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
```

## `octokit.paginateGraphql()`

The `paginateGraphql` plugin adds a new `octokit.paginateGraphql()` method which accepts a function that
- needs to return a valid graphql query as string
- gets passed a cursor-object to create the cursors required for pagination



### Providing additional variables and initial parameters

- on default, the query statement is created
- if you want to provide initial parameters through additinioal varialbeles


### Parallel pagination

### Unsupported: Nested pagination



## `octokit.paginateGraphql.iterator()`

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
  console.log("%d issues found", issues.length);
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
