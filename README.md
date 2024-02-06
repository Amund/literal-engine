# literal-engine

Node template engine based on template literals, with no dependencies.

## Install

```
$ npm i @amundsan/literal-engine
```

## Import

```js
import Engine from '@amundsan/literal-engine'
```

## Usage

```js
// from strings templates

const engine = new Engine()
engine.template('test', 'Hello ${ data }!')
console.log(engine.render('test', 'world'))
// => 'Hello world!'

engine.template('test2', '${data.what} ${ data.who }!')
console.log(
    engine.render('test2', { what: 'Hello', who: 'world' }),
    engine.render('test2', { what: 'Hi', who: 'universe' })
)
// => 'Hello world!' 'Hi universe!'
```

```js
// from files templates

const engine = new Engine({
    root: 'path/to/templates',
    extension: 'html', // by default
})

// add recursively all templates
await engine.prepare()

// then use them
console.log(engine.render('page', { title: 'My page', content: 'My content' }))
```

```html
<!-- page.html -->
<html>
    ${ include('head', { ...data }) }
    <body>
        <h1>${ data.title }</h1>
        <p>${ data.content }</p>
    </body>
</html>

<!--head.html-->
<head>
    <title>${ data.title }</title>
</head>
```

## Credits

Freely adapted from brilliant https://github.com/ahmadnassri/node-template-literals-engine
