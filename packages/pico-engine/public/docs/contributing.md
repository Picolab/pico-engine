# Contributing


To run the pico-engine in development mode do the following:

```sh
$ git clone https://github.com/Picolab/pico-engine.git
$ cd pico-engine
$ npm run setup
$ npm start
```

That will start the server and run the test. `npm start` is simply an alias for `cd packages/pico-engine && npm start`

**NOTE about dependencies:** generally don't use `npm i`, rather use `npm run setup` from the root. [lerna](https://github.com/lerna/lerna) will link up the packages so when you make changes in one package, it will be used in others.

## Improving documentation

This documentation site is found in the [docs](https://github.com/Picolab/pico-engine/tree/master/docs) folder at the repository root. The pages are simple markdown files. It uses [docsify](https://docsify.js.org/) to serve it.

To preview changes run the docsify local server using `npm run docs`. Then open your browser to the "Listening at" url.

## Making changes

Use a branch (or fork) to do your work. When you are ready, create a pull request. That way we can review it before merging it into master. (See the git cheatsheet below)

### git cheatsheet

```sh
# list your checked out branches
git branch

# list all branches including remote ones you don't have checked out
git branch -a

# checkout a remote branch
git checkout -t origin/<branch>

# switch branches
git checkout <branch>
git checkout master

# create a new branch off master
git checkout -b <branch> master

# push your local branch to github
git push -u origin <branch>

# to update your branch with the latest in master
git checkout master
git pull
git checkout <branch>
git merge master


# Use github to merge your branch into master using a pull request.
# On github use the "new pull request" button to make a PR for merging.
# Once the PR is merged you can delete the branch using the button on github.


# Even though the branch is deleted on github, it won't delete it off your local machine.
# to delete a local branch
git branch -d <branch>
```
