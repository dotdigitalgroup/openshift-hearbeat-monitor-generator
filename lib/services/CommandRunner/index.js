module.exports = {
  run: async (commandName, options) => {
    try {
      const services = {}

      await require(`../../commands/${commandName}`)(options, services)
    } catch (e) {
      process.stderr.write(`${e.message}\n`)
      process.exit(127)
    }
  }
}
