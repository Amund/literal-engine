import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import Engine from '../index.js'

describe('template', () => {
    it('add a new template to the templates list', () => {
        const engine = new Engine()
        assert(typeof engine.templates.name === 'undefined')
        engine.template('name', 'content')
        assert(typeof engine.templates.name === 'string')
    })
})

describe('prepare', () => {
    it('load all templates from root folder', () => {
        const engine = new Engine({ root: 'test/fixtures' })
        assert(Object.keys(engine.templates).length === 0)
        engine.template('name', 'content')
        assert(typeof engine.templates.name === 'string')
    })
})

describe('render', async () => {
    it('return same string as source if no data', () => {
        const engine = new Engine()
        engine.template('summary', 'Drugs are Bad, Mkay?')
        const result = engine.render('summary')
        assert.equal(result, 'Drugs are Bad, Mkay?')
    })
    it('interpolate variables', () => {
        const engine = new Engine()
        engine.template('summary', 'Drugs are Bad, ${ok}?')
        const result = engine.render('summary', { ok: 'Mkay' })
        assert.equal(result, 'Drugs are Bad, Mkay?')
    })
    it('use templates files, if loaded', async () => {
        const engine = new Engine({
            root: 'test/fixtures',
        })
        await engine.prepare()
        const result = engine.render('template', { ok: 'Mkay' })
        assert.equal(result, 'Drugs are Bad, Mkay?')
    })
    it('can extend another template', () => {
        const engine = new Engine()
        engine.template('base', '<body>${extend}</body>')
        engine.template('page', 'content')
        const result = engine.render('page', {}, 'base')
        assert.equal(result, '<body>content</body>')
    })
})

describe('render (helpers)', () => {
    it('use include in templates', () => {
        const engine = new Engine()
        engine.template('summary', 'Drugs are ${include("what")}, Mkay?')
        engine.template('what', 'Bad')
        const result = engine.render('summary')
        assert.equal(result, 'Drugs are Bad, Mkay?')
    })
    it('interpolate variables in included templates', () => {
        const engine = new Engine()
        engine.template(
            'summary',
            'Drugs are ${include("what", {what})}, ${ok}?'
        )
        engine.template('what', '${what}')
        const result = engine.render('summary', { what: 'Bad', ok: 'Mkay' })
        assert.equal(result, 'Drugs are Bad, Mkay?')
    })
    it('can extend another template, containing includes', () => {
        const engine = new Engine()
        engine.template('base', '<body>${extend} ${include("include")}</body>')
        engine.template('page', 'content')
        engine.template('include', 'included')
        const result = engine.render('page', {}, 'base')
        assert.equal(result, '<body>content included</body>')
    })
    it('can add custom helpers', () => {
        const engine = new Engine({
            helpers: {
                upcase: (str) => str.toUpperCase(),
            },
        })
        engine.template('summary', 'Drugs are ${upcase(what)}, Mkay?')
        const result = engine.render('summary', { what: 'Bad' })
        assert.equal(result, 'Drugs are BAD, Mkay?')
    })
})

describe('render (escaping)', () => {
    it('replace sensible characters in html strings by default', () => {
        const engine = new Engine()
        engine.template('test', '<p>${ test }</p>')
        const result = engine.render('test', { test: '<i>test</i>' })
        assert.equal(result, '<p>&lt;i&gt;test&lt;/i&gt;</p>')
    })
    it('can be disabled globally, with an Engine option', () => {
        const engine = new Engine({
            autoescape: false,
        })
        engine.template('test', '<p>${ test }</p>')
        const result = engine.render('test', { test: '<i>test</i>' })
        assert.equal(result, '<p><i>test</i></p>')
    })
    it('can be disabled locally, with a double dollar sign "$${}"', () => {
        const engine = new Engine()
        engine.template('test', '<p>$${ test }</p>')
        const result = engine.render('test', { test: '<i>test</i>' })
        assert.equal(result, '<p><i>test</i></p>')
    })
})
