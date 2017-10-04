# git cheatsheet

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
