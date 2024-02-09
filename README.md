# literal-engine

Node template engine based on template literals, with no dependencies.

-   No custom syntax, just template literals (or template strings), `${...}`
-   Support for include
-   Support for extend
-   Autoescaping by default
-   Builtin template helpers (include, escape)
-   Support adding custom template helpers
-   [TODO] Benchmark

## Install

```
$ npm i @amundsan/literal-engine
```

## Import

```js
import Engine from '@amundsan/literal-engine'
```

## Usage

### Templates from strings

All templates in literal-engine must be registered before using them. String-based template are registered with the `template(name,str)` method, then compiled with `render(name, data, extend)`

```js
const engine = new Engine()
engine.template('test', 'Hello ${who}')
console.log(engine.render('test', { who: 'world' }))
// => 'Hello world'

engine.template('test2', '${what} ${who}!')
console.log(
    engine.render('test2', { what: 'Hello', who: 'world' }),
    engine.render('test2', { what: 'Hi', who: 'universe' })
)
// => 'Hello world!' 'Hi universe!'
```

### Templates from files

All files-based templates must be loaded with `prepare()` method, which load them recursively from root folder, and store them in the templates registry, as strings. The name used to store, and to recall when rendering, is the path of the file relative to its root folder, and without its extension (`html` by default). `prepare()` is the only promised method in the api.

```html
<!-- page.html -->
<body>
    <h1>${title}</h1>
    <p>${content}</p>
</body>
```

```js
const engine = new Engine({
    root: 'path/to/templates',
    extension: 'html', // by default, can be omitted
})
await engine.prepare()
console.log(engine.render('page', { title: 'My page', content: 'My content' }))
/*
<body>
    <h1>My page</h1>
    <p>My content</p>
</body>
*/
```

### Include

`include` is one of the helpers functions usable inside your templates. As it sounds, it includes a template into another template. It shares its signature with the `render` method (in fact... it IS the `render` method, internally) : `include(name, data, extend)`

NOTE: As autoescape is active by default, it must be deactivated when using the include function, which legitimately injects html code. This can be done using the `$${...}` syntax.

```html
<!--head.html-->
<head>
    <title>${title} - Blog</title>
</head>
```

```html
<!-- page.html -->
<html>
    $${ include('head', { title }) }
    <body>
        <h1>${title}</h1>
        <p>${content}</p>
    </body>
</html>
```

```js
const engine = new Engine({ root: 'path/to/templates' })
await engine.prepare()
console.log(engine.render('page', { title: 'My page', content: 'My content' }))
/*
<html>
    <head>
        <title>My page - Blog</title>
    </head>
    <body>
        <h1>My page</h1>
        <p>My content</p>
    </body>
</html>
*/
```

### Extend

Extending a template is the opposite of including: it "wrap" a template around another one. It can be done only with `include` function like this :

```js
const data = { title: 'My page', content: 'My content' }
engine.render('base', { ...data, extend: engine.render('page', data) })
```

But there's a more convenient way of doing this, using the third argument of the "render" (and "include") function to specify the template to be extended. Technically, an "extend" template is just a regular template with a special variable `${extend}`, where child template will be injected. As with the `include` function, autoescape must be disabled with the syntax `$${extend}`.

```html
<!--base.html-->
<body>
    $${extend}
</body>
```

```html
<!-- page.html -->
<h1>${title}</h1>
<p>${content}</p>
```

```js
const engine = new Engine({ root: 'path/to/templates' })
await engine.prepare()
const data = { title: 'My page', content: 'My content' }
console.log(engine.render('page', data, 'base'))
/*
<body>
    <h1>My page</h1>
    <p>My content</p>
</body>
*/
```

## Credits

Freely adapted from brilliants [template-literals-engine](https://github.com/ahmadnassri/node-template-literals-engine) and [escape-html](https://github.com/component/escape-html)
