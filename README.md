# literal-engine

Node template engine based on template literals, with no dependencies.

-   No custom syntax, just template literals (or template strings), `${...}`
-   Support for include
-   Support for extend
-   Autoescaping by default (locally or globally deactivatable)
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

At any time, you can consult the list of all available templates (loaded from a file or a string) by dumping `engine.templates`, which is a plain object.

### Autoescape

By default, autoescape is active. This means that all variables and expressions passed into `${...}` in templates will be automatically escaped, replacing any dangerous characters by HTML entities. This feature can be globally disabled if required, by setting the `autoescape` constructor option to false.

```js
const engine = new Engine({ autoescape: false })
```

If this option is **globally disabled**, you can still perform this task manually, using the "escape" helper in your templates.

```html
<p>${ escape('<div>') }</p>
<!-- <p>&lt;div&gt;</p> -->
```

If this option is **globally enabled**, you can still locally disable autoescape by placing an additional dollar sign in front of a variable: `$${...}`. This is particularly useful when using the include function, or when you want to use an extend.

```html
<p>$${ '<div>' }</p>
<!-- <p><div></p> -->
```

### Helpers

You can make generic functions available in your templates by adding them to the list of helpers. They can also be added from the engine constructor.

```js
const engine = new Engine({
    helpers: {
        oddCase: (str) =>
            str
                .toLowerCase()
                .split('')
                .map((s, i) => (i % 2 == 0 ? s.toUpperCase() : s))
                .join(''),
    },
})
engine.template('content', '<p>${ oddCase(sentence) }</p>')
console.log(
    engine.render('content', { sentence: 'Oh my God! They killed Kenny!' })
)
// <p>Oh mY GoD! tHeY KiLlEd kEnNy!</p>
```

You can also add a new helper at any time using the `helper(name, func)` function.

```js
const engine = new Engine()
engine.helper('evenCase', (str) =>
    str
        .toLowerCase()
        .split('')
        .map((s, i) => (i % 2 != 0 ? s.toUpperCase() : s))
        .join('')
)
engine.template('content', '<p>${evenCase(sentence)}</p>')
console.log(
    engine.render('content', { sentence: 'Oh my God! They killed Kenny!' })
)
// <p>oH My gOd! ThEy kIlLeD KeNnY!</p>
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

But there's a more convenient way of doing this, using the third argument of the `render` and `include` functions to specify the template to be extended. Technically, an "extend" template is just a regular template with a special variable `${extend}`, where child template will be injected. As with the `include` function, autoescape must be disabled with the syntax `$${extend}`.

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

### Condition

Conditional display of variables can easily be done with a ternary structure.

```js
const engine = new Engine()
engine.template('content', '<p>${ isAlive ? "Kenny" : "Ghost" }</p>')
const result = engine.render('content', { isAlive: true })
// <p>Kenny</p>
```

For cases that are more complicated or too verbose to be written directly into the template, it is still possible to use a function, added as a helper to the engine.

```js
const engine = new Engine({
    helpers: {
        showKenny: (isAlive) => (isAlive ? 'Kenny' : 'Ghost'),
    },
})
engine.template('content', '<p>${ showKenny(isAlive) }</p>')
console.log(engine.render('content', { isAlive: false }))
// <p>Ghost</p>
```

### Loop

Another important point in using a model engine is the ability to loop. You can do this very simply, once again using one of javascript's native functions, `map`.

```js
const engine = new Engine()
engine.template('li', "<li>${ alive ? '😐' : '🫥' } ${name}</li>")
engine.template('ul', '<ul>${ list.map((li)=>include("li", { ...li })) }</ul>')
const list = [
    { name: 'Eric Cartman', alive: true },
    { name: 'Kyle Broflovski', alive: true },
    { name: 'Kenny McCormick', alive: false },
    { name: 'Stan Marsh', alive: true },
]
console.log(engine.render('ul', { list }))
/*
<ul>
    <li>😐 Eric Cartman</li>
    <li>😐 Kyle Broflovski</li>
    <li>🫥 Kenny McCormick</li>
    <li>😐 Stan Marsh</li>
</ul>
*/
```

### Debugging

There's an engine constructor option for displaying errors directly in templates during the development phase, the `debug` option, which is a boolean set to `false` by default. All templates errors are logged to `process.stderr`, but it can be more convenient to have them directly in the rendered page.

```js
const engine = new Engine({ debug: true })
```

You can of course `${console.log(myvar)}` in a template to dump `myvar` in server console, and see what you can do with it.

But it can be sometimes difficult to know exactly what are the variables available in a template or a sub-template, and you can't do a `console.log()` without an effective variable name. In this case, you can print a special variable, named... `${variables}`, which print a sorted and coma's separated list of actual variable names.

## Credits

Freely adapted from brilliants [template-literals-engine](https://github.com/ahmadnassri/node-template-literals-engine) and [escape-html](https://github.com/component/escape-html)
