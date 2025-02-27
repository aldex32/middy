<div align="center">
  <h1>Middy http-router lambda handler</h1>
  <img alt="Middy logo" src="https://raw.githubusercontent.com/middyjs/middy/main/docs/img/middy-logo.svg"/>
  <p><strong>HTTP router for the middy framework, the stylish Node.js middleware engine for AWS Lambda</strong></p>
<p>
  <a href="https://www.npmjs.com/package/@middy/http-router?activeTab=versions">
    <img src="https://badge.fury.io/js/%40middy%2Fhttp-router.svg" alt="npm version" style="max-width:100%;">
  </a>
  <a href="https://packagephobia.com/result?p=@middy/http-router">
    <img src="https://packagephobia.com/badge?p=@middy/http-router" alt="npm install size" style="max-width:100%;">
  </a>
  <a href="https://github.com/middyjs/middy/actions">
    <img src="https://github.com/middyjs/middy/workflows/Tests/badge.svg" alt="GitHub Actions test status badge" style="max-width:100%;">
  </a>
  <br/>
   <a href="https://standardjs.com/">
    <img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard Code Style"  style="max-width:100%;">
  </a>
  <a href="https://snyk.io/test/github/middyjs/middy">
    <img src="https://snyk.io/test/github/middyjs/middy/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/middyjs/middy" style="max-width:100%;">
  </a>
  <a href="https://lgtm.com/projects/g/middyjs/middy/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/g/middyjs/middy.svg?logo=lgtm&logoWidth=18" alt="Language grade: JavaScript" style="max-width:100%;">
  </a>
  <a href="https://bestpractices.coreinfrastructure.org/projects/5280">
    <img src="https://bestpractices.coreinfrastructure.org/projects/5280/badge" alt="Core Infrastructure Initiative (CII) Best Practices"  style="max-width:100%;">
  </a>
  <br/>
  <a href="https://gitter.im/middyjs/Lobby">
    <img src="https://badges.gitter.im/gitterHQ/gitter.svg" alt="Chat on Gitter" style="max-width:100%;">
  </a>
  <a href="https://stackoverflow.com/questions/tagged/middy?sort=Newest&uqlId=35052">
    <img src="https://img.shields.io/badge/StackOverflow-[middy]-yellow" alt="Ask questions on StackOverflow" style="max-width:100%;">
  </a>
</p>
</div>

This handler can route to requests to one of a nested hander based on `method` and `path` of an http event from API Gateway (REST or HTTP) or Elastic Load Balancer.

## Install

To install this middleware you can use NPM:

```bash
npm install --save @middy/http-router
```

## Options
- `routes` (array[{method, path, handler}]) (required): Array of route objects.
  - `method` (string) (required): One of `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` and `ANY` that will match to any method passed in
  - `path` (string) (required): AWS formatted path starting with `/`. Variable: `/{id}/`, Wildcard: `/{proxy+}`
  - `handler` (function) (required): Any `handler(event, context)` function

NOTES:
- Errors should be handled as part of the router middleware stack **or** the lambdaHandler middleware stack. Handled errors in the later will trigger the `after` middleware stack of the former.
- Shared middlewares, connected to the router middleware stack, can only be run before the lambdaHandler middleware stack.

## Sample usage

```javascript
import middy from '@middy/core'
import validatorMiddleware from '@middy/validator'

const getHandler = middy()
  .use(validatorMiddleware({inputSchema: {...} }))
  .handler((event, context) => {
    return {
      statusCode: 200,
      body: '{...}'
    }
  })

const postHandler = middy()
  .use(validatorMiddleware({inputSchema: {...} }))
  .handler((event, context) => {
    return {
      statusCode: 200,
      body: '{...}'
    }
  })

handler = middy()
  .use(httpHeaderNormalizer())
  .handler(httpRouterHandler([
    {
      method: 'GET',
      path: '/user/{id}',
      handler: getHandler
    },
    {
      method: 'POST',
      path: '/user',
      handler: postHandler
    }
  ]))
  

module.exports = { handler }
```


## Middy documentation and examples

For more documentation and examples, refers to the main [Middy monorepo on GitHub](https://github.com/middyjs/middy) or [Middy official website](https://middy.js.org).


## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/middyjs/middy/issues) or to [submit Pull Requests](https://github.com/middyjs/middy/pulls).


## License

Licensed under [MIT License](LICENSE). Copyright (c) 2017-2022 Luciano Mammino, will Farrell, and the [Middy team](https://github.com/middyjs/middy/graphs/contributors).

<a href="https://app.fossa.io/projects/git%2Bgithub.com%2Fmiddyjs%2Fmiddy?ref=badge_large">
  <img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmiddyjs%2Fmiddy.svg?type=large" alt="FOSSA Status"  style="max-width:100%;">
</a>
