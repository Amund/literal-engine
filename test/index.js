import assert from 'node:assert/strict'
import Engine from '../index.js'

describe('Literal engine', () => {
    describe('compile', () => {
        it('transform a string containing template strings to a parametized function', () => {
            const engine = new Engine()
            const str = '${ data.direction } park'
            const func = engine.compile(str)
            assert.ok(typeof func === 'function')

            const output = func({ direction: 'south' })
            assert.ok(output === 'south park')
        })
    })
    describe('template', () => {
        it('add a new compiled template to the list', () => {
            const engine = new Engine()
            assert.ok(typeof engine.prepared.name === 'undefined')
            engine.template('name', 'content')
            assert.ok(typeof engine.prepared.name === 'function')
        })
    })
    describe('prepare', () => {
        it('compile all templates from root folder', () => {
            const engine = new Engine({ root: 'test/fixtures' })
            assert.ok(Object.keys(engine.prepared).length === 0)
            engine.template('name', 'content')
            assert.ok(typeof engine.prepared.name === 'function')
        })
    })
    describe('render', () => {
        it('return same string as source if no data', () => {
            const engine = new Engine()
            engine.template('summary', 'Drugs are Bad, Mkay?')
            const result = engine.render('summary')
            assert.equal(result, 'Drugs are Bad, Mkay?')
        })

        it('interpolate variables', () => {
            const engine = new Engine()
            engine.template('summary', 'Drugs are Bad, ${ data.ok }?')
            const result = engine.render('summary', { ok: 'Mkay' })
            assert.equal(result, 'Drugs are Bad, Mkay?')
        })

        it('use helpers in templates', () => {
            const engine = new Engine()
            engine.template('summary', 'Drugs are ${ include("what") }, Mkay?')
            engine.template('what', 'Bad')
            const result = engine.render('summary')
            assert.equal(result, 'Drugs are Bad, Mkay?')
        })

        it('interpolate variables in included templates', () => {
            const engine = new Engine()
            engine.template(
                'summary',
                'Drugs are ${ include("what", data) }, ${ data.ok }?'
            )
            engine.template('what', '${ data.what }')
            const result = engine.render('summary', { what: 'Bad', ok: 'Mkay' })
            assert.equal(result, 'Drugs are Bad, Mkay?')
        })

        it('use templates files, if prepared', async () => {
            const engine = new Engine({
                root: 'test/fixtures',
            })
            await engine.prepare()
            const result = engine.render('template', { ok: 'Mkay' })
            assert.equal(result, 'Drugs are Bad, Mkay?')
        })
    })
})
