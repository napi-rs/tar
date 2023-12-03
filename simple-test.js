const { Archive } = require('./index')

const archive = new Archive(__dirname + '/__test__/src.tar')

for (const entry of archive.entries()) {
  console.info(entry.path())
}

console.info('Simple test passed')
