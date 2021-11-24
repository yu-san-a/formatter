const watch = require('node-watch')
const path = require('path')
const { exec } = require('child_process')

const log = console.log.bind(console)

const autoTest = function(path, options, callback) {
    watch(path, options, callback)
}

const __main = function() {
    let dir = '.'
    let options = {
        recursive: true,
        filter: function(f, skip) {
            if (/\/node_modules/.test(f)) {
                return skip
            } else {
                return /\.js$/.test(f)
            }
        },
    }
    autoTest(dir, options, function(event, name) {
        let d = new Date()
        let file = path.join(__dirname, name)
        log(d.toJSON())
        if (event === 'update') {
            log(`${file} changed.`);
            if (name === 'run.js' || name === 'input.js') {
                let cmd = 'node run.js'
                shellCommend(cmd)
            }
        }
    })
}

const shellCommend = cmd => {
    let c = cmd
    exec(c, function(error, stdout, stderr){
        if(error) {
            console.error('error: ' + error)
            return
        }
        console.log('stdout: ' + '\n' + stdout)
        console.log('stderr: ' + '\n' + stderr)
        log('-----------------------------')
    })
}

if (require.main === module) {
    __main()
}
