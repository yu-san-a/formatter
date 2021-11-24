const fs = require('fs')
const espree = require('espree')

const log = console.log.bind(console)

// 配置项
let config = {
    format: {
        indent: {
            // 缩进
            style: '',
        },
        // 换行
        newLine: false,
        // 分号
        semicolon: true,
        // 操作符两边空格
        space: false,
    },
}

const getFormat = () => {
    let space = config.format.space ? ' ' : ''
    let semicolon = config.format.semicolon ? ';' : ''
    let newLine = config.format.newLine ? '\n' : ''
    let style = config.format.style
    return {
        space,
        semicolon,
        newLine,
        style,
    }
}

const parser = code => {
    let a = espree.parse(code, {
        // 支持最新特性
        ecmaVersion: 'latest',
    })
    return a
}

const codegen = node => {
    let {
        space,
        semicolon,
        newLine,
        style,
    } = getFormat()

    let type = node.type
    if (type === 'Program') {
        let body = node.body
        let c = (body.map(d => codegen(d))).join(semicolon + newLine)
        return c
    } else if (type === 'ExpressionStatement') {
        let c = codegen(node.expression)
        // log('c is ', c)
        return c
    } else if (type === 'AssignmentExpression') {
        let op = node.operator
        let l = codegen(node.left)
        let r = codegen(node.right)
        let c = l + space + op + space + r
        return c
    } else if (type === 'Identifier') {
        let c = node.name
        return c
    } else if (type === 'Literal') {
        let c = node.raw
        return c
    } else if (type === 'IfStatement') {
        let test = codegen(node.test)
        let block = codegenBlock(codegen(node.consequent))
        // log('block is ', block)
        // 括号两边的空格也最好写成配置项
        let c1  = 'if' + space + '(' + test + ')' + space
        let c2 = block
        let c = c1 + c2
        return c
    } else if (type === 'BlockStatement') {
        let body = node.body
        let format = config.format
        let separator = semicolon + newLine + format.indent.style
        let s = body.map(e => codegen(e)).join(separator)
        // log('s is \n', s)
        return s
    } else if (type === 'ForStatement') {
        // let i = 0
        let init = codegen(node.init)
        // i > array.length
        let test = codegen(node.test)
        // i++
        let update = codegen(node.update)
        // { }
        let body = codegenBlock(codegen(node.body))
        let c = 'for' + space + '(' + init + ';' + space + test + ';' + space + update + ')' + space + body
        return c
    } else if (type === 'ArrayExpression') {
        let elements = node.elements
        let c = '[' + elements.map(d => codegen(d)).join(',' + space) + ']'
        return c
    } else if (type === 'VariableDeclaration') {
        // let var const
        let kind = node.kind
        let op = '='
        let declarations = node.declarations
        // log('declarations', declarations)
        let id = codegen(declarations[0].id)
        let init = codegen(declarations[0].init)
        let c = kind + ' ' + id + space + op + space + init
        // log('c is ', c)
        return c
    } else if (type === 'BinaryExpression') {
        let op = node.operator
        let left = codegen(node.left)
        let right = codegen(node.right)
        let c = left + space + op + space + right
        // log('c is ', c)
        return c
    } else if (type === 'MemberExpression') {
        let computed = node.computed
        let object = codegen(node.object)
        let property = codegen(node.property)
        let c = ''
        if (computed) {
            c = object + '[' + property + ']'
        } else {
            c = object + '.' + property
        }
        return c
    } else if (type === 'UpdateExpression') {
        let op = node.operator
        let argument = codegen(node.argument)
        let c = argument + op
        // log('c is ', c)
        return c
    } else if (type === 'CallExpression') {
        let callee = codegen(node.callee)
        let arguments = node.arguments
        let a = arguments.map(d => codegen(d)).join(',' + space)
        let c = callee + '(' + a + ')'
        return c
    }
}

// 处理 {}
// if while for function class
const codegenBlock = (body) => {
    let {
        // ;
        semicolon,
        // \n
        newLine,
    } = getFormat()
    // '  '
    let indent = config.format.indent.style
    // \n'  '
    let firstLine = newLine + indent
    // \n
    let lastLine = newLine
    // 进行嵌套处理
    // 如果是包含 if for 这样的语句，对其代码块进行缩进处理
    let bodys = body.split(newLine)
    let mark = false
    let arr = []
    for (let i = 0; i < bodys.length; i++) {
        let c = bodys[i]
        let code = ''
        if (mark) {
            code = indent + c + semicolon
        } else {
            code = c
        }
        if (c.includes('if') || c.includes('for')) {
            mark = true
        } else if (c === '}') {
            mark = false
            if (semicolon === ';' && newLine === '\n') {
                code = code.slice(0, code.indexOf(semicolon))
            }
        }
        // log('code is ', code)
        arr.push(code)
    }
    body = arr.join(newLine)
    // log('body is ', body)
    let s = `{${firstLine}${body}${lastLine}}`
    return s
}

const __main = () => {
    let a = fs.readFileSync('input.js')
    let ast = parser(a)
    let b = codegen(ast)
    // log('b is ', b)
    fs.writeFileSync('output.js', b)
}

__main()
