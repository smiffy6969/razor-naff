# Razor NAFF Web Component Helper Library


Razor NAFF is a helper library to make it easier to create native web components written in vanilla javascript, it aims to keep out of your way, allowing you to create native web components without any framework, razor NAFF is not a framework, it is a helper library.

Various tools are available, allowing you to apply templates to custom elements, find base scope of the custom element from any children and even let you search for other scopes to run native JS protoype functions. The idea behind NAFF was to provide a simple way to create web components with internal logic without pulling you away from native JS.

This library also comes with its own suite of web components that use this library to help give you a good place to start building apps and website right away.


## Installation  


Razor NAFF is located on git hub [TBD] and can be downloaded from there, or the prefered method is to use bower.

You may use the --save flag to store installation info in a central project bower.json file, if you do not have one already, you can do this first.


```
bower init
```


Installing is simple via bower in the command line, from your project root folder...


```
bower install razor-naff-components --save
```


## Setup


In order to use the NAFF library, you need to include it, best to include it after any polyfills such as webcomponentsjs.


```html
<script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
<script src="bower_components/razor-naff/build/naff.min.js"></script>
```


Now we have the polyfills and NAFF installed, so we can use the pair together to build native web components (you can swap webcomponentsjs with others is you wish, such as x-tags).


## Usage


To use the NAFF library, it all starts with a call to naff(), which is the base function for NAFF. We do this in JS as follows...


```javascript
naff();
```


This constructor function will do nothing more than setup the naff internal obect with a base working object, which will not do much apart from allow you to run other functions such as...


```javascript
naff().someCrazyAssFunction();
```


Whilst this will allow you access to internal functions, they probably will not do much without a starting point to work from. NAFF works by first being given an insertion point for reference, this allows it to work out from here, where to go and what to do to what, like find the base scope for a custom element (a scope is the root of where your custom element logic is built which is actually the dom custom element, as all methods and properties of your custom object are prototypes of the dom element).


```javascript
var scope = naff(this).getScope();
scope.someCustomElementFunction();
// or
naff(this).getScope().someCustomElementFunction();
```


These two snippets to the same thing, both take in the current point in the dom, and allow you to get the scope of the containing custom element you are working in. It then runs a function on the scope returned, which could be evaluated to


```javascript
var scope = document.querySelector('x-foo');
scope.someCustomElementFunction();
// or
document.querySelector('x-foo').someCustomElementFunction();
```


The difference with NAFF and native selection is that in the NAFF example, we search backwards out through the parents until we find the scope of the custom element, meaning our custom element code will work on all instances of <x-foo></x-foo> without issue, whereas the native selector method will only work on the first x-foo element it finds. This is how we can map functions from templates in custom elements children direct to the containing custom element scope when building web components like this...


```html
<template id="x-foo">
	<div class="test">
		<button onclick="naff(this).getScope().someFunctionOfXFoo()"></button>
	</div>
</template>
```


This allows us to map this login back to the custom x-foo logic in the web component file


```html
<template id="x-foo">
	<div class="test">
		<button onclick="naff(this).getScope().pushed()"></button>
		<content></content>
	</div>
</template>

<script>
(function()
{
	/* SETUP */

	// setup new prototype for custom element
	var xFooProto = Object.create(HTMLElement.prototype);

	// apply template to element (if any)
	xFooProto.template = document._currentScript.ownerDocument.querySelector('#x-foo');

	// on created, apply template
	xFooProto.createdCallback = function() {
		naff(this).applyTemplate();
	};

	/* ELEMENT */

	xFooProto.pushed = function() {
	  console.log('pushed() called');
	};

	/* INSERTION */

	// register custom element
	document.registerElement('x-foo', { prototype: xFooProto });
})()
</script>
```


The button click in the html is mapped back to the root scope of the custom element.


You will also note that there is another naff function in that code, the call to apply the template to the to the custom element once itis created. This call back function fires when a custom element is create in the dom. Once it has been created we need to apply the template to it to render the contents, so we use the NAFF helper function to do this as it takes care of the work for us. NAFF creates an instance base on 'this' (which in this case is the custom element which is actuall inserted into the dom), and it applies the template found at xFooProto.template and merges the content together (using `<content></content>` style tags to embed the code into the template from the '<x-foo></x-foo>' element).

Just like shadow dom you can also embed various content in various places using things like '<heading></heading>' in the custom element tag and `<content select="heading"></content>` in the template to located specific content in specic places in the returned template.


In addtion to `getScope()` there is also `findScope()`, `getParentScope()`, `findParentScope()`... these allow us to traverse many custom element scopes, get hold of containing parent custom element scopes and so on, as well as using selectors if you wish...


```javascript
naff('.some-custom-element').getScope(); // .some-custom-element scope
naff('.some-custom-element').getParentScope(); // .some-custom-element-parent scope
naff(this).getParentScope('top-most-custom-element-id'); // top-most-custom-element scope, this one starts at 'this' looking backwards until it matches the id of the custom element
```


## Properties

* __origin__ - The insertion point of NAFF.
* __scope__ - The scope of the containing web component.
* __originCopy__ - An unaltered copy of the custom element before applying template changes when applying template.
* __originAltered__ - A copy of the custom element after applying template changes


## Methods


### naff(selector)


```javascipt
naff(this);
naff('#test.my[element=please]');
```


The constructor, used to access functions and properties of NAFF by setting up the NAFF object with a reference insertion point to work from.


* __selector__ - Can be a query selector or reference such as 'this'


### findScope()


```javascipt
var ce = naff(this).findScope();
console.log(ce.scope);
```


Finds the current elements containing custom element scope.


### findParentScope(id)


```javascipt
var ce = naff(this).findParentScope('x-foo');
console.log(ce.scope);
```


Finds the current elements parent containing custom element scope, uses an optional id to keep looking back until a match is found.


* __id__ [optional] - The id of the parent scopes template to search for, which happens to be the custom element tag name too as you use it in your html.


### getScope()


```javascipt
var scope = naff(this).getScope();
console.log(scope);
```


Finds the current elements containing custom element scope, and returns its scope.


### getParentScope(id)


```javascipt
naff(this).getParentScope('x-foo');
console.log(scope);
```


Finds the current elements parent containing custom element scope, uses an optional id to keep looking back until a match is found and returns the scope.


* __id__ [optional] - The id of the parent scopes template to search for, which happens to be the custom element tag name too as you use it in your html.


### applyTemplate()


```javascipt
// setup new prototype for custom element
var xFooProto = Object.create(HTMLElement.prototype);

// apply template to element (if any)
xFooProto.template = document._currentScript.ownerDocument.querySelector('#x-foo');

// on created, apply template
xFooProto.createdCallback = function() {
	naff(this).applyTemplate();
};
```


use this to apply the template to the custom element, this should be done after the element is created using the callback on the prototype of the web component when building it. All content in the containing element will be merged into the template content using content elements as so...


```html
<!-- in your base html document -->
<x-foo>
	<p>Put this in custom element</p>
</x-foo>

<!-- in your web component template -->
<template id="x-foo">
	<h1>Hello</h1>
	<content></content>
</template>

<!-- gives you the following in your base html document -->
<x-foo>
	<h1>Hello</h1>
	<p>Put this in custom element</p>
</x-foo>
```


```html
<!-- in your base html document -->
<x-foo>
	<main><p>Put this in custom element main</p></main>
	<footer><p>Put this in custom element footer</p></footer>
</x-foo>

<!-- in your web component template -->
<template id="x-foo">
	<div class="test">
		<button onclick="naff(this).getScope().pushed()"></button>
		<content select="main"></content>
	</div>
	<content select="footer"></content>
</template>

<!-- gives you the following in your base html document -->
<x-foo>
	<div class="test">
		<button onclick="naff(this).getScope().pushed()"></button>
		<main><p>Put this in custom element main</p></main>
	</div>
	<footer><p>Put this in custom element footer</p></footer>
</x-foo>
```


__WIP... TO BE CONTINUED...__