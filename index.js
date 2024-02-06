import { resolve } from 'node:path'
import { readdir, readFile } from 'node:fs/promises'

export default class Engine {
    constructor({ root = null, extension = 'html', helpers = {} } = {}) {
        this.prepared = {}
        this.root = root
        this.extension = extension
        this.helpers = {
            ...helpers,
            include: (name, data = null) => this.render(name, data),
        }
    }

    compile(literal) {
        return new Function(
            'data',
            ...Object.keys(this.helpers),
            `return \`${literal}\``
        )
    }

    template(name, literal) {
        this.prepared[name] = this.compile(literal)
    }

    async prepare() {
        const files = await readdir(this.root, { recursive: true })
        for (const file of files) {
            if (file.endsWith(this.extension)) {
                const reg = new RegExp(`\.${this.extension}$`)
                const name = file.replace(reg, '')
                const path = resolve(this.root, file)
                const content = await readFile(path)
                this.template(name, content)
            }
        }
    }

    render(name, data = null) {
        if (!this.prepared[name]) {
            throw new Error(`Can not load "${name}" template`)
        }
        const template = this.prepared[name]
        return template
            .call(undefined, data, ...Object.values(this.helpers))
            .trim()
    }
}
