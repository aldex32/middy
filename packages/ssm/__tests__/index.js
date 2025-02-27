import test from 'ava'
import sinon from 'sinon'
import middy from '../../core/index.js'
import { getInternal, clearCache } from '../../util/index.js'
import SSM from 'aws-sdk/clients/ssm.js' // v2
// import { SSM } from '@aws-sdk/client-ssm' // v3
import ssm from '../index.js'

let sandbox
test.beforeEach((t) => {
  sandbox = sinon.createSandbox()
})

test.afterEach((t) => {
  sandbox.restore()
  clearCache()
})

const mockService = (client, responseOne, responseTwo) => {
  // aws-sdk v2
  const mock = sandbox.stub()
  mock.onFirstCall().returns({ promise: () => Promise.resolve(responseOne) })
  if (responseTwo) {
    mock.onSecondCall().returns({ promise: () => Promise.resolve(responseTwo) })
  }
  client.prototype.getParameters = mock
  client.prototype.getParametersByPath = mock
  // aws-sdk v3
  // const mock = sandbox.stub(client.prototype, 'getParameters')
  // mock.onFirstCall().resolves(responseOne)
  // if (responseTwo) mock.onSecondCall().resolves(responseTwo)
  // const mock = sandbox.stub(client.prototype, 'getParametersByPath')
  // mock.onFirstCall().resolves(responseOne)
  // if (responseTwo) mock.onSecondCall().resolves(responseTwo)

  return mock
}

const mockServiceError = (client, error) => {
  // aws-sdk v2
  const mock = sandbox.stub()
  mock.onFirstCall().returns({ promise: () => Promise.reject(error) })
  mock.onSecondCall().returns({ promise: () => Promise.reject(error) })
  client.prototype.getParameters = mock
  client.prototype.getParametersByPath = mock
  // aws-sdk v3
  // const mock = sandbox.stub(client.prototype, 'getParameters')
  // mock.onFirstCall().resolves(responseOne)
  // if (responseTwo) mock.onSecondCall().resolves(responseTwo)
  // const mock = sandbox.stub(client.prototype, 'getParametersByPath')
  // mock.onFirstCall().resolves(responseOne)
  // if (responseTwo) mock.onSecondCall().resolves(responseTwo)

  return mock
}

const event = {}
const context = {
  getRemainingTimeInMillis: () => 1000
}

test.serial('It should set SSM param value to internal storage', async (t) => {
  mockService(SSM, {
    Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
  })

  const middleware = async (request) => {
    const values = await getInternal(true, request)
    t.is(values.key, 'key-value')
  }

  const handler = middy(() => {})
    .use(ssm({
      AwsClient: SSM,
      cacheExpiry: 0,
      fetchData: {
        key: '/dev/service_name/key_name'
      }
    }))
    .before(middleware)

  await handler(event, context)
})

test.serial('It should set SSM param path to internal storage', async (t) => {
  mockService(SSM, {
    Parameters: [
      { Name: '/dev/service_name/key_name', Value: 'key-value' },
      { Name: '/dev/service_name/key_pass', Value: 'key-pass' }
    ]
  })

  const middleware = async (request) => {
    const values = await getInternal(true, request)
    t.deepEqual(values.key, {
      key_name: 'key-value',
      key_pass: 'key-pass'
    })
  }

  const handler = middy(() => {})
    .use(ssm({
      AwsClient: SSM,
      cacheExpiry: 0,
      fetchData: {
        key: '/dev/service_name/'
      }
    }))
    .before(middleware)

  await handler(event, context)
})

test.serial(
  'It should set SSM param path to internal storage when nextToken is returned',
  async (t) => {
    mockService(
      SSM,
      {
        NextToken: 'NextToken',
        Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
      },
      {
        Parameters: [{ Name: '/dev/service_name/key_pass', Value: 'key,pass', Type: 'StringList' }]
      }
    )

    const middleware = async (request) => {
      const values = await getInternal(true, request)
      t.deepEqual(values.key, {
        key_name: 'key-value',
        key_pass: ['key', 'pass']
      })
    }

    const handler = middy(() => {})
      .use(ssm({
        AwsClient: SSM,
        cacheExpiry: 0,
        fetchData: {
          key: '/dev/service_name/'
        }
      }))
      .before(middleware)

    await handler(event, context)
  }
)

test.serial(
  'It should set SSM param value to internal storage without prefetch',
  async (t) => {
    mockService(SSM, {
      Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
    })

    const middleware = async (request) => {
      const values = await getInternal(true, request)
      t.is(values.key, 'key-value')
    }

    const handler = middy(() => {})
      .use(ssm({
        AwsClient: SSM,
        cacheExpiry: 0,
        fetchData: {
          key: '/dev/service_name/key_name'
        },
        disablePrefetch: true
      }))
      .before(middleware)

    await handler(event, context)
  }
)

test.serial('It should set SSM param value to context', async (t) => {
  mockService(SSM, {
    Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
  })

  const middleware = async (request) => {
    t.is(request.context.key, 'key-value')
  }

  const handler = middy(() => {})
    .use(ssm({
      AwsClient: SSM,
      cacheExpiry: 0,
      fetchData: {
        key: '/dev/service_name/key_name'
      },
      setToContext: true
    }))
    .before(middleware)

  await handler(event, context)
})

test.serial(
  'It should set SSM param value to internal storage when request > 10 params',
  async (t) => {
    mockService(
      SSM,
      {
        Parameters: [
          { Name: '/dev/service_name/key_name0', Value: 'key-value0' },
          { Name: '/dev/service_name/key_name1', Value: 'key-value1' },
          { Name: '/dev/service_name/key_name2', Value: 'key-value2' },
          { Name: '/dev/service_name/key_name3', Value: 'key-value3' },
          { Name: '/dev/service_name/key_name4', Value: 'key-value4' },
          { Name: '/dev/service_name/key_name5', Value: 'key-value5' },
          { Name: '/dev/service_name/key_name6', Value: 'key-value6' },
          { Name: '/dev/service_name/key_name7', Value: 'key-value7' },
          { Name: '/dev/service_name/key_name8', Value: 'key-value8' },
          { Name: '/dev/service_name/key_name9', Value: 'key-value9' }
        ]
      },
      {
        Parameters: [
          { Name: '/dev/service_name/key_name10', Value: 'key-value10' },
          { Name: '/dev/service_name/key_name11', Value: 'key-value11' },
          { Name: '/dev/service_name/key_name12', Value: 'key-value12' },
          { Name: '/dev/service_name/key_name13', Value: 'key-value13' },
          { Name: '/dev/service_name/key_name14', Value: 'key-value14' }
        ]
      }
    )

    const middleware = async (request) => {
      const values = await getInternal(true, request)
      t.is(values.key11, 'key-value11')
    }

    const handler = middy(() => {})
      .use(ssm({
        AwsClient: SSM,
        cacheExpiry: 0,
        fetchData: {
          key0: '/dev/service_name/key_name0',
          key1: '/dev/service_name/key_name1',
          key2: '/dev/service_name/key_name2',
          key3: '/dev/service_name/key_name3',
          key4: '/dev/service_name/key_name4',
          key5: '/dev/service_name/key_name5',
          key6: '/dev/service_name/key_name6',
          key7: '/dev/service_name/key_name7',
          key8: '/dev/service_name/key_name8',
          key9: '/dev/service_name/key_name9',
          key10: '/dev/service_name/key_name10',
          key11: '/dev/service_name/key_name11',
          key12: '/dev/service_name/key_name12',
          key13: '/dev/service_name/key_name13',
          key14: '/dev/service_name/key_name14'
        }
      }))
      .before(middleware)

    await handler(event, context)
  }
)

test.serial(
  'It should not call aws-sdk again if parameter is cached forever',
  async (t) => {
    const stub = mockService(SSM, {
      Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
    })

    const middleware = async (request) => {
      const values = await getInternal(true, request)
      t.is(values.key, 'key-value')
    }

    const handler = middy(() => {})
      .use(ssm({
        AwsClient: SSM,
        cacheExpiry: -1,
        fetchData: {
          key: '/dev/service_name/key_name'
        }
      }))
      .before(middleware)

    await handler(event, context)
    await handler(event, context)

    t.is(stub.callCount, 1)
  }
)

test.serial(
  'It should not call aws-sdk again if parameter is cached',
  async (t) => {
    const stub = mockService(SSM, {
      Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
    })

    const middleware = async (request) => {
      const values = await getInternal(true, request)
      t.is(values.key, 'key-value')
    }

    const handler = middy(() => {})
      .use(ssm({
        AwsClient: SSM,
        cacheExpiry: 1000,
        fetchData: {
          key: '/dev/service_name/key_name'
        }
      }))
      .before(middleware)

    await handler(event, context)
    await handler(event, context)

    t.is(stub.callCount, 1)
  }
)

test.serial(
  'It should call aws-sdk if cache enabled but cached param has expired',
  async (t) => {
    const stub = mockService(
      SSM,
      {
        Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
      },
      {
        Parameters: [{ Name: '/dev/service_name/key_name', Value: 'key-value' }]
      }
    )

    const middleware = async (request) => {
      const values = await getInternal(true, request)
      t.is(values.key, 'key-value')
    }

    const handler = middy(() => {})
      .use(ssm({
        AwsClient: SSM,
        cacheExpiry: 0,
        fetchData: {
          key: '/dev/service_name/key_name'
        }
      }))
      .before(middleware)

    await handler(event, context)
    await handler(event, context)

    t.is(stub.callCount, 2)
  }
)

test('It should throw error if InvalidParameters returned', async (t) => {
  mockService(SSM, {
    InvalidParameters: ['invalid-ssm-param-name', 'another-invalid-ssm-param']
  })

  const handler = middy(() => {})
    .use(ssm({
      AwsClient: SSM,
      cacheExpiry: 0,
      fetchData: {
        a: 'invalid-ssm-param-name',
        b: 'another-invalid-ssm-param',
        key: '/dev/service_name/key_name'
      },
      disablePrefetch: true,
      setToContext: true
    }))

  try {
    await handler(event, context)
    t.true(false)
  } catch (e) {
    t.is(e.message, 'Failed to resolve internal values')
    t.deepEqual(e.cause, [new Error('[ssm] InvalidParameter invalid-ssm-param-name'), new Error('[ssm] InvalidParameter another-invalid-ssm-param')])
  }
})

test.serial('It should catch if an error is returned from fetchSingle', async (t) => {
  const stub = mockServiceError(SSM, new Error('timeout'))

  const handler = middy(() => {})
    .use(ssm({
      AwsClient: SSM,
      cacheExpiry: 0,
      fetchData: {
        key: '/dev/service_name/key_name'
      },
      setToContext: true
    }))

  try {
    await handler(event, context)
  } catch (e) {
    t.is(stub.callCount, 1)
    t.is(e.message, 'Failed to resolve internal values')
    t.deepEqual(e.cause, [new Error('timeout')])
  }
})

test.serial('It should catch if an error is returned from fetchPath', async (t) => {
  const stub = mockServiceError(SSM, new Error('timeout'))

  const handler = middy(() => {})
    .use(ssm({
      AwsClient: SSM,
      cacheExpiry: 0,
      fetchData: {
        path: '/dev/service_path/'
      },
      setToContext: true
    }))

  try {
    await handler(event, context)
  } catch (e) {
    t.is(stub.callCount, 1)
    t.is(e.message, 'Failed to resolve internal values')
    t.deepEqual(e.cause, [new Error('timeout')])
  }
})
