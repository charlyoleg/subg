README of subg
==============

Presentation
------------

*subg* is a *javascript* library and command-line tool for managing sub-repositories.
It currently supports only *git* repositories.

This project is inspired by [vcstool](https://github.com/dirk-thomas/vcstool)
and [simplest-git-repos](https://github.com/jmnavarrol/simplest-git-subrepos).

Using the *subg* CLI
--------------------

In a terminal, run:

```shell
npx subg help
npx subg pull
npx subg status
npx subg diff
npx subg push
```

Using the *subg* API
--------------------

In your script.js:

```javascript
import subg from 'subg';

cont subg_response = await subg.pull();
```

Contributing to this package
----------------------------

In a terminal, run:

```shell
git clone https://github.com/charlyoleg/subg.git
cd subg
npm install
npm run build
node build/subg.js
node build/subg.js help
node build/subg.js pull
node build/subg.js status
node build/subg.js diff
node build/subg.js push
```
