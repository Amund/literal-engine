import { resolve } from 'node:path'
import { readdir, readFile } from 'node:fs/promises'

const chars = {
    '&': '&amp;',
    '>': '&gt;',
    '<': '&lt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
}
const reg = new RegExp(Object.keys(chars).join('|'), 'g')
const escape = (str) => String(str).replace(reg, (match) => chars[match])

const html = (literals, ...substs) => {
    return literals.raw.reduce((acc, lit, i) => {
        let subst = substs[i - 1]
        if (Array.isArray(subst)) {
            subst = subst.join('')
        } else if (literals.raw[i - 1] && literals.raw[i - 1].endsWith('$')) {
            acc = acc.slice(0, -1)
        } else {
            subst = escape(subst)
        }
        return acc + subst + lit
    })
}

export default class Engine {
    constructor({
        root = null,
        extension = 'html',
        autoescape = true,
        debug = false,
        helpers = {},
    } = {}) {
        this.templates = {}
        this.root = root
        this.extension = extension
        this.autoescape = autoescape
        this.debug = debug
        this.helpers = {
            ...helpers,
            html,
            escape,
            include: this.render.bind(this),
        }

        this.template(
            'debug',
            '<pre style="background: black; color: white; padding: 5px; width: fit-content;">Template "${template}" error: ${message}</pre>'
        )
    }

    template(name = '', str = '') {
        this.templates[name.trim()] = str.trim()
    }

    render(name = '', data = {}, extend = '') {
        if (!this.templates[name]) {
            throw new Error(`Template "${name}" not loaded`)
        }

        const args = { ...data, ...this.helpers },
            keys = Object.keys(args),
            values = Object.values(args),
            autoescape = this.autoescape ? 'html' : '',
            func = `return ${autoescape}\`${this.templates[name]}\``,
            variables = Object.keys(data).sort().join(', ')

        let rendered
        try {
            rendered = new Function(...keys, 'variables', func)(
                ...values,
                variables
            )
        } catch (err) {
            process.stderr.write(
                [
                    `Template error in "${name}": ${err.message}`,
                    `with ${JSON.stringify(data, null, 2)}`,
                    '',
                ].join('\n')
            )
            if (this.debug) {
                return this.render('debug', {
                    template: name,
                    message: err.message,
                })
            }
        }

        if (extend !== '') {
            rendered = this.render(extend, { ...data, extend: rendered })
        }

        return rendered
    }

    async prepare() {
        const files = await readdir(this.root, { recursive: true })
        for (const file of files) {
            if (file.endsWith(this.extension)) {
                const reg = new RegExp(`\.${this.extension}$`)
                const name = file.replace(reg, '')
                const path = resolve(this.root, file)
                const content = await readFile(path, { encoding: 'utf-8' })
                this.template(name, content)
            }
        }
    }
}
