# plugin-paginate-graphql.js

> Octokit plugin to paginate GraphQL Query responses

[![@latest](https://img.shields.io/npm/v/@octokit/plugin-paginate-graphql.svg)](https://www.npmjs.com/package/@octokit/plugin-paginate-graphql)
[![Build Status](https://github.com/octokit/plugin-paginate-graphql.js/workflows/Test/badge.svg)](https://github.com/octokit/plugin-paginate-graphql.js/actions?workflow=Test)
[![Greenkeeper](https://badges.greenkeeper.io/octokit/plugin-paginate-graphql.js.svg)](https://greenkeeper.io/)

## Usage

<table>
<tbody valign=top align=left>
<tr><th>
Browsers
</th><td width=100%>

Load `@octokit/plugin-paginate-graphql` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.pika.dev](https://cdn.pika.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.pika.dev/@octokit/core";
  import { paginateGraphql } from "https://cdn.pika.dev/@octokit/plugin-paginate-graphql";
</script>
```

</td></tr>
<tr><th>
Node
</th><td>

Install with `npm install @octokit/core @octokit/plugin-paginate-graphql`. Optionally replace `@octokit/core` with a core-compatible module

```js
const { Octokit } = require("@octokit/core");
const { paginateGraphql } = require("@octokit/plugin-paginate-graphql");
```

</td></tr>
</tbody>
</table>

```js
const MyOctokit = Octokit.plugin(paginateGraphql);
const octokit = new MyOctokit({ auth: "secret123" });

const query = `query repositoryIssues($owner:String!,$repo:String!,$since:DateTime!) {
  repository(owner:$owner,name:$repo) {
    issues(first:100, filterBy:{since:$since}) {
      nodes {
        number
        title
      }
    }
  }
}`;
const {
  repository: {
    issues: { nodes: issues },
  },
} = await octokit.paginate(query, {
  owner: "octocat",
  repo: "hello-world",
  since: "2019-10-01T00:00:00.000Z",
});
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
