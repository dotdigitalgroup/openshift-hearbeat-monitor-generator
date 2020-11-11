const OpenShiftClient = require('openshift-api-client')
const DEFAULT_INTERVAL = '5m'
const {
  MONITOR_LABEL = 'uptime-monitor',
  MONITOR_STATUS_CODE_LABEL = 'uptime-status-code'
} = process.env

module.exports = async ({ clusterUrl, token }) => {
  try {
    const os = await OpenShiftClient({ url: clusterUrl, token })
    const namespaces = (await os['oapi/v1'].getProjects()).items.map(e => e.metadata.name)
    const routeRetrievalPromises = namespaces.map(namespace => {
      return os['apis/route.openshift.io/v1'].getRoutes(
        namespace,
        { query: { labelSelector: MONITOR_LABEL } }
      )
    })
    const routes = (await Promise.all(routeRetrievalPromises))
      .filter(e => e.items.length > 0)
      .map(e => e.items)
      .reduce((acc, e) => {
        acc.push(...e)
        return acc
      }, [])

    routes.forEach(route => {
      const scheme = route.spec.tls ? 'https' : 'http'
      const { host, path } = route.spec
      const routePath = path || ''
      const { name, labels, namespace } = route.metadata
      const interval = labels[MONITOR_LABEL] || DEFAULT_INTERVAL
      const statusCode = labels[MONITOR_STATUS_CODE_LABEL]
      let messages = [
        `- type: http`,
        `  name: ${namespace}-${name}`,
        `  urls: ["${scheme}://${host}${routePath}"]`,
        `  schedule: "@every ${interval}"`
      ]

      if (statusCode) {
        messages.push(`  check.response.status: ${statusCode}`)
      }

      messages.forEach(msg => {
        process.stdout.write(msg + '\n')
      })
    })

    process.exit(0)
  } catch (e) {
    throw e
  }
}
