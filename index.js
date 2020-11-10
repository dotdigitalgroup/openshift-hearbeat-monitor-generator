#!/usr/bin/env node

const program = require('commander')
const { run } = require('./lib/services/CommandRunner')

program.version(require('./package.json').version)

program
  .command('generate-monitor')
  .option('--cluster-url [clusterUrl]', 'OpenShift cluster URL')
  .option('--token [token]', 'OpenShift cluster access token')
  .action(options => run('GenerateMonitor', options))

program.parse(process.argv)

if (!program.args.length) program.outputHelp()
