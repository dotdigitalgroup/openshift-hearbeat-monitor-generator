const OpenShiftClient = require('openshift-api-client')
const { MONITOR_LABEL = 'uptime-monitor' } = process.env

module.exports = async ({ clusterUrl, token }) => {
  try {
    const os = await OpenShiftClient({ url: clusterUrl, token })
    const namespaces = (await os['oapi/v1'].getProjects()).items.map(e => e.metadata.name)
    const routeRetrievalPromises = namespaces.map(namespace => {
      return os.customCall(
        'get',
        [
          'apis/route.openshift.io/v1/namespaces',
          namespace,
          `routes?labelSelector=${MONITOR_LABEL}`
        ].join('/')
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
      const { host } = route.spec
      const { name, labels } = route.metadata
      const interval = labels[MONITOR_LABEL]
      const messages = [
        `- type: http`,
        `  name: ${name}`,
        `  urls: ["${scheme}://${host}"]`,
        `  schedule: "@every ${interval}"`
      ]

      messages.forEach(msg => {
        process.stdout.write(msg + '\n')
      })
    })

    process.exit(0)
  } catch (e) {
    throw e
  }
}
